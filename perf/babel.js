// @ts-check
import * as babel from "@babel/core";
import * as babelParser from "@babel/parser";
import * as fs from "node:fs";

function assert(v) {
    if (!v) throw new Error();
}

const input = fs.readFileSync(process.argv[2], "utf-8");
const count = Number(process.argv[3]) || 100;
const parseTS = process.argv.includes("--ts-ast");

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
    cloneInputAst: false,
};

/** @type {babelParser.ParserOptions} */
const parseOptions = {
    sourceType: "module",
    sourceFilename: "input.ts",
    plugins: [["typescript", {}]],
};

for (let i = 0; i < count; i++) {
    let output;
    if (parseTS) {
        const ast = babelParser.parse(input, parseOptions);
        output = babel.transformFromAstSync(ast, input, options);
    } else {
        output = babel.transformSync(input, options);
    }
    assert(output.map.mappings.length > 100);
    assert(output.code.length > 100);
}
