// @ts-check
import * as esbuild from "esbuild-wasm";
import * as fs from "node:fs";

function assert(v) {
    if (!v) throw new Error();
}

const input = fs.readFileSync(process.argv[2], "utf-8");
const count = Number(process.argv[3]) || 100;

/** @type {esbuild.TransformOptions} */
const options = {
    format: "esm",
    target: "esnext",
    sourcemap: "external",
    loader: "ts",
};

async function main() {
    for (let i = 0; i < count; i++) {
        const out = esbuild.transformSync(input, options);
        assert(out.map.length > 100);
        assert(out.code.length > 100);
    }
}
main();
