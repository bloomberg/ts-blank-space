import { test } from 'node:test';
import assert from 'node:assert';
import * as fs from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import tsBlankSpace from '../../src/index.ts';
import * as prettier from "prettier";
import * as terser from "terser";
import * as esbuild from "esbuild";
import * as babel from "@babel/parser";

const __dirname = import.meta.dirname;
const typescriptCompilerCasesDir = join(__dirname, "typescript", "tests", "cases", "compiler");

let i = 0;

const skipList = new Set([
    "binderBinaryExpressionStress.ts",
    "binderBinaryExpressionStressJs.ts",
    "ClassDeclaration11.ts",
    "ClassDeclaration8.ts",
    "continueTarget3.ts",
    "defaultValueInConstructorOverload1.ts" // https://github.com/microsoft/TypeScript/issues/59484
]);

/**
 * @param {string} filename
 */
function validFileName(filename) {
    if (!filename.endsWith(".ts")) {
        return false;
    }
    if (filename.endsWith(".d.ts")) {
        return false;
    }
    return true;
}

for (const filename of fs.readdirSync(typescriptCompilerCasesDir, {
    recursive: false,
    encoding: "utf8"
})) {
    if (!validFileName(filename)) {
        continue;
    }
    await test(`same emit for: ${filename}`, async (t) => {
        if (skipList.has(filename)) {
            t.skip("explicit skip");
            return;
        }
        const path = join(typescriptCompilerCasesDir, filename);
        await sameEmit(fs.readFileSync(path, "utf-8"), t);
    });
    if (i++ % 100 === 0) {
        await new Promise(r => setTimeout(r));
    }
}

/**
 * @param {string} source
 * @param {import("node:test").TestContext} t
 */
async function sameEmit(source, t, multipart = false) {
    if (!multipart && source.match(/\/\/ ?@filename:/i)) {
        const parts = source.split(/(?=\/\/ ?@filename:)/gi).filter(v => v.trim());
        for (const section of parts) {
            const match = section.match(/@filename:(.+)/);
            if (!match) continue;
            const filename = match[/* capture-group: */1];
            if (!validFileName(filename)) {
                continue;
            }
            await t.test(`multipart: ${filename}`, async (t) => {
                await sameEmit(section, t, /* multipart: */ true);
            });
        }
        return;
    }

    try {
        babel.parse(source, {
            sourceType: "module",
            plugins: ["typescript", "decorators"]
        });
    } catch (err) {
        t.skip("Babel errored: " + err.message);
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
        t.skip("TS errored: " + tsOut.diagnostics[0].messageText);
        return;
    }
    let nope = false;
    const blankOut = tsBlankSpace(source, () => {
        nope = true;
    });
    if (nope) {
        t.skip("TSBS unsupported node");
        return;
    }

    const blankOut2 = tidyLines(await normalizeJS(blankOut));
    const tsOut2 = tidyLines(await normalizeJS(tsOut.outputText));

    try {
        assert.deepStrictEqual(blankOut2, tsOut2);
    } catch (err) {
        t.diagnostic(blankOut2.join("\n"));
        t.diagnostic(tsOut2.join("\n"));
        throw err;
    }
}

function tidyLines(input) {
    return input.split("\n").filter(line => line !== "export {};").map(line => line.trim()).filter(line => line);
}

/**
 * @param {string} input
 */
async function normalizeJS(input) {
    let minified;

    try {
        minified = terser.minify_sync(input, {
            compress: false,
            mangle: false,
            module: true,
            format: {
                ecma: 2020,
                comments: false,
                keep_numbers: true,
            }
        }).code || "";
    } catch {
        minified = (await esbuild.transform(input, {
            legalComments: "none",
            minifyWhitespace: true,
            keepNames: true
        })).code;
    }

    // Put standardized air back in
    return await prettier.format(minified, {
        parser: "typescript",
        printWidth: 120,
    });
}
