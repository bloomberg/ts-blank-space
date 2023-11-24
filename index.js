// Copyright 2023 Bloomberg Finance L.P.
// Distributed under the terms of the Apache 2.0 license.
// @ts-check
import ts from "typescript";
import BlankString from "./blank-string.js";

/**
 * @type {ts.CreateSourceFileOptions}
 */
const languageOptions = {
    languageVersion: ts.ScriptTarget.ESNext,
    jsDocParsingMode: ts.JSDocParsingMode.ParseNone,
    impliedNodeFormat: ts.ModuleKind.ESNext,
};

// State is hoisted to module scope so we can avoid making so many closures

const scanner = ts.createScanner(ts.ScriptTarget.ESNext, true, ts.LanguageVariant.Standard);
scanner.setJSDocParsingMode(ts.JSDocParsingMode.ParseNone);

let str = new BlankString("");

/** @type {ts.SourceFile} */
let ast;

/**
 * @param {string} input
 * @returns {string}
 */
export default function tsBlankSpace(input) {
    str = new BlankString(input);

    scanner.setText(input);
    ast = ts.createSourceFile("input.ts", input, languageOptions, /* setParentNodes: */ false, ts.ScriptKind.TS);

    visitor(ast);

    // cleanup
    scanner.setText("");
    // @ts-expect-error
    ast = undefined;

    return str.toString();
}

/**
 * @param {ts.Node} node
 * @returns {void}
 */
function visitor(node) {
    // let x : T = v
    //       ^^^
    if (ts.isVariableDeclaration(node)) {
        if (node.type) {
            // s.remove(node.name.getEnd(), node.name.getEnd() + 1)
            str.blank(node.type.getFullStart() - 1, node.type.end);
        }
        return;
    }

    // interface ...
    if (ts.isInterfaceDeclaration(node)) {
        str.blank(node.getFullStart(), node.end);
        return;
    }

    // type T = ...
    if (ts.isTypeAliasDeclaration(node)) {
        str.blank(node.getFullStart(), node.end);
        return;
    }

    // class ...
    if (ts.isClassLike(node)) {
        // ... <T>
        const {typeParameters} = node;
        if (typeParameters?.length) {
            const start = scanner.scanRange(
                node.getStart(ast),
                typeParameters[0].getFullStart(),
                getLessThanToken
            );
            const end = scanner.scanRange(
                typeParameters[typeParameters.length-1].getEnd(),
                node.end,
                getGreaterThanToken
            );
            str.blank(start, end);
        }

        const {heritageClauses} = node;
        if (heritageClauses) {
            for (let i = 0; i < heritageClauses.length; i++) {
                const hc = heritageClauses[i];
                // implements T
                if (hc.token === ts.SyntaxKind.ImplementsKeyword) {
                    str.blank(hc.getStart(ast), hc.end);
                }
                // ... extends C<T> ...
                else if (hc.token === ts.SyntaxKind.ExtendsKeyword) {
                    hc.forEachChild(visitor);
                }
            }
        }
        node.members.forEach(visitor);
        return;
    }

    // Array<T>
    if (ts.isExpressionWithTypeArguments(node) && node.typeArguments) {
        const start = scanner.scanRange(
            node.getStart(ast),
            node.typeArguments[0].getFullStart(),
            getLessThanToken
        );
        const end = scanner.scanRange(
            node.typeArguments[node.typeArguments.length-1].getEnd(),
            node.end,
            getGreaterThanToken
        );
        str.blank(start, end);
        return;
    }

    node.forEachChild(visitor);
}

/** < */
function getLessThanToken() {
    while (scanner.scan() !== ts.SyntaxKind.LessThanToken);
    return scanner.getTokenStart();
}
/** > */
function getGreaterThanToken() {
    while (scanner.scan() !== ts.SyntaxKind.GreaterThanToken);
    return scanner.getTokenEnd();
}
