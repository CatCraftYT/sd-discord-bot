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
import { Text2Img, SetModel } from './sd_api.js';
import { verifyKeyMiddleware } from 'discord-interactions';
import * as commands from './command_defs.js';

let currentlyGenerating = false;

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

    if (data["name"] === commands.TXT2IMG["name"])
    {
        if (currentlyGenerating === true) {
            return res.send({type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: {content: "Another generation is already in progress - please wait until it is complete.", flags: InteractionResponseFlags.EPHEMERAL}});
        }
        else {
            Text2Img(options[0], options[1], options[2], options[3], options[4], options[5], options[6]);
            currentlyGenerating = true;
        }
        return res.send({type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: {content: "> Generating image with prompt: `" + options[0]["value"] + "`"}});
    }

    if (data["name"] === commands.CHANGEMODEL["name"])
    {
        SetModel(options[0]["value"]);
        return res.send({type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE, data: {content: "> Model changed to `" + options[0]["value"] + "`"}});
    }
}
