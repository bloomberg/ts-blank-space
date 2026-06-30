import * as fs from "node:fs";
import assert from "node:assert";
import { mock } from "node:test";
import * as ts from "@typescript/native-preview/unstable/ast";
import { createVirtualFileSystem } from "@typescript/native-preview/unstable/fs";
import { API as TSAPI } from "@typescript/native-preview/unstable/sync";
import { join, relative, resolve } from "node:path";
import tsBlankSpace from "../../src/index.ts";

const __dirname = import.meta.dirname;

export const casesDir = join(__dirname, "cases");
const outputDir = join(__dirname, "output");

export function outputForInput(inputPath: string) {
    const rel = relative(casesDir, inputPath);
    return resolve(outputDir, rel.slice(0, -".ts".length)) + ".js";
}

export function testFixture(fixturePath: string, expectedOutputPath: string) {
    const updateMsg = "(`npm run fixtures` to update)";
    const input = fs.readFileSync(fixturePath, "utf-8");
    const expectedOutput = fs.readFileSync(expectedOutputPath, "utf-8");

    const onError = mock.fn();
    const latestOutput = tsBlankSpace(input, onError);

    assert.equal(onError.mock.callCount(), 0, "there should be no errors");
    const latestLines = latestOutput.split("\n");
    const expectedLines = expectedOutput.split("\n");
    assert.equal(latestLines.length, expectedLines.length, `output line count should match input line - ${updateMsg}`);
    for (let i = 0; i < expectedLines.length; i++) {
        assert.equal(latestLines[i], expectedLines[i], `line ${i + 1} should match ${updateMsg}`);
    }
    assert.deepStrictEqual(latestLines.length, expectedLines.length, `should be the same number of lines ${updateMsg}`);

    assertIdentifiersAreAligned(expectedOutput, input);
    assertValidOutput(latestOutput);
}

function computeLineStarts(text: string): number[] {
    const lineStarts = [0];
    for (let i = 0; i < text.length; i++) {
        const ch = text.charCodeAt(i);
        if (ch === 10) {
            lineStarts.push(i + 1);
        } else if (ch === 13) {
            if (i + 1 < text.length && text.charCodeAt(i + 1) === 10) {
                i++;
            }
            lineStarts.push(i + 1);
        }
    }
    return lineStarts;
}

function getLineAndCharacterOfPosition(lineStarts: number[], pos: number): { line: number; character: number } {
    let low = 0;
    let high = lineStarts.length - 1;
    while (low <= high) {
        const mid = (low + high) >>> 1;
        if (lineStarts[mid] <= pos) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    const line = high;
    return { line, character: pos - lineStarts[line] };
}

function getPositionOfLineAndCharacter(lineStarts: number[], line: number, character: number): number {
    return lineStarts[line] + character;
}

function assertIdentifiersAreAligned(jsString: string, tsString: string) {
    const api = new TSAPI({
        cwd: "/",
        fs: createVirtualFileSystem({
            "/tsconfig.json": JSON.stringify({
                files: ["/input.ts", "/output.js"],
                compilerOptions: {
                    allowJs: true,
                },
            }),
            "/input.ts": tsString,
            "/output.js": jsString,
        }),
    });
    const snap = api.updateSnapshot({ openProject: "/tsconfig.json" });
    const program = snap.getProjects()[0].program;
    const tsSource = program.getSourceFile("/input.ts");
    const jsSource = program.getSourceFile("/output.js");
    assert(tsSource);
    assert(jsSource);
    const jsLineStarts = computeLineStarts(jsString);
    const tsLineStarts = computeLineStarts(tsString);
    let sawIdentifiers = false;
    jsSource.forEachChild(function visit(n) {
        if (n.kind === ts.SyntaxKind.Identifier) {
            sawIdentifiers = true;
            const id = n.getText(jsSource);
            const pos = n.getStart(jsSource);
            const { line, character } = getLineAndCharacterOfPosition(jsLineStarts, pos);
            const inputIndex = getPositionOfLineAndCharacter(tsLineStarts, line, character);
            if (!tsString.startsWith(id, inputIndex)) {
                // SourceMaps are line:column based so these must not change
                throw new Error(
                    `Expected to see '${id}' at position ${line}:${character} but saw '${tsString.slice(inputIndex, inputIndex + id.length)}'`,
                );
            }
            if (!tsString.startsWith(id, pos)) {
                // Other tools, such as V8 code coverage, give the positions as byte offsets, so these also cannot change
                throw new Error(
                    `Expected to see '${id}' at offset ${pos} but saw '${tsString.slice(inputIndex, inputIndex + id.length)}'`,
                );
            }
        }
        n.forEachChild(visit);
    });
    assert(sawIdentifiers);
    api.close();
}

function assertValidOutput(jsString: string) {
    const api = new TSAPI({
        cwd: "/",
        fs: createVirtualFileSystem({
            "/tsconfig.json": JSON.stringify({ files: ["/output.js"] }),
            "/output.js": jsString,
        }),
    });
    const snap = api.updateSnapshot({ openProject: "/tsconfig.json" });
    const program = snap.getProjects()[0].program;
    const diagnostics = program.getSyntacticDiagnostics();
    if (diagnostics && diagnostics.length) {
        throw new Error("output is not valid JavaScript: " + diagnostics[0].text);
    }
}
