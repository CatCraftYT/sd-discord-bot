import fetch from 'sync-fetch';

function GetInfo(url, keyName)
{
    let json = fetch(url).json();
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

export function Text2Img(prompt, neg_prompt, style, seed, sampler, steps, cfg_scale)
{

}

export function SetModel(model)
{

}
