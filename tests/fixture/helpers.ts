import * as fs from "node:fs";
import assert from "node:assert";
import { mock } from "node:test";
import ts from "typescript";
import { join, relative, resolve } from "node:path";
import tsBlankSpace from "../../src/index.ts";

const __dirname = import.meta.dirname;

export const casesDir = join(__dirname, "cases");
const outputDir = join(__dirname, "output");

/**
 * @param {string} inputPath
 */
export function outputForInput(inputPath) {
    const rel = relative(casesDir, inputPath);
    return resolve(outputDir, rel.slice(0, -".ts".length)) + ".js";
}

/**
 * @param {string} fixturePath
 * @param {string} expectedOutputPath
 */
export function testFixture(fixturePath, expectedOutputPath) {
    const updateMsg = "(`npm run fixtures` to update)";
    const input = fs.readFileSync(fixturePath, "utf-8");
    const expectedOutput = fs.readFileSync(expectedOutputPath, "utf-8");

    const onError = mock.fn();
    const latestOutput = tsBlankSpace(input, onError);

    assert.equal(onError.mock.callCount(), 0, "there should be no errors");
    const latestLines = latestOutput.split("\n");
    const expectedLines = expectedOutput.split("\n");
    assert.equal(
        latestLines.length,
        expectedLines.length,
        `output line count should match input line - ${updateMsg}`
    );
    for (let i = 0; i < expectedLines.length; i++) {
        assert.equal(latestLines[i], expectedLines[i], `line ${i + 1} should match ${updateMsg}`);
    }
    assert.deepStrictEqual(latestLines.length, expectedLines.length, `should be the same number of lines ${updateMsg}`);

    assertIdentifiersAreAligned(expectedOutput, input);
    assertValidOutput(latestOutput);
}

/**
 * @param {string} jsString
 * @param {string} tsString
 */
function assertIdentifiersAreAligned(jsString, tsString) {
    const tsSource = ts.createSourceFile("input.ts", tsString, ts.ScriptTarget.ESNext, false, ts.ScriptKind.TS);
    const jsSource = ts.createSourceFile("output.js", jsString, ts.ScriptTarget.ESNext, false, ts.ScriptKind.JS);

    let sawIdentifiers = false;
    jsSource.forEachChild(function visit(n) {
        if (n.kind === ts.SyntaxKind.Identifier) {
            sawIdentifiers = true;
            const id = n.getText(jsSource);
            const pos = n.getStart(jsSource);
            const {line, character} = jsSource.getLineAndCharacterOfPosition(pos);
            const inputIndex = tsSource.getPositionOfLineAndCharacter(line, character);
            if (!tsString.startsWith(id, inputIndex)) {
                // SourceMaps are line:column based so these must not change
                throw new Error(`Expected to see '${id}' at position ${line}:${character} but saw '${tsString.slice(inputIndex, inputIndex + id.length)}'`);
            }
            if (!tsString.startsWith(id, pos)) {
                // Other tools, such as V8 code coverage, give the positions as byte offsets, so these also cannot change
                throw new Error(`Expected to see '${id}' at offset ${pos} but saw '${tsString.slice(inputIndex, inputIndex + id.length)}'`);
            }
        }
        n.forEachChild(visit);
    });
    assert(sawIdentifiers);
}

function assertValidOutput(jsString) {
    const { diagnostics } = ts.transpileModule(jsString, {
        fileName: "input.js",
        reportDiagnostics: true,
        compilerOptions: {
            target: ts.ScriptTarget.ESNext,
            allowJs: true,
        }
    });
    if (diagnostics && diagnostics.length) {
        throw new Error("output is not valid JavaScript: " + diagnostics[0].messageText);
    }
}
