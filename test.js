import { DiscordRequest } from './utils.js';
import util from 'util'
import { commands } from "./command_defs.js"
import isEqual from "lodash.isequal"

const endpoint = `applications/${process.env.APP_ID}/guilds/${process.env.GUILD_ID}/commands`;

const res = await DiscordRequest(endpoint, { method: 'GET' });
const data = await res.json();
//console.log(util.inspect(data, false, null, true));

const command = commands[0]

const remoteCommand = data.filter((element) => element["name"] === command["name"])[0];
console.log(remoteCommand);
const kvPairs = Object.entries(command);
for (let element = 0; element < kvPairs.length; element++) {
    if (!isEqual(remoteCommand[kvPairs[element][0]], kvPairs[element][1]))
    {
        console.log(`Installing command "${command['name']}"`);
        break;
    }
}
console.log(`"${command['name']}" command already installed`);
