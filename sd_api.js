import fetch_sync from 'sync-fetch';
import fetch_async from 'node-fetch';

function GetInfo(url, keyName)
{
    let json = fetch_sync(url).json();
    let info = [];
    json.forEach(element => {
        info.push({
            name: element[keyName],
            value: element[keyName]
        });
    });
    return info;
}

export function GetStyles()
{
    return GetInfo("http://127.0.0.1:7860/sdapi/v1/prompt-styles", "name");
}

export function GetSamplers()
{
    return GetInfo("http://127.0.0.1:7860/sdapi/v1/samplers", "name");
}

export function GetModels()
{
    return GetInfo("http://127.0.0.1:7860/sdapi/v1/sd-models", "title");
}

//this function will only work if the 768 in the model name is surrounded by dashes or spaces
export function ModelIs768()
{
    const regex = /(?<!\()\b768\b(?![\w\s]*[\)])/g; // i dunno how this fuckin works lol
    let json = fetch_sync(url).json();
    return regex.test(json["sd_model_checkpoint"]);
}

export async function SetModel(model)
{
    return fetch_async("http://127.0.0.1:7860/sdapi/v1/options", {
        method: 'post',
        body:    JSON.stringify({ sd_model_checkpoint: model }),
        headers: { 'Content-Type': 'application/json' }
    });
}

export async function GetProgress()
{
    return fetch_async("http://127.0.0.1:7860/sdapi/v1/progress")
    .then(res => { return res.json() });
}

export async function Text2Img({prompt, neg_prompt, style, aspect_ratio, seed, sampler, steps, cfg_scale})
{
    const {width, height} = GetWidthHeight(aspect_ratio);

    const json = {
        prompt:          prompt,
        negative_prompt: neg_prompt === undefined      ? "nsfw" : neg_prompt + ", nsfw",
        styles:          [style === undefined          ? "None" : style],
        seed:            seed === undefined            ? -1 : seed,
        sampler_name:    sampler === undefined         ? "Euler a" : sampler,
        steps:           steps === undefined           ? 80 : steps,
        cfg_scale:       cfg_scale === undefined       ? 7 : cfg_scale,
        width: width,
        height: height
    };

    return fetch_async("http://127.0.0.1:7860/sdapi/v1/txt2img", {
        method: 'post',
        body:    JSON.stringify(json),
        headers: { 'Content-Type': 'application/json' }
    }).then(res => { return res.json() });
}

export async function Img2Img({prompt, url, neg_prompt, denoising_strength, style, aspect_ratio, seed, sampler, steps, cfg_scale})
{
    const {width, height} = GetWidthHeight(aspect_ratio);
    const image = Buffer.from(await (await fetch(url)).arrayBuffer()).toString("base64");

    const json = {
        init_images:        [image],
        prompt:             prompt,
        denoising_strength: denoising_strength === undefined ? 0.65 : denoising_strength,
        negative_prompt:    neg_prompt === undefined         ? "nsfw" : neg_prompt + ", nsfw",
        styles:             [style === undefined             ? "None" : style],
        seed:               seed === undefined               ? -1 : seed,
        sampler_name:       sampler === undefined            ? "Euler a" : sampler,
        steps:              steps === undefined              ? 80 : steps,
        cfg_scale:          cfg_scale === undefined          ? 7 : cfg_scale,
        width: width,
        height: height
    };

    return fetch_async("http://127.0.0.1:7860/sdapi/v1/img2img", {
        method: 'post',
        body:    JSON.stringify(json),
        headers: { 'Content-Type': 'application/json' }
    }).then(res => { return res.json() });
}

export async function SendGenInterrupt()
{
    return fetch_async("http://127.0.0.1:7860/sdapi/v1/interrupt", {
        method: 'post',
    });
}

function GetWidthHeight(aspect_ratio)
{
    var width;
    var height;
    if (aspect_ratio === "7:4") {
        width = 896;
        height = 512;
    }
    else {
        width = 512;
        height = 512;
    }
    return {width, height}
}
