import { it, mock } from "node:test";
import assert from "node:assert";
import * as fs from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { casesDir, outputForInput, testFixture } from "./fixture/helpers.js";
import tsBlankSpace, { blankSourceFile } from "../src/index.ts";

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
    const inputTs = [`[1].map((v)`, `:number[`, `]=>[v]);`].join("\n");

    const onError = mock.fn();
    const jsOutput = tsBlankSpace(inputTs, onError);
    t.diagnostic(JSON.stringify(jsOutput));
    assert.equal(onError.mock.callCount(), 0, "there should be no errors");

    const inputLines = inputTs.split("\n");
    const outputLines = inputTs.split("\n");
    assert.equal(outputLines.length, inputLines.length, "Line numbers should not change");

    assert(outputLines[0].includes("(v)"));
    assert.equal(
        outputLines[0].indexOf("(v)"),
        inputLines[0].indexOf("(v)"),
        "the position of `(v)` should not have moved within its line",
    );

    assert(outputLines[2].includes("[v]"));
    assert.equal(
        outputLines[2].indexOf("[v]"),
        inputLines[2].indexOf("[v]"),
        "the position of `[v]` should not have moved within its line",
    );

    const evaluatedCode = new Function(`return ${jsOutput}`)();
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
    assert.equal(jsOutput, "                  \n");
});

it("allows declared namespace value", () => {
    const onError = mock.fn();
    const jsOutput = tsBlankSpace(`declare namespace N {}\n`, onError);
    assert.equal(onError.mock.callCount(), 0);
    assert.equal(jsOutput, "                      \n");
});

it("allows declared module value", () => {
    const onError = mock.fn();
    const jsOutput = tsBlankSpace(`declare module M {}\n`, onError);
    assert.equal(onError.mock.callCount(), 0);
    assert.equal(jsOutput, "                   \n");
});

it("TSX is preserved in the output", () => {
    const onError = mock.fn();
    const tsxInput = `const elm = <div>{x as string}</div>;\n`;
    const tsxSource = ts.createSourceFile("input.tsx", tsxInput, ts.ScriptTarget.ESNext, false, ts.ScriptKind.TSX);
    const jsxOutput = blankSourceFile(tsxSource, onError);
    assert.equal(onError.mock.callCount(), 0, "there should be no errors");
    assert.equal(jsxOutput, "const elm = <div>{x          }</div>;\n");
});

// Easy to miss this case as it's only a single character
it("handles variable definite assignment assertions", () => {
    const onError = mock.fn();
    const tsInput = `let x: any, y! : string, z: any;\n`;
    const jsOutput = tsBlankSpace(tsInput, onError);
    assert.equal(onError.mock.callCount(), 0, "there should be no errors");
    assert.equal(jsOutput, "let x     , y          , z     ;\n");
});

// Taken from TypeScript's compiler tests because there used to be a bug
// in ts-blank-space where this caused it to hit an infinite loop
it("'parseGenericArrowRatherThanLeftShift'", () => {
    // `foo<<` can get scanned as `[foo,<<]` tokens instead of `[foo,<,<]`
    const tsInput = `
        function foo<T>(_x: T) {}
        const b = foo<<T>(x: T) => number>(() => 1);
    `;
    const expectedOutput = `
        function foo   (_x   ) {}
        const b = foo                     (() => 1);
    `;
    const onError = mock.fn();
    const jsOutput = tsBlankSpace(tsInput, onError);
    assert.equal(onError.mock.callCount(), 0, "there should be no errors");
    assert.equal(jsOutput, expectedOutput);
});

it("Preserves strict directive after a type declaration", () => {
    const tsInput = `
interface I {}
"use strict"
export {}
    `;
    const expectedOutput = `
${"              "}
"use strict"
export {}
    `;
    const onError = mock.fn();
    const jsOutput = tsBlankSpace(tsInput, onError);
    assert.equal(onError.mock.callCount(), 0, "there should be no errors");
    assert.equal(jsOutput, expectedOutput);
});

it("Preserves nested strict directive after a type declaration", () => {
    const tsInput = `
    function foo() {
        interface I {}
        "use strict"
        return 1;
    }
    `;
    const expectedOutput = `
    function foo() {
${"                      "}
        "use strict"
        return 1;
    }
    `;
    const onError = mock.fn();
    const jsOutput = tsBlankSpace(tsInput, onError);
    assert.equal(onError.mock.callCount(), 0, "there should be no errors");
    assert.equal(jsOutput, expectedOutput);
});
