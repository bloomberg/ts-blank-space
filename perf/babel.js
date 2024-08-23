// @ts-check
import * as babel from "@babel/core";
import * as fs from "node:fs";

function assert(v) {
    if (!v) throw new Error();
}

const input = fs.readFileSync(process.argv[2], "utf-8");
const count = Number(process.argv[3]) || 100;

const options = {
    plugins: [
        [
            "@babel/plugin-transform-typescript",
            { allowDeclareFields: true, onlyRemoveTypeImports: true, optimizeConstEnums: false },
        ],
    ],
    configFile: false,
    sourceMaps: true,
    browserslistConfigFile: false,
};

for (let i = 0; i < count; i++) {
    const output = babel.transformSync(input, options);
    assert(output.map.mappings.length > 100);
    assert(output.code.length > 100);
}
