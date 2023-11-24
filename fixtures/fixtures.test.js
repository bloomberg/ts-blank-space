// @ts-check
import {it, mock} from 'node:test';
import assert from 'node:assert';
import * as fs from "node:fs";
import tsBlankSpace from '../index.js';

it("matches fixture", () => {
    const inputPath = new URL("./a.ts", import.meta.url);
    const outputPath = new URL("./a.js", import.meta.url);

    const input = fs.readFileSync(inputPath, "utf-8");
    const output = fs.readFileSync(outputPath, "utf-8");

    const onError = mock.fn();
    const expected = tsBlankSpace(input, onError);
    assert.equal(expected.length, input.length, "output length should match input length");

    assert.equal(onError.mock.callCount(), 0, "there should be no errors");
    assert.equal(output, expected, "the fixture should be up-to-date (npm run fixture)");
});
