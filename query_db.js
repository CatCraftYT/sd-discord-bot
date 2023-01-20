import * as csv from "./csv.js"
import * as readline from 'node:readline';
import { open } from 'node:fs/promises';
import { appendFile } from 'node:fs';

const FILENAME = "generations.csv";

export async function ConvertFile() {
    const stream = (await open(FILENAME)).createReadStream();
    const rl = readline.createInterface(stream);
    for await (const line of rl) {
        const data = line.split(",");
        appendFile("export.json.log", data[0] + ":\n" + JSON.stringify(JSON.parse(Buffer.from(data[1], "base64").toString()), undefined, 4) + "\n", (err) => {if (err !== null) { throw err }});
    }
    stream.close();
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));

while (true) {
    const id = await prompt("> ");
    if (id === "export") {
        ConvertFile();
        continue;
    }
    const json = await csv.ReadEntry(id);
    console.log(JSON.parse(json));
}
