// @ts-check
import {it, mock} from 'node:test';
import assert from 'node:assert';
import * as fs from "node:fs";
import tsBlankSpace from '../index.js';

it("matches fixture", () => {
    const inputPath = new URL("./a.ts", import.meta.url);
    const fixturePath = new URL("./a.js", import.meta.url);

    const input = fs.readFileSync(inputPath, "utf-8");
    const expectedOutput = fs.readFileSync(fixturePath, "utf-8");

    const onError = mock.fn();
    const latestOutput = tsBlankSpace(input, onError);

    assert.equal(onError.mock.callCount(), 0, "there should be no errors");
    const latestLines = latestOutput.split("\n");
    const expectedLines = expectedOutput.split("\n");
    assert.equal(
        latestLines.length,
        expectedLines.length,
        "output line count should match input line - (`npm run fixture` to update)"
    );
    for (let i = 0; i < expectedLines.length; i++) {
        assert.equal(latestLines[i], expectedLines[i], `line ${i + 1} should match (\`npm run fixture\` to update)`);
    }
    assert.deepStrictEqual(latestLines.length, expectedLines.length, "should be the same number of lines (`npm run fixture` to update)");
});

it("handles `=>` on new line", (t) => {
    // In this case we can't only blank out the type annotation,
    // as that would result in:
    //
    // [1].map((v)
    //
    //  => [v])
    //
    // which is not a valid arrow function because ECMAScript
    // doesn't allow a newline before the `=>` part of an arrow
    const inputTs = [
        `[1].map((v)`,
        `:number[`,
        `]=>[v]);`
    ].join("\n");

    const onError = mock.fn();
    const jsOutput = tsBlankSpace(inputTs, onError);
    t.diagnostic(JSON.stringify(jsOutput));
    assert.equal(onError.mock.callCount(), 0, "there should be no errors");

    const inputLines = inputTs.split("\n");
    const outputLines = inputTs.split("\n");
    assert.equal(outputLines.length, inputLines.length, "Line numbers should not change");

    assert(outputLines[0].includes("(v)"));
    assert.equal(outputLines[0].indexOf("(v)"), inputLines[0].indexOf("(v)"), "the position of `(v)` should not have moved within its line");

    assert(outputLines[2].includes("[v]"));
    assert.equal(outputLines[2].indexOf("[v]"), inputLines[2].indexOf("[v]"), "the position of `[v]` should not have moved within its line");

    const evaluatedCode = (new Function(`return ${jsOutput}`))();
    assert.deepEqual(evaluatedCode, [[1]], "evaluated JavaScript matches the semantics of the original TypeScript");
});
