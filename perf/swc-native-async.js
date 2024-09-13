// @ts-check
import * as swc from "@swc/core";
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
        target: "esnext",
    },
};

/** @type {swc.ParseOptions} */
const parseOptions = {
    syntax: "typescript",
    target: "esnext",
};

async function main() {
    const p = [];
    for (let i = 0; i < count; i++) {
        let out;
        if (parseTS) {
            out = Promise.all([
                swc.transform(input, options),
                swc.parse(input, parseOptions).then((_ast) => {
                    assert(_ast.body);
                }),
            ]).then(([out]) => out);
        } else {
            out = swc.transform(input, options);
        }
        p.push(
            out.then((out) => {
                assert((out.map?.length ?? 0) > 100);
                assert(out.code.length > 100);
            }),
        );
    }
    await Promise.all(p);
}
main();
