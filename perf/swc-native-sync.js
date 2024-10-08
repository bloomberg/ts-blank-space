// @ts-check
import * as swc from "@swc/core";
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
        target: "esnext",
    },
};

for (let i = 0; i < count; i++) {
    const out = swc.transformSync(input, options);
    assert((out.map?.length ?? 0) > 100);
    assert(out.code.length > 100);
}
