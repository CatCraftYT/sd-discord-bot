import 'dotenv/config';
import fetch from 'node-fetch';

const api = 'https://discord.com/api/v10/';

// from https://github.com/discord/discord-example-app
export async function DiscordRequest(endpoint, options) {
    // append endpoint to root API URL
    const url = api + endpoint;
    // Stringify payloads
    if (options.body) { options.body = JSON.stringify(options.body); }
    // Use node-fetch to make requests
    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'User-Agent': 'sd-discord-bot',
        },
        ...options
    });
    // throw API errors
    if (!res.ok) {
        const data = await res.json();
        console.log(res.status);
        throw new Error(JSON.stringify(data));
    }
    // return original response
    return res;
}

// filename needs to be alphanumeric + dots and underscores (**without extension**)
export async function DiscordSendImage(endpoint, image, filename)
{
    const boundary = "bMfzKPBnqw8jvzPzXmfBDxZ9aQ4Jd4Df3QQWg4nuFwnG4nC2BT";
    const body = `
--${boundary}
Content-Disposition: form-data; name="payload_json"
Content-Type: application/json

{
    "embeds": [{
        "image": {
            "url": "attachment://${filename}.png"
        }
    }],

    "attachments": [{
        "id": 0,
        "filename": "${filename}.png"
    }]
}
--${boundary}
Content-Disposition: form-data; name="files[0]"; filename="${filename}.png"
Content-Type: image/png

`;

    const payload = Buffer.concat([
        Buffer.from(body, 'utf-8'),
        Buffer.from(image, 'base64'),
        Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const response = await fetch(api + endpoint, {
        method: 'patch',
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'User-Agent': 'sd-discord-bot',
        },
        body: payload
    });

    if (!response.ok) {
        const data = await response.json();
        console.warn(`HTTP Error in DiscordSendImage (res code ${response.status}): ${JSON.stringify(data)}`);
    }
    return response;
}

export function IsValidDiscordCDNUrl(url)
{
    try
    {
        if (new URL(url).hostname !== "cdn.discordapp.com") { return "Invalid url for img2img. Use discord attachment link (cdn.discordapp.com)."; }
    }
    catch (exception)
    {
        if (exception instanceof TypeError) { return "Invalid URL. It should start with `https://cdn.discordapp.com`"; }
        throw exception;
    }
    return "";
}

export function FormatOptions(data, name = [])
{
    name.push(data["name"]);

    let dict = {};
    const options = data["options"];
    if (options && options[0]["type"] === 1) {
        return FormatOptions(options[0], name);
    }
    
    for (var i in options) {
        dict[options[i]["name"]] = options[i]["value"];
    }
    return [name, dict];
}
