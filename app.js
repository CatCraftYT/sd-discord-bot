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
import { Text2Img, SetModel, GetProgress } from './sd_api.js';
import { verifyKeyMiddleware } from 'discord-interactions';
import * as commands from './command_defs.js';
import { DiscordRequest } from './utils.js';

const IMAGE_UPDATE_DELAY = 2000;
let currentlyGenerating = false;
var currentToken;

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
      commands.CHANGEMODEL,
    ]);
  });

async function HandleInteraction(req, res)
{
    const { type, token, data } = req.body;

    if (type === InteractionType.PING) {
        return res.send({ type: InteractionResponseType.PONG });
    }

    if (type === InteractionType.APPLICATION_COMMAND) {
        HandleCommand(token, data, res);
    }
}

async function HandleCommand(token, data, res)
{
    const options = data["options"];

    if (data["name"] === commands.CHANGEMODEL["name"])
    {
        SetModel(options[0]["value"]);
        return res.send({type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: {content: "> Model changed to `" + options[0]["value"] + "`"}});
    }

    if (currentlyGenerating !== true) {
        if (data["name"] === commands.TXT2IMG["name"])
        {
            Text2Img(options[0], options[1], options[2], options[3], options[4], options[5], options[6])//.then(json => EndImageGeneration(json["images"][0]));
            currentlyGenerating = true;
            UpdateImageLoop(token, options[0]);
            return res.send({type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: {content: "> Generating image with prompt: `" + options[0]["value"] + "`"}});
        }
    }
    else {
        return res.send({type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: {content: "Another generation is already in progress - please wait until it is complete.", flags: InteractionResponseFlags.EPHEMERAL}});
    }
}

async function UploadImageAttachment(token, image, filename)
{
    const endpoint = `webhooks/${process.env.APP_ID}/${token}/messages/@original`;
    let attachmentId = (Date.now - 1420070400000) << 22
    let body = {
        attachments: [{
            id: attachmentId
        }],
        [`files[${attachmentId}]`]: `data:image/png;base64,${image}`
    }

    DiscordRequest(endpoint, {
        method: 'patch',
        body:    body,
        headers: {
            "Content-Disposition":`name=${attachmentId}; filename=${filename}`
        }
    });
}

async function UpdateImageLoop(token, prompt)
{
    var progress;

    while (currentlyGenerating)
    {
        let json = await GetProgress();
        if (json["current_image"] === undefined) { continue; }
        console.log(json);
        progress = json["progress"];
        UploadImageAttachment(token, json["current_image"], prompt);
        
        await new Promise(resolve => setTimeout(resolve, IMAGE_UPDATE_DELAY));;
    }
}

async function EndImageGeneration(finalImage)
{
    currentlyGenerating = false;
    UploadImageAttachment(finalImage, "image.png");
}
