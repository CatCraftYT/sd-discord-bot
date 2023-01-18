import * as csv from "./csv.js"
import * as readline from 'node:readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));

while (true) {
    const id = await prompt("> ");
    const json = await csv.ReadEntry(id);
    console.log(JSON.parse(json));
}
