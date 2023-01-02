import {
    InteractionType,
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

export function CreateText2ImgReponse(options)
{
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: `> Generating image with prompt: \`${options["prompt"]}\``,
            components: [{
                    type: MessageComponentTypes.ACTION_ROW,
                    components: [REMIX_BUTTON]
                }]
        }
    }
}

export function CreateImg2ImgReponse(options)
{
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: `Generating image (img2img) with prompt: \`${options["prompt"]}\`, URL \`${options["url"]}\``,
            components: [{
                type: MessageComponentTypes.ACTION_ROW,
                components: [REMIX_BUTTON]
            }]
        }
    }
}

export function CreateRemixReponse(guildID, channelID, messageID, prompt)
{
    return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: `Creating remix image of generation: https://discord.com/channels/${guildID}/${channelID}/${messageID}
With prompt: \`${prompt}\``,
            components: [{
                type: MessageComponentTypes.ACTION_ROW,
                components: [REMIX_BUTTON]
            }]
        }
    }
}
