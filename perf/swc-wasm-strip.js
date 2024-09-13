// @ts-check
import * as swc from "@swc/wasm-typescript";
import * as fs from "node:fs";
import { parseTypeScriptAST } from "./ts-parse.js";

function assert(v) {
    if (!v) throw new Error();
}

const input = fs.readFileSync(process.argv[2], "utf-8");
const count = Number(process.argv[3]) || 100;
const parseTS = process.argv.includes("--ts-ast");

/** @type {swc.Options} */
const options = {
    sourceMap: false,
    mode: "strip-only",
};

for (let i = 0; i < count; i++) {
    const out = swc.transformSync(input, options);
    assert(!out.map);
    assert(out.code.length > 100);
}

if (parseTS) {
    await parseTypeScriptAST(input, count);
}
