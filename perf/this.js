// @ts-check
import * as fs from "node:fs";
import blankSpace from "../out/index.js"

function assert(v) {
    if (!v) throw new Error();
}

const input = fs.readFileSync(process.argv[2], "utf-8");
const count = Number(process.argv[3]) || 100;

console.time("");
for (let i = 0; i < count; i++) {
    const output = blankSpace(input);
    assert(output.length > 100);
}
console.timeEnd("");
