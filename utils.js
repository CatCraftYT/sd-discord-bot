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

export async function DiscordSendImage(endpoint, image, filename, id)
{
    const boundary = "bMfzKPBnqw8jvzPzXmfBDxZ9aQ4Jd4Df3QQWg4nuFwnG4nC2BT";
    let body = `
--${boundary}
Content-Disposition: form-data; name="payload_json"
Content-Type: application/json

{
    "embeds": [{
        "thumbnail": {
          "url": "attachment://${filename}.png"
        },
        "image": {
          "url": "attachment://${filename}.png"
        }
    }],
    "attachments": [{
        "id": ${id},
        "filename": "${filename}.png"
    }]
}
--${boundary}
Content-Disposition: form-data; name="files[${id}]"; filename="${filename}.png"
Content-Type: image/png

${image}
--${boundary}
`;

    const res = await fetch(api + endpoint, {
        method: 'patch',
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            'Content-Type': `multipart/form-data; charset=UTF-8; boundary=${boundary}`,
            'User-Agent': 'sd-discord-bot',
        },
        body: body
    });

    if (!res.ok) {
        const data = await res.json();
        console.log(res.status);
        throw new Error(JSON.stringify(data));
    }
    return res;
}
