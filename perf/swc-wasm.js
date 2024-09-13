// @ts-check
import * as swc from "@swc/wasm";
import * as fs from "node:fs";

function assert(v) {
    if (!v) throw new Error();
}

const input = fs.readFileSync(process.argv[2], "utf-8");
const count = Number(process.argv[3]) || 100;
const parseTS = process.argv.includes("--ts-ast");

/** @type {swc.Options} */
const options = {
    filename: "input.ts",
    sourceMaps: true,
    isModule: true,
    jsc: {
        target: "es2022",
    },
};

/** @type {swc.ParseOptions} */
const parseOptions = {
    syntax: "typescript",
    target: "es2022",
};

for (let i = 0; i < count; i++) {
    let out;
    if (parseTS) {
        const ast = swc.parseSync(input, parseOptions);
        assert(ast.body);
        out = swc.transformSync(input, options);
    } else {
        out = swc.transformSync(input, options);
    }
    assert((out.map?.length ?? 0) > 100);
    assert(out.code.length > 100);
}
