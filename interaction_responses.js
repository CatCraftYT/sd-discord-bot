import {
    InteractionResponseType,
    InteractionResponseFlags,
    MessageComponentTypes,
    ButtonStyleTypes,
  } from 'discord-interactions';

const REMIX_BUTTON = {
    type: MessageComponentTypes.BUTTON,
    label: "Remix",
    style: ButtonStyleTypes.SECONDARY,
    custom_id: "RemixButton",
    emoji: {
        id: null,
        name: "♻️"
    }
}

const REGEN_BUTTON = {
    type: MessageComponentTypes.BUTTON,
    label: "Regenerate",
    style: ButtonStyleTypes.SECONDARY,
    custom_id: "RegenButton",
    emoji: {
        id: null,
        name: "🔁"
    }
}

const UPSCALE_BUTTON = {
    type: MessageComponentTypes.BUTTON,
    label: "Upscale",
    style: ButtonStyleTypes.SECONDARY,
    custom_id: "UpscaleButton",
    emoji: {
        id: null,
        name: "⏫"
    }
}

export function CreateBusyResponse()
{
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: "Another task is in progress - please wait until it is complete.",
            flags: InteractionResponseFlags.EPHEMERAL
        }
    }
}

export function CreateText2ImgReponse(options)
{
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: `> Generating image with prompt: \`${options["prompt"]}\`, seed: \`${options["seed"]}\``,
            components: [{
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [REMIX_BUTTON, REGEN_BUTTON, UPSCALE_BUTTON]
                }]
        }
    }
}

export function CreateImg2ImgReponse(options)
{
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: `Generating image (img2img) with prompt: \`${options["prompt"]}\`, seed: \`${options["seed"]}\`, URL \`${options["url"]}\``,
            components: [{
                type: MessageComponentTypes.ACTION_ROW,
                components: [REMIX_BUTTON, REGEN_BUTTON, UPSCALE_BUTTON]
            }]
        }
    }
}

export function CreateRemixReponse(guildID, channelID, messageID)
{
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: `Creating remix image of generation: https://discord.com/channels/${guildID}/${channelID}/${messageID}`,
            components: [{
                type: MessageComponentTypes.ACTION_ROW,
                components: [REMIX_BUTTON, REGEN_BUTTON, UPSCALE_BUTTON]
            }]
        }
    }
}

export function CreateUpscaleReponse(guildID, channelID, messageID)
{
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: `Creating 2x upscale image of generation: https://discord.com/channels/${guildID}/${channelID}/${messageID}`
        }
    }
}
