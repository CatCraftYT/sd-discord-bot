import { DiscordRequest } from './utils.js';
import isEqual from "lodash.isequal"

export async function HasGuildCommands(appId, guildId, commands) {
    if (guildId === '' || appId === '') return;

    return commands.forEach((c) => HasGuildCommand(appId, guildId, c));
}

// Checks for a command
async function HasGuildCommand(appId, guildId, command) {
    // API endpoint to get and post guild commands
    const endpoint = `applications/${appId}/guilds/${guildId}/commands`;

    try {
        const res = await DiscordRequest(endpoint, { method: 'GET' });
        const data = await res.json();

        // have to compare each element rather than comparing directly since response has extra keys
        const remoteCommand = data.filter((element) => element["name"] === command["name"])[0];
        const kvPairs = Object.entries(command);
        for (let element = 0; element < kvPairs.length; element++) {
            if (!isEqual(remoteCommand[kvPairs[element][0]], kvPairs[element][1]))
            {
                console.log(`Installing command "${command['name']}"`);
                InstallGuildCommand(appId, guildId, command);
                return;
            }
        }
        console.log(`"${command['name']}" command already installed`);

    } catch (err) {
        console.error(err);
    }
}

// Installs a command
export async function InstallGuildCommand(appId, guildId, command) {
    // API endpoint to get and post guild commands
    const endpoint = `applications/${appId}/guilds/${guildId}/commands`;
    // install command
    try {
        await DiscordRequest(endpoint, { method: 'POST', body: command });
    } catch (err) {
        console.error(err);
    }
}