
import { GetStyles, GetSamplers, GetModels } from './sd_api.js';

// this stuff will execute first so the webui waiting needs to be here
console.log("Don't forget to add interaction endpoint in discord application! (https://discord.com/developers/applications)")
console.log("Waiting for webui api...");
while (true)
{
    try {
        await GetStyles();
    }
    catch {
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
    }
    break;
}
console.log("Webui response recieved.");

// options MUST be the same as sd_api because of kwargs
// ***remember to add any new commands to list at the bottom***
// option types: https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type

export const TXT2IMG = {
    name: "text2img",
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
            name: "aspect_ratio",
            description: "Aspect ratio of generated image.",
            type: 3,
            choices: [
                {"name": "1:1", "value": "1:1"},
                {"name": "7:4 (near 16:9)", "value": "7:4"}
            ]
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

export const IMG2IMG = {
    name: "img2img",
    type: 1,
    description: "Create an image from a prompt and another image.",
    options: [
        {
            name: "prompt",
            description: "Input prompt.",
            type: 3,
            required: true
        },
        {
            name: "url",
            description: "URL for input image. Must be discord attachment link (starts with https://cdn.discordapp.com)",
            type: 3,
            required: true
        },
        {
            name: "neg_prompt",
            description: "Negative prompt. SD will avoid these things.",
            type: 3,
        },
        {
            name: "denoising_strength",
            description: "[0-1] The denoising strength. The higher this is, the less SD will adhere to the input image.",
            type: 10,
            min_value: 0,
            max_value: 1
        },
        {
            name: "style",
            description: "Style to use.",
            type: 3,
            choices: GetStyles()
        },
        {
            name: "aspect_ratio",
            description: "Aspect ratio of generated image.",
            type: 3,
            choices: [
                {"name": "1:1", "value": "1:1"},
                {"name": "7:4 (near 16:9)", "value": "7:4"}
            ]
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
            description: "[1-150] Number of sampling steps. More steps make the image cleaner (usual optimum is 80).",
            type: 4,
            min_value: 1,
            max_value: 150
        },
        {
            name: "cfg_scale",
            description: "[1-20] Higher values will make SD adhere to the prompt more strongly.",
            type: 4,
            min_value: 1,
            max_value: 20
        },
    ]
};

export const CHANGEMODEL = {
    name: "model",
    type: 1,
    description: "Change/query the current model.",
    options: [
        {
            name: "change",
            description: "Change the current model.",
            type: 1,
            options: [{
                name: "model",
                description: "Model to change to.",
                type: 3,
                required: true,
                choices: GetModels()
            }]
        },
        {
            name: "query",
            description: "Query the current model.",
            type: 1,
        },
    ]
};

export const CANCEL_GENERATION = {
    name: "cancel",
    type: 1,
    description: "Cancel the current generation and delete the message.",
};

export const commands = [TXT2IMG, IMG2IMG, CHANGEMODEL, CANCEL_GENERATION];
