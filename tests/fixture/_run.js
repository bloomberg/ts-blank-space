// @ts-check
import * as fs from "node:fs";
import tsBlankSpace from "../../index.js";

const inputPath = new URL("./a.ts", import.meta.url);
const outputPath = new URL("./a.js", import.meta.url);

const input = fs.readFileSync(inputPath, "utf-8");
let output = "...";
fs.writeFileSync(outputPath, output);

try {
    output = tsBlankSpace(input);
} catch (err) {
    output = "Error: " + err.message;
}

fs.writeFileSync(outputPath, output);
