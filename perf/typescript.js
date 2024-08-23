// @ts-check
import * as fs from "node:fs";
import ts from "typescript";

function assert(v) {
    if (!v) throw new Error();
}

const input = fs.readFileSync(process.argv[2], "utf-8");
const count = Number(process.argv[3]) || 100;

for (let i = 0; i < count; i++) {
    const output = ts.transpileModule(input, {
        fileName: "input.ts",
        compilerOptions: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.ESNext,
            sourceMap: true,
        },
    });
    assert((output.sourceMapText?.length ?? 0) > 100);
    assert(output.outputText.length > 100);
}
