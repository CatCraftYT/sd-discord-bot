import 'dotenv/config';
import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
} from 'discord-interactions';
import { HasGuildCommands } from './commands_handler.js';
import { Text2Img, Img2Img, SetModel, GetProgress, SendGenInterrupt, Upscale, GetCurrentModel } from './sd_api.js';
import { verifyKeyMiddleware } from 'discord-interactions';
import * as commands from './command_defs.js';
import { FormatOptions, DiscordRequest, DiscordSendImage, IsValidDiscordCDNUrl } from './utils.js';
import { CreateImg2ImgReponse, CreateText2ImgReponse, CreateRemixReponse, CreateBusyResponse, CreateUpscaleReponse, CreateRegenReponse } from './interaction_responses.js';
import { StartGateway, StopGateway } from './gateway.js';
import * as csv from './csv.js';

const IMAGE_UPDATE_DELAY = 2000;
let currentlyBusy = false;
let currentToken = null;

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
    HasGuildCommands(process.env.APP_ID, process.env.GUILD_ID, commands.commands);
  });

async function HandleInteraction(req, res)
{
    const { type, token, data, message, guild_id, member } = req.body;

    if (type === InteractionType.PING) {
        return res.send({ type: InteractionResponseType.PONG });
    }

    console.log(`Recieved interaction from member: "${member["user"]["username"]}" (${member["user"]["id"]})`);
    if (type === InteractionType.APPLICATION_COMMAND) {
        HandleCommand(token, data, member, res);
    }

    if (type === InteractionType.MESSAGE_COMPONENT) {
        HandleComponentInteraction(token, message, guild_id, data, member, res);
    }
}

async function HandleComponentInteraction(token, message, guild_id, data, member, res)
{
    if (currentlyBusy !== true)
    {
        // get the filename, remove the extension with regex, then decode from base64url
        const url = message["embeds"][0]["image"]["url"];
        const oldGenId = url.substr(url.lastIndexOf("/") + 1).replace(/\.\w+$/g, "");
        const options = {...JSON.parse(await csv.ReadEntry(oldGenId)), member: member["user"]["id"]};
        if (options === null) {
            return res.send({type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: {content: "This feature is unavailable for this generation.", flags: InteractionResponseFlags.EPHEMERAL}})
        }

        if (data["custom_id"] === "RemixButton") {
            console.log(`Remixing image, Message ID = "${message["id"]}"`);
            const genId = Math.floor(Number.MAX_SAFE_INTEGER * Math.random());
            csv.WriteEntry(genId, JSON.stringify({...options, interaction_token: token}));

            // change some important options for remixes in the new options
            const newOptions = {...options, denoising_strength: 0.5, seed: Math.floor(Number.MAX_SAFE_INTEGER * Math.random()), url: message["embeds"][0]["image"]["url"]};
            Img2Img(newOptions).then(json => EndImageGeneration(json["images"][0], token, genId));

            currentlyBusy = true;
            currentToken = token;
            UpdateImageLoop(token, genId);
            return res.send(CreateRemixReponse(guild_id, message["channel_id"], message["id"]));
        }

        if (data["custom_id"] === "RegenButton") {
            // check if interaction token has expired (830 is 15mins - 30s for safety)
            if ((new Date(message["timestamp"])).getTime() + 900000 < Date.now()) {
                return res.send({type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: {content: "This generation is too old. Maximum time for regeneration is 15mins.", flags: InteractionResponseFlags.EPHEMERAL}})
            }
            console.log(`Regenerating image, Message ID = "${message["id"]}"`);
            const genId = Math.floor(Number.MAX_SAFE_INTEGER * Math.random());

            // re-gen the seed
            const newOptions = {...options, seed: Math.floor(Number.MAX_SAFE_INTEGER * Math.random())};
            csv.WriteEntry(genId, JSON.stringify(options));

            switch (options["gen_type"]) {
                case commands.TXT2IMG["name"]:
                    Text2Img(newOptions).then(json => EndImageGeneration(json["images"][0], options["interaction_token"], genId));
                    break;
                case commands.IMG2IMG["name"]:
                    Img2Img(newOptions).then(json => EndImageGeneration(json["images"][0], options["interaction_token"], genId));
                    break;
                default:
                    console.log("gen_type is missing/malformed.");
                    return;
            }

            currentlyBusy = true;
            currentToken = options["interaction_token"];
            UpdateImageLoop(options["interaction_token"], genId);
            return res.send(CreateRegenReponse(guild_id, message["channel_id"], message["id"]));
        }

        if (data["custom_id"] === "UpscaleButton") {
            console.log(`Upscaling image, Message ID = "${message["id"]}"`);

            Upscale(url).then(json => { UploadImageAttachment(token, json["image"], options["prompt"]); currentlyBusy = false });

            currentlyBusy = true;
            return res.send(CreateUpscaleReponse(guild_id, message["channel_id"], message["id"]));
        }
    }
    else {
        return res.send(CreateBusyResponse());
    }
}

async function HandleCommand(token, data, member, res)
{
    const optionData = FormatOptions(data);
    const name = optionData[0];
    const options = {...optionData[1], interaction_token: token, member: member["user"]["id"]};

    if (name[0] === commands.CANCEL_GENERATION["name"]) {
        if (currentToken !== null) {
            console.log("Current generation canceled.");
            await DiscordRequest(`webhooks/${process.env.APP_ID}/${currentToken}/messages/@original`, {method: "DELETE"});
            await SendGenInterrupt();
            currentToken = null;
            currentlyBusy = false;
    
            return res.send({type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: {content: "> Current generation canceled."}});
        }
        else {
            res.send({type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: {content: "No ongoing generation to cancel.", flags: InteractionResponseFlags.EPHEMERAL}})
        }
    }

    if (currentlyBusy !== true) {
        if (name[0] === commands.CHANGEMODEL["name"]) {
            if (name[1] === commands.CHANGEMODEL["options"][0]["name"]) {
                console.log(`Changing model to ${options["model"]}`);
                currentlyBusy = true;
                SetModel(options["model"]).then(() => {
                    DiscordRequest(`webhooks/${process.env.APP_ID}/${token}`, {method: "POST", body: {content: "Model changed."}});
                    currentlyBusy = false;
                });
        
                return res.send({type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: {content: `> Changing model to \`${options["model"]}\``}});
            }
            if (name[1] === commands.CHANGEMODEL["options"][1]["name"]) {
                return res.send({type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: {content: `> Current model is \`${await GetCurrentModel()}\``}});
            }
        }

        // change seed to known value so we can put it into the message
        if (options["seed"] === undefined || options["seed"] < 0) {
            options["seed"] = Math.floor(Number.MAX_SAFE_INTEGER * Math.random())
        }

        if (name[0] === commands.TXT2IMG["name"]) {
            console.log(`Generating image with parameters: ${JSON.stringify(options)}`);
			currentlyBusy = true;
            currentToken = token;
            const genId = Math.floor(Number.MAX_SAFE_INTEGER * Math.random());
            options["gen_type"] = commands.TXT2IMG["name"];
            csv.WriteEntry(genId, JSON.stringify(options));

            Text2Img(options).then(json => EndImageGeneration(json["images"][0], token, genId));

            UpdateImageLoop(token, genId);
            return res.send(CreateText2ImgReponse(options));
        }

        if (name[0] === commands.IMG2IMG["name"]) {
            console.log(`Generating image (img2img) with parameters: "${JSON.stringify(options)}"`);
			currentlyBusy = true;
            currentToken = token;
            const genId = Math.floor(Number.MAX_SAFE_INTEGER * Math.random());
            options["gen_type"] = commands.IMG2IMG["name"];
            csv.WriteEntry(genId, JSON.stringify(options));

            const urlError = IsValidDiscordCDNUrl(options["url"])
            if (urlError) {
                res.send({type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: {content: urlError, flags: InteractionResponseFlags.EPHEMERAL}})
                return;
            }

            Img2Img(options).then(json => EndImageGeneration(json["images"][0], token, genId));

            UpdateImageLoop(token, genId);
            return res.send(CreateImg2ImgReponse(options));
        }
    }
    else {
        return res.send(CreateBusyResponse());
    }
}

async function UploadImageAttachment(token, image, filename)
{
    const endpoint = `webhooks/${process.env.APP_ID}/${token}/messages/@original`;
    //let attachmentId = (Date.now - 1420070400000) << 22
    
    DiscordSendImage(endpoint, image, filename);
}

async function UpdateImageLoop(token, filename)
{
    var progress;

    while (currentlyBusy)
    {
        let json = await GetProgress();
        if (json["current_image"] === null) { continue; }
        if (token !== currentToken) { break; }  // this should stop generations made too soon after the last one finished from overriding the last generation
        progress = json["progress"];
        console.log(`Generation progress: ${progress*100}%`);
        await UploadImageAttachment(token, json["current_image"], filename);
        
        await new Promise(resolve => setTimeout(resolve, IMAGE_UPDATE_DELAY));
    }
}

async function EndImageGeneration(finalImage, token, filename)
{
    if (currentToken !== token) { return; }
    await UploadImageAttachment(token, finalImage, filename);
	currentlyBusy = false;
    currentToken = null;
    console.log("Generation completed.")
}
