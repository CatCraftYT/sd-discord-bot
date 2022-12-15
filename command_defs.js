
import { GetStyles, GetSamplers, GetModels } from './sd_api.js';

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

export const CHANGEMODEL = {
    name: "model",
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
};