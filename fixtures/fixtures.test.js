// @ts-check
import {it, mock} from 'node:test';
import assert from 'node:assert';
import * as fs from "node:fs";
import tsBlankSpace from '../index.js';

it("matches fixture", (t) => {
    const inputPath = new URL("./a.ts", import.meta.url);
    const fixturePath = new URL("./a.js", import.meta.url);

    const input = fs.readFileSync(inputPath, "utf-8");
    const expectedOutput = fs.readFileSync(fixturePath, "utf-8");

    const onError = mock.fn();
    const latestOutput = tsBlankSpace(input, onError);

    assert.equal(onError.mock.callCount(), 0, "there should be no errors");
    assert.equal(latestOutput.length, input.length, "output length should match input length - (`npm run fixture` to update)");
    const latestLines = latestOutput.split("\n");
    const expectedLines = expectedOutput.split("\n");
    for (let i = 0; i < expectedLines.length; i++) {
        assert.equal(latestLines[i], expectedLines[i], `line ${i + 1} should match (\`npm run fixture\` to update)`);
    }
    assert.deepStrictEqual(latestLines.length, expectedLines.length, "should be the same number of lines (`npm run fixture` to update)");
});
