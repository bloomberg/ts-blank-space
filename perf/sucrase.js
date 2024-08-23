// @ts-check
import sucrase from "sucrase";
import * as fs from "node:fs";

function assert(v) {
    if (!v) throw new Error();
}

const input = fs.readFileSync(process.argv[2], "utf-8");
const count = Number(process.argv[3]) || 100;

/** @type {sucrase.Options} */
const options = {
    transforms: ["typescript"],
    disableESTransforms: true,
    preserveDynamicImport: true,
    filePath: "file.ts",
    sourceMapOptions: {
        compiledFilename: "file.ts",
    },
    production: true,
    keepUnusedImports: true,
};

for (let i = 0; i < count; i++) {
    const output = sucrase.transform(input, options);
    assert((output.sourceMap?.mappings?.length ?? 0) > 100);
    assert(output.code.length > 100);
}
