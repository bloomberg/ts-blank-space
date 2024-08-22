// @ts-check
import * as swc from "@swc/wasm";
import * as fs from "node:fs";

function assert(v) {
    if (!v) throw new Error();
}

const input = fs.readFileSync(process.argv[2], "utf-8");
const count = Number(process.argv[3]) || 100;

/** @type {swc.Options} */
const options = {
    filename: "input.ts",
    sourceMaps: true,
    isModule: true,
    jsc: {
        target: "es2022",
    },
};

console.time("");
for (let i = 0; i < count; i++) {
    const out = swc.transformSync(input, options);
    assert(out.code.length > 100);
}
console.timeEnd("");
