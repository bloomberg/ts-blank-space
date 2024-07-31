// @ts-check
import { it } from 'node:test';
import assert from 'node:assert';
import * as fs from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import tsBlankSpace from '../../src/index.js';
import * as prettier from "prettier";
import * as terser from "terser";
import * as babel from "@babel/parser";

const __dirname = import.meta.dirname;
const typescriptCompilerCasesDir = join(__dirname, "typescript", "tests", "cases", "compiler");

let i = 0;

const skipList = new Set([
    "binderBinaryExpressionStress.ts",
    "binderBinaryExpressionStressJs.ts"
]);

for (const filename of fs.readdirSync(typescriptCompilerCasesDir, {
    recursive: false,
    encoding: "utf8"
})) {
    if (!filename.endsWith(".ts")) {
        continue;
    }
    if (filename.endsWith(".d.ts")) {
        continue;
    }
    await it(`same emit for: ${filename}`, async (t) => {
        if (skipList.has(filename)) {
            t.skip("explicit skip");
            return;
        }
        await sameEmit(join(typescriptCompilerCasesDir, filename), (msg) => t.skip(msg));
    });
    if (i++ % 100 === 0) {
        await new Promise(r => setTimeout(r));
    }
}

/**
 * @param {string} inputPath
 * @param {(msg: string) => void} skip
 */
async function sameEmit(inputPath, skip) {
    const source = fs.readFileSync(inputPath, "utf-8");
    if (source.match(/\/\/ ?@filename/i)) {
        skip("multi-file");
        return;
    }

    try {
        babel.parse(source, {
            sourceType: "module",
            plugins: ["typescript"]
        });
    } catch (err) {
        skip("Babel errored: " + err.message);
        return;
    }

    const tsOut = ts.transpileModule(source, {
        reportDiagnostics: true,
        compilerOptions: {
            verbatimModuleSyntax: true,
            useDefineForClassFields: true,
            moduleDetection: ts.ModuleDetectionKind.Force,
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.ES2022,
            sourceMap: false
        }
    });
    if (tsOut.diagnostics?.length) {
        skip("TS errored: " + tsOut.diagnostics[0].messageText);
        return;
    }
    let nope = false;
    const blankOut = tsBlankSpace(source, () => {
        nope = true;
    });
    if (nope) {
        skip("TSBS unsupported node");
        return;
    }

    let tsOut2;
    try {
        tsOut2 = (await normalizeJS(tsOut.outputText)).split("\n").filter(line => line !== "export {};");
    } catch {
        skip("ts output doesn't parse");
        return;
    }
    const blankOut2 = (await normalizeJS(blankOut)).split("\n").filter(line => line !== "export {};");

    assert.deepStrictEqual(blankOut2, tsOut2);
}

/**
 * @param {string} input
 */
async function normalizeJS(input) {
    const output = (await terser.minify(input, {
        // Only squeeze out the air
        mangle: false,
        compress: false,
        format: {
            ecma: 2020,
            keep_numbers: true,
            comments: false
        },
        sourceMap: false,
    })).code || "";

    // Put standardized air back in
    return await prettier.format(output, {
        parser: "acorn",
        printWidth: 120,
    });
}
