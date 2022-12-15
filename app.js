import 'dotenv/config';
import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
} from 'discord-interactions';
import HasGuildCommands from './commands_handler';
import * as commands from './command_defs';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

app.post('/interactions', HandleInteraction)
app.listen(PORT, () => {
    console.log('Listening on port', PORT);
  
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
        HandleCommand(token, data)
    }
}

function HandleCommand(token, data)
{
    if (data["name"] === commands.TXT2IMG["name"])
    {

    }
}
