// @ts-check
import {it, mock} from 'node:test';
import assert from 'node:assert';
import * as fs from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { casesDir, outputForInput, testFixture } from "./fixture/helpers.js";
import tsBlankSpace, { blankSourceFile } from '../src/index.js';

for (const filename of fs.readdirSync(casesDir)) {
    if (!filename.endsWith(".ts")) {
        continue;
    }
    it(`fixture: ${filename}`, () => {
        const input = join(casesDir, filename);
        const output = outputForInput(input);
        testFixture(input, output);
    });
}

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

it("handles blanking surrogate pairs", () => {
    const onError = mock.fn();
    const tsInput = `function f(): "\ud83d\udca5" {}`;
    const jsOutput = tsBlankSpace(tsInput, onError);
    assert.equal(onError.mock.callCount(), 0, "there should be no errors");
    assert.equal(jsOutput, "function f()       {}");
    assert.equal(jsOutput.length, tsInput.length);
});

it("handles legacy type assertions in return statements", () => {
    const onError = mock.fn();
    const tsInput = `function f() {
        return<
          string>
            "on a new line";
    }`;
    const jsOutput = tsBlankSpace(tsInput, onError);
    assert.equal(onError.mock.callCount(), 0, "there should be no errors");
    const expectedOutput = `function f() {
        return 0,

            "on a new line";
    }`;
    assert.equal(jsOutput, expectedOutput);
    const code = new Function(`return ${jsOutput}`)();
    assert.equal(code(), "on a new line");
});

it("handles default export", () => {
    // TypeScript uses an `ExportAssignment` node for both
    // `export default ...` and `export =`.
    // The former is supported, the latter is an error.
    const onError = mock.fn();
    const tsInput = `
        export default/**/1/**/;
    `;
    const jsOutput = tsBlankSpace(tsInput, onError);
    assert.equal(onError.mock.callCount(), 0, "there should be no errors");
    assert.equal(jsOutput, tsInput);
});

it("allows ambient enum", () => {
    const onError = mock.fn();
    const jsOutput = tsBlankSpace(`declare enum E1 {}\n`, onError);
    assert.equal(onError.mock.callCount(), 0);
    assert.equal(jsOutput, "\n");
});

it("allows declared namespace value", () => {
    const onError = mock.fn();
    const jsOutput = tsBlankSpace(`declare namespace N {}\n`, onError);
    assert.equal(onError.mock.callCount(), 0);
    assert.equal(jsOutput, "\n");
});

it("allows declared module value", () => {
    const onError = mock.fn();
    const jsOutput = tsBlankSpace(`declare module M {}\n`, onError);
    assert.equal(onError.mock.callCount(), 0);
    assert.equal(jsOutput, "\n");
});

it("TSX is preserved in the output", () => {
    const onError = mock.fn();
    const tsInput = `const elm = <div>{x as string}</div>;\n`;
    const tsSource = ts.createSourceFile(
        "input.tsx",
        tsInput,
        ts.ScriptTarget.ESNext,
        false,
        ts.ScriptKind.TSX
    );
    const jsxOutput = blankSourceFile(tsSource, onError);
    assert.equal(onError.mock.callCount(), 0, "there should be no errors");
    assert.equal(jsxOutput, "const elm = <div>{x          }</div>;\n");
});
