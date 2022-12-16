import { fetch as fetch_sync } from 'sync-fetch';
import { fetch as fetch_async } from 'node-fetch';

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
    let json = fetch(url).json();
    return regex.test(json["sd_model_checkpoint"]);
}

export async function SetModel(model)
{
    fetch_async("http://127.0.0.1:7860/sdapi/v1/options", {
        method: 'post',
        body:    JSON.stringify({ sd_model_checkpoint: model }),
    })
}

export async function Text2Img(prompt, neg_prompt, style, seed, sampler, steps, cfg_scale)
{
    let json = {
        prompt:          prompt,
        negative_prompt: neg_prompt === undefined ? "" : neg_prompt,
        styles:          [style === undefined          ? "" : style],
        seed:            seed === undefined            ? -1 : seed,
        sampler_name:    sampler === undefined         ? "Euler a" : sampler,
        steps:           steps === undefined           ? 80 : steps,
        cfg_scale:       cfg_scale === undefined       ? 7 : cfg_scale
    }

    fetch_async("http://127.0.0.1:7860/sdapi/v1/txt2img", {
        method: 'post',
        body:    JSON.stringify(json),
    })
}
