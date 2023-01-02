import 'dotenv/config';
import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
} from 'discord-interactions';
import { HasGuildCommands } from './commands_handler.js';
import { Text2Img, Img2Img, SetModel, GetProgress } from './sd_api.js';
import { verifyKeyMiddleware } from 'discord-interactions';
import * as commands from './command_defs.js';
import { ConvertOptionsToDict, DiscordSendImage, IsValidDiscordCDNUrl } from './utils.js';
import { CreateImg2ImgReponse, CreateText2ImgReponse, CreateRemixReponse } from './interaction_responses.js';
import { StartGateway, StopGateway } from './gateway.js';

const IMAGE_UPDATE_DELAY = 2000;
let currentlyGenerating = false;

process.on("SIGINT", () => {
    StopGateway();
    process.exit(0);
});
await StartGateway();

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(verifyKeyMiddleware(process.env.PUBLIC_KEY));

app.post('/', HandleInteraction)
app.listen(PORT, () => {
    // Check if guild commands from commands.js are installed (if not, install them)
    HasGuildCommands(process.env.APP_ID, process.env.GUILD_ID, [
      commands.TXT2IMG,
      commands.IMG2IMG,
      commands.CHANGEMODEL,
    ]);
  });

async function HandleInteraction(req, res)
{
    const { type, token, data, message, guild_id } = req.body;

    if (type === InteractionType.PING) {
        return res.send({ type: InteractionResponseType.PONG });
    }

    if (type === InteractionType.APPLICATION_COMMAND) {
        HandleCommand(token, data, res);
    }

    if (type === InteractionType.MESSAGE_COMPONENT) {
        HandleComponentInteraction(token, message, guild_id, data, res);
    }
}

async function HandleComponentInteraction(token, message, guild_id, data, res)
{
    if (data["custom_id"] === "RemixButton") {
        console.log(`Remixing image, Message ID = "${message["id"]}"`);
        //finds the prompt from the message
        const prompt = message["content"].match(/prompt: `(.*?)`/)[1];

        Img2Img({prompt: prompt, url: message["embeds"][0]["image"]["url"]}).then(json => EndImageGeneration(json["images"][0], token));

        currentlyGenerating = true;
        UpdateImageLoop(token);
        return res.send(CreateRemixReponse(guild_id, message["channel_id"], message["id"], prompt));
    }
}

async function HandleCommand(token, data, res)
{
    const options = ConvertOptionsToDict(data["options"]);

    if (data["name"] === commands.CHANGEMODEL["name"]) {
        SetModel(options["model"]);
        return res.send({type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: {content: "> Model changed to `" + options["model"] + "`"}});
    }

    if (currentlyGenerating !== true) {
        if (data["name"] === commands.TXT2IMG["name"]) {
            console.log(`Generating image with parameters: ${options}`);
            console.log(JSON.stringify(options));

            Text2Img(options).then(json => EndImageGeneration(json["images"][0], token));

            currentlyGenerating = true;
            UpdateImageLoop(token);
            return res.send(CreateText2ImgReponse(options));
        }

        if (data["name"] === commands.IMG2IMG["name"]) {
            console.log(`Generating image (img2img) with parameters: "${options}"`);
            console.log(JSON.stringify(options));

            const urlError = IsValidDiscordCDNUrl(options["url"])
            if (urlError) {
                res.send({type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: {content: urlError, flags: InteractionResponseFlags.EPHEMERAL}})
                return;
            }

            Img2Img(options).then(json => EndImageGeneration(json["images"][0], token));

            currentlyGenerating = true;
            UpdateImageLoop(token);
            return res.send(CreateImg2ImgReponse(options));
        }
    }
    else {
        return res.send({type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: {content: "Another generation is already in progress - please wait until it is complete.", flags: InteractionResponseFlags.EPHEMERAL}});
    }
}

async function UploadImageAttachment(token, image)
{
    const endpoint = `webhooks/${process.env.APP_ID}/${token}/messages/@original`;
    //let attachmentId = (Date.now - 1420070400000) << 22
    
    DiscordSendImage(endpoint, image);
}

async function UpdateImageLoop(token)
{
    var progress;

    while (currentlyGenerating)
    {
        let json = await GetProgress();
        if (json["current_image"] === null) { continue; }
        progress = json["progress"];
        console.log(`Generation progress: ${progress*100}%`);
        await UploadImageAttachment(token, json["current_image"]);
        
        await new Promise(resolve => setTimeout(resolve, IMAGE_UPDATE_DELAY));
    }
}

async function EndImageGeneration(finalImage, token)
{
    currentlyGenerating = false;
    UploadImageAttachment(token, finalImage);
    console.log("Generation completed.")
}
