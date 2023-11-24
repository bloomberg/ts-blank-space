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
        node.type && blankTypeNode(node.type);
        if (node.initializer) {
            visitor(node.initializer);
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
        if (node.typeParameters && node.typeParameters.length) {
            blankGenerics(node, node.typeParameters);
        }

        const {heritageClauses} = node;
        if (heritageClauses) {
            for (let i = 0; i < heritageClauses.length; i++) {
                const hc = heritageClauses[i];
                // implements T
                if (hc.token === ts.SyntaxKind.ImplementsKeyword) {
                    blankExact(hc);
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

    if (ts.isPropertyDeclaration(node)) {
        if (node.modifiers) {
            for (const modifier of node.modifiers) {
                switch (modifier.kind) {
                    case ts.SyntaxKind.PrivateKeyword:
                    case ts.SyntaxKind.ProtectedKeyword:
                    case ts.SyntaxKind.PublicKeyword:
                    case ts.SyntaxKind.AbstractKeyword:
                    case ts.SyntaxKind.OverrideKeyword:
                    case ts.SyntaxKind.DeclareKeyword:
                    case ts.SyntaxKind.ReadonlyKeyword:
                        blankExact(modifier);
                        continue;
                    case ts.SyntaxKind.ConstKeyword:
                    case ts.SyntaxKind.DefaultKeyword:
                    case ts.SyntaxKind.ExportKeyword:
                    case ts.SyntaxKind.InKeyword:
                    case ts.SyntaxKind.StaticKeyword:
                    case ts.SyntaxKind.AccessorKeyword:
                    case ts.SyntaxKind.AsyncKeyword:
                    case ts.SyntaxKind.OutKeyword:
                    case ts.SyntaxKind.Decorator:
                        continue;
                    default:
                        never(modifier);
                }
            }
        }

        node.exclamationToken && blankExact(node.exclamationToken);
        node.questionToken && blankExact(node.questionToken);
        node.type && blankTypeNode(node.type);

        if (node.initializer) {
            visitor(node.initializer);
        }

        return;
    }

    // exp!
    if (ts.isNonNullExpression(node)) {
        str.blank(node.end - 1, node.end)
    }

    // exp satisfies T, exp as T
    else if (ts.isSatisfiesExpression(node) || ts.isAsExpression(node)) {
        visitor(node.expression);
        str.blank(node.expression.end, node.end);
        return;
    }

    else if (ts.isMethodDeclaration(node)) {
        if (node.typeParameters && node.typeParameters.length) {
            blankGenerics(node, node.typeParameters);
        }

        let i = 0;
        for (const p of node.parameters) {
            i++;
            if (i === 1 && p.name.getText(ast) === "this") {
                const commaAdjust = node.parameters.length > 1 ? 1 : 0;
                str.blank(p.getStart(ast), p.end + commaAdjust);
                continue;
            }
            p.questionToken && blankExact(p.questionToken);
            p.type && blankTypeNode(p.type);
        }
        node.type && blankTypeNode(node.type);

        if (node.body) {
            visitor(node.body);
        }
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

/** @param {ts.TypeNode} n  */
function blankTypeNode(n) {
    // -1 for `:`
    str.blank(n.getFullStart() - 1, n.end);
}

/** @param {ts.Node} n  */
function blankExact(n) {
    str.blank(n.getStart(ast), n.end);
}

/**
 * `<T1, T2>`
 * @param {ts.Node} node
 * @param {ts.NodeArray} arr
 */
function blankGenerics(node, arr) {
    const start = scanner.scanRange(
        node.getStart(ast),
        arr[0].getFullStart(),
        getLessThanToken
    );
    const end = scanner.scanRange(
        arr[arr.length-1].getEnd(),
        node.end,
        getGreaterThanToken
    );
    str.blank(start, end);
}

/**
 * @param {never} n
 * @return {never}
 */
function never(n) {
    throw new Error("unreachable code was reached");
}