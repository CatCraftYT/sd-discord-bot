import { appendFile } from 'node:fs';
import { open } from 'node:fs/promises';
import * as readline from 'node:readline';

const FILENAME = "generations.csv";

export async function WriteEntry(id, data) {
    const entry = `${id},${Buffer.from(data).toString("base64")}\n`
    appendFile(FILENAME, entry, (err) => {if (err !== null) { throw err }});
}

export async function ReadEntry(id) {
    const stream = (await open(FILENAME)).createReadStream();
    const rl = readline.createInterface(stream);
    for await (const line of rl) {
        if (line.startsWith(id.toString())) {
            stream.close();
            return Buffer.from(line.split(",")[1], "base64").toString();
        }
    }
    return null;
}
