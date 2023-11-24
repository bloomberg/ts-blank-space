import {it, mock} from 'node:test';
import assert from 'node:assert';
import * as fs from "node:fs";
import tsBlankSpace from '../index.js';

it("matches fixture", () => {
    const inputPath = new URL("./a.ts", import.meta.url);
    const outputPath = new URL("./a.js", import.meta.url);

    const input = fs.readFileSync(inputPath, "utf-8");
    const output = fs.readFileSync(outputPath, "utf-8");

    const expected = tsBlankSpace(input);

    assert.equal(output, expected);
});
