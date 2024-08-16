import * as fs from "node:fs";
import { join } from "node:path";
import tsBlankSpace from "../../src/index.ts";
import { casesDir, outputForInput } from "./helpers.ts";

for (const file of fs.readdirSync(casesDir)) {
    if (!file.endsWith(".ts")) {
        continue;
    }
    const input = join(casesDir, file);
    const output = outputForInput(input);
    updateFixture(input, output);
}

/**
 * @param {string} inputPath
 * @param {string} outputPath
 */
function updateFixture(inputPath, outputPath) {
    const input = fs.readFileSync(inputPath, "utf-8");
    let output = "...";
    fs.writeFileSync(outputPath, output);

    try {
        output = tsBlankSpace(input);
    } catch (err) {
        output = "Error: " + err.message;
    }

    fs.writeFileSync(outputPath, output);
}
