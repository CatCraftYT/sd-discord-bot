import DiscordRequest from './utils.js';
import { GetStyles, GetSamplers, GetModels } from './sd_api.js';

COMMAND_TXT2IMG = {
    name: "Text to Image",
    type: 1,
    description: "Create an image from a prompt.",
    options: [
        {
            name: "prompt",
            description: "Input prompt.",
            type: 3,
            required: true
        },
        {
            name: "neg_prompt",
            description: "Negative prompt. SD will avoid these things.",
            type: 3,
        },
        {
            name: "style",
            description: "Style to use.",
            type: 3,
            choices: GetStyles()
        },
        {
            name: "seed",
            description: "Number that controls output image. -1 is random seed.",
            type: 4,
            min_value: -1
        },
        {
            name: "sampler",
            description: "SD sampler (changes how the image looks).",
            type: 3,
            choices: GetSamplers()
        },
        {
            name: "steps",
            description: "Number of sampling steps. More steps make the image cleaner (usual optimum is 80).",
            type: 4,
            min_value: 1,
            max_value: 150
        },
        {
            name: "cfg_scale",
            description: "Higher values will make SD adhere to the prompt more strongly.",
            type: 4,
            min_value: 1,
            max_value: 20
        },
    ]
};

COMMAND_CHANGEMODEL = {
    name: "Change model",
    type: 1,
    description: "Change the current model.",
    options: [
        {
            name: "model",
            description: "Model to change to.",
            type: 3,
            required: true,
            choices: GetModels()
        },
    ]
}

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

    if (data) {
      const installedNames = data.map((c) => c['name']);
      // This is just matching on the name, so it's not good for updates
      if (!installedNames.includes(command['name'])) {
        console.log(`Installing "${command['name']}"`);
        InstallGuildCommand(appId, guildId, command);
      } else {
        console.log(`"${command['name']}" command already installed`);
      }
    }
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