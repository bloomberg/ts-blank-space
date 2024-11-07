// Copyright 2024 Bloomberg Finance L.P.
// Distributed under the terms of the Apache 2.0 license.

import type * as ts from "typescript";
import tslib from "typescript";
import BlankString from "./blank-string.js";
const SK = tslib.SyntaxKind;

// These values must be 'falsey' to not stop TypeScript's walk
const VISIT_BLANKED = "";
const VISITED_JS = null;

type VisitResult = typeof VISIT_BLANKED | typeof VISITED_JS;
type ErrorCb = (n: ts.Node) => void;

const languageOptions: ts.CreateSourceFileOptions = {
    languageVersion: tslib.ScriptTarget.ESNext,
    impliedNodeFormat: tslib.ModuleKind.ESNext,
};

const scanner = tslib.createScanner(tslib.ScriptTarget.ESNext, /*skipTrivia: */ true, tslib.LanguageVariant.Standard);
if (tslib.JSDocParsingMode) {
    // TypeScript >= 5.3
    languageOptions.jsDocParsingMode = tslib.JSDocParsingMode.ParseNone;
    scanner.setJSDocParsingMode(tslib.JSDocParsingMode.ParseNone);
}

// State is hoisted to module scope so we can avoid creating per-run closures
let src = "";
let str = new BlankString("");
let ast: ts.SourceFile;
let onError: ErrorCb | undefined;
let seenJS = false;
let parentStatement: ts.Node | undefined = undefined;

/**
 * @param input string containing TypeScript
 * @param onErrorArg callback when unsupported syntax is encountered
 * @returns the resulting JavaScript
 */
export default function tsBlankSpace(input: string, onErrorArg?: ErrorCb): string {
    return blankSourceFile(
        tslib.createSourceFile("input.ts", input, languageOptions, /* setParentNodes: */ false, tslib.ScriptKind.TS),
        onErrorArg,
    );
}

/**
 * @param source containing TypeScript's AST
 * @param onErrorArg callback when unsupported syntax is encountered
 * @returns the resulting JavaScript
 */
export function blankSourceFile(source: ts.SourceFile, onErrorArg?: ErrorCb): string {
    try {
        const input = source.getFullText(source);
        src = input;
        str = new BlankString(input);
        onError = onErrorArg;
        scanner.setText(input);
        ast = source;

        visitNodeArray(ast.statements, /* isStatementLike: */ true, /* isFunctionBody: */ false);

        return str.toString();
    } finally {
        // Cleanup. Release memory. Reset state.
        scanner.setText("");
        onError = undefined;
        ast = undefined!;
        str = undefined!;
        src = "";
        seenJS = false;
        parentStatement = undefined;
    }
}

function visitUnknownNodeArray(nodes: ts.NodeArray<ts.Node>): VisitResult {
    if (nodes.length === 0) return VISITED_JS;
    return visitNodeArray(nodes, tslib.isStatement(nodes[0]), /* isFunctionBody: */ false);
}

function visitNodeArray(nodes: ts.NodeArray<ts.Node>, isStatementLike: boolean, isFunctionBody: boolean): VisitResult {
    const previousParentStatement = parentStatement;
    const previousSeenJS = seenJS;
    if (isFunctionBody) {
        seenJS = false; // 'seenJS' resets for nested execution context
    }
    for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (isStatementLike) {
            parentStatement = n;
        }
        if (visitStatementLike(n) === VISITED_JS) {
            seenJS = true;
        }
    }
    parentStatement = previousParentStatement;
    if (isFunctionBody) {
        seenJS = previousSeenJS;
    }
    return seenJS ? VISITED_JS : VISIT_BLANKED;
}

function visitStatementLike(node: ts.Node): VisitResult {
    const kind = node.kind;
    switch (kind) {
        case SK.ImportDeclaration:
            return visitImportDeclaration(node as ts.ImportDeclaration);
        case SK.ExportDeclaration:
            return visitExportDeclaration(node as ts.ExportDeclaration);
        case SK.ExportAssignment:
            return visitExportAssignment(node as ts.ExportAssignment);
        case SK.ImportEqualsDeclaration:
            onError && onError(node);
            return VISITED_JS;
    }
    return innerVisitor(node, kind);
}

function visitor(node: ts.Node): VisitResult {
    const r = innerVisitor(node, node.kind);
    if (r === VISITED_JS) seenJS = true;
    return r;
}

function innerVisitor(node: ts.Node, kind: ts.SyntaxKind): VisitResult {
    // prettier-ignore
    switch (kind) {
        case SK.Identifier: return VISITED_JS;
        case SK.VariableDeclaration: return visitVariableDeclaration(node as ts.VariableDeclaration);
        case SK.VariableStatement: return visitVariableStatement(node as ts.VariableStatement);
        case SK.CallExpression:
        case SK.NewExpression: return visitCallOrNewExpression(node as (ts.CallExpression | ts.NewExpression));
        case SK.TypeAliasDeclaration:
        case SK.InterfaceDeclaration:
            blankStatement(node as (ts.TypeAliasDeclaration | ts.InterfaceDeclaration));
            return VISIT_BLANKED;
        case SK.ClassDeclaration:
        case SK.ClassExpression: return visitClassLike(node as ts.ClassLikeDeclaration);
        case SK.ExpressionWithTypeArguments: return visitExpressionWithTypeArguments(node as ts.ExpressionWithTypeArguments);
        case SK.PropertyDeclaration: return visitPropertyDeclaration(node as ts.PropertyDeclaration);
        case SK.NonNullExpression: return visitNonNullExpression(node as ts.NonNullExpression);
        case SK.SatisfiesExpression:
        case SK.AsExpression: return visitTypeAssertion(node as (ts.AsExpression | ts.SatisfiesExpression));
        case SK.ArrowFunction:
        case SK.FunctionDeclaration:
        case SK.MethodDeclaration:
        case SK.Constructor:
        case SK.FunctionExpression:
        case SK.GetAccessor:
        case SK.SetAccessor: return visitFunctionLikeDeclaration(node as ts.FunctionLikeDeclaration, kind);
        case SK.EnumDeclaration:
        case SK.ModuleDeclaration: return visitEnumOrModule(node as (ts.EnumDeclaration | ts.ModuleDeclaration));
        case SK.IndexSignature: blankExact(node); return VISIT_BLANKED;
        case SK.TaggedTemplateExpression: return visitTaggedTemplate(node as ts.TaggedTemplateExpression);
        case SK.TypeAssertionExpression: return visitLegacyTypeAssertion(node as ts.TypeAssertion);
    }

    return node.forEachChild(visitor, visitUnknownNodeArray) || VISITED_JS;
}

/**
 * `let x : T` (outer)
 */
function visitVariableStatement(node: ts.VariableStatement): VisitResult {
    if (node.modifiers && modifiersContainsDeclare(node.modifiers)) {
        blankStatement(node);
        return VISIT_BLANKED;
    }
    node.forEachChild(visitor, visitUnknownNodeArray);
    return VISITED_JS;
}

/**
 * `new Set<string>()` | `foo<string>()`
 */
function visitCallOrNewExpression(node: ts.NewExpression | ts.CallExpression): VisitResult {
    visitor(node.expression);
    if (node.typeArguments) {
        blankGenerics(node, node.typeArguments, /*startWithParen*/ false);
    }
    if (node.arguments) {
        const args = node.arguments;
        for (let i = 0; i < args.length; i++) {
            visitor(args[i]);
        }
    }
    return VISITED_JS;
}

/**
 * foo<T>`tagged template`
 */
function visitTaggedTemplate(node: ts.TaggedTemplateExpression): VisitResult {
    visitor(node.tag);
    if (node.typeArguments) {
        blankGenerics(node, node.typeArguments, /*startWithParen*/ false);
    }
    visitor(node.template);
    return VISITED_JS;
}

/**
 * `let x : T = v` (inner)
 */
function visitVariableDeclaration(node: ts.VariableDeclaration): VisitResult {
    visitor(node.name);

    // let x!
    node.exclamationToken && blankExact(node.exclamationToken);

    // let x: T
    node.type && blankTypeNode(node.type);

    // let x = v
    if (node.initializer) {
        visitor(node.initializer);
    }
    return VISITED_JS;
}

/**
 * `class ...`
 */
function visitClassLike(node: ts.ClassLikeDeclaration): VisitResult {
    if (node.modifiers) {
        if (modifiersContainsDeclare(node.modifiers)) {
            blankStatement(node);
            return VISIT_BLANKED;
        }
        visitModifiers(node.modifiers, /* addSemi:*/ false);
    }

    // ... <T>
    if (node.typeParameters && node.typeParameters.length) {
        blankGenerics(node, node.typeParameters, /*startWithParen*/ false);
    }

    const { heritageClauses } = node;
    if (heritageClauses) {
        for (let i = 0; i < heritageClauses.length; i++) {
            const hc = heritageClauses[i];
            // implements T
            if (hc.token === SK.ImplementsKeyword) {
                blankExact(hc);
            }
            // ... extends C<T> ...
            else if (hc.token === SK.ExtendsKeyword) {
                hc.forEachChild(visitor);
            }
        }
    }
    visitNodeArray(node.members, /* isStatementLike: */ true, /* isFunctionBody: */ false);
    return VISITED_JS;
}

/**
 * Exp<T>
 */
function visitExpressionWithTypeArguments(node: ts.ExpressionWithTypeArguments): VisitResult {
    visitor(node.expression);
    if (node.typeArguments) {
        blankGenerics(node, node.typeArguments, /*startWithParen*/ false);
    }
    return VISITED_JS;
}

const classElementModifiersToRemoveArray = [
    SK.AbstractKeyword,
    SK.DeclareKeyword,
    SK.OverrideKeyword,
    SK.PrivateKeyword,
    SK.ProtectedKeyword,
    SK.PublicKeyword,
    SK.ReadonlyKeyword,
] as const;
const classElementModifiersToRemove = new Set(classElementModifiersToRemoveArray);

function isRemovedModifier(kind: ts.SyntaxKind): kind is (typeof classElementModifiersToRemoveArray)[number] {
    return classElementModifiersToRemove.has(kind as never);
}

function visitModifiers(modifiers: ArrayLike<ts.ModifierLike>, addSemi: boolean): void {
    for (let i = 0; i < modifiers.length; i++) {
        const modifier = modifiers[i];
        const kind = modifier.kind;
        if (isRemovedModifier(kind)) {
            if (addSemi && i === 0) {
                str.blankButStartWithSemi(modifier.getStart(ast), modifier.end);
                addSemi = false;
            } else {
                blankExact(modifier);
            }
            continue;
        } else if (kind === SK.Decorator) {
            visitor(modifier);
            continue;
        }

        // at runtime skip the remaining code, its purpose is a compile-time exhaustive check
        if (true as false) continue;

        switch (kind) {
            case SK.ConstKeyword:
            case SK.DefaultKeyword:
            case SK.ExportKeyword:
            case SK.InKeyword:
            case SK.StaticKeyword:
            case SK.AccessorKeyword:
            case SK.AsyncKeyword:
            case SK.OutKeyword:
                continue;
            default:
                never(kind);
        }
    }
}

function isAsync(modifiers: ArrayLike<ts.ModifierLike> | undefined): boolean {
    if (!modifiers) return false;
    for (let i = 0; i < modifiers.length; i++) {
        if (modifiers[i].kind === SK.AsyncKeyword) return true;
    }
    return false;
}

/**
 * prop: T
 */
function visitPropertyDeclaration(node: ts.PropertyDeclaration): VisitResult {
    if (node.modifiers) {
        if (modifiersContainsAbstractOrDeclare(node.modifiers)) {
            blankStatement(node);
            return VISIT_BLANKED;
        }
        visitModifiers(node.modifiers, /* addSemi */ node.name.kind === SK.ComputedPropertyName);
    }
    node.exclamationToken && blankExact(node.exclamationToken);
    node.questionToken && blankExact(node.questionToken);
    node.type && blankTypeNode(node.type);

    visitor(node.name);

    if (node.initializer) {
        visitor(node.initializer);
    }
    return VISITED_JS;
}

/**
 * `expr!`
 */
function visitNonNullExpression(node: ts.NonNullExpression): VisitResult {
    visitor(node.expression);
    str.blank(node.end - 1, node.end);
    return VISITED_JS;
}

/**
 * `exp satisfies T, exp as T`
 */
function visitTypeAssertion(node: ts.SatisfiesExpression | ts.AsExpression): VisitResult {
    const r = visitor(node.expression);
    const nodeEnd = node.end;
    if (parentStatement && nodeEnd === parentStatement.end && src.charCodeAt(nodeEnd) !== 59 /* ; */) {
        str.blankButStartWithSemi(node.expression.end, nodeEnd);
    } else {
        str.blank(node.expression.end, nodeEnd);
    }
    return r;
}

/**
 * `<type>v`
 */
function visitLegacyTypeAssertion(node: ts.TypeAssertion): VisitResult {
    onError && onError(node);
    return visitor(node.expression);
}

const unsupportedParameterModifiers = new Set([
    SK.PublicKeyword,
    SK.ProtectedKeyword,
    SK.PrivateKeyword,
    SK.ReadonlyKeyword,
]);

/**
 * `function<T>(p: T): T {}`
 */
function visitFunctionLikeDeclaration(node: ts.FunctionLikeDeclaration, kind: ts.SyntaxKind): VisitResult {
    if (!node.body) {
        if (node.modifiers && modifiersContainsDeclare(node.modifiers)) {
            blankStatement(node);
            return VISIT_BLANKED;
        }
        // else: overload
        blankExact(node);
        return VISIT_BLANKED;
    }

    const nodeName = node.name;
    if (node.modifiers) {
        visitModifiers(node.modifiers, /* addSemi */ !!nodeName && nodeName.kind === SK.ComputedPropertyName);
    }

    if (nodeName) {
        visitor(nodeName);
    }

    let moveOpenParen = false;
    if (node.typeParameters && node.typeParameters.length) {
        moveOpenParen = isAsync(node.modifiers) && spansLines(node.typeParameters.pos, node.typeParameters.end);
        blankGenerics(node, node.typeParameters, moveOpenParen);
    }

    // method?
    node.questionToken && blankExact(node.questionToken);

    const params = node.parameters;
    if (moveOpenParen) {
        str.blank(params.pos - 1, params.pos);
    }
    for (let i = 0; i < params.length; i++) {
        const p = params[i];
        if (i === 0 && p.name.getText(ast) === "this") {
            blankExactAndOptionalTrailingComma(p);
            continue;
        }
        if (onError && p.modifiers) {
            // error on non-standard parameter properties
            for (let i = 0; i < p.modifiers.length; i++) {
                const modifier = p.modifiers[i];
                if (unsupportedParameterModifiers.has(modifier.kind)) {
                    onError(modifier);
                }
            }
        }
        visitor(p.name);
        p.questionToken && blankExact(p.questionToken);
        p.type && blankTypeNode(p.type);
        p.initializer && visitor(p.initializer);
    }

    const returnType = node.type;
    const isArrow = kind === SK.ArrowFunction;
    if (returnType) {
        if (!isArrow || !spansLines(node.parameters.end, (node as ts.ArrowFunction).equalsGreaterThanToken.pos)) {
            blankTypeNode(returnType);
        } else {
            // danger! new line between parameters and `=>`
            const paramEnd = getClosingParenthesisPos(node.parameters);
            str.blankButEndWithCloseParen(paramEnd - 1, returnType.getEnd());
        }
    }

    const body = node.body;
    if (body.kind === SK.Block) {
        visitNodeArray((body as ts.Block).statements, /* isStatementLike: */ true, /* isFunctionBody: */ true);
    } else {
        visitor(node.body);
    }
    return VISITED_JS;
}

function spansLines(a: number, b: number): boolean {
    for (let i = a; i < b; i++) {
        if (src.charCodeAt(i) === 10 /* \n */) return true;
    }
    return false;
}

/**
 * `import ...`
 */
function visitImportDeclaration(node: ts.ImportDeclaration): VisitResult {
    if (node.importClause) {
        if (node.importClause.isTypeOnly) {
            blankStatement(node);
            return VISIT_BLANKED;
        }
        const { namedBindings } = node.importClause;
        if (namedBindings && tslib.isNamedImports(namedBindings)) {
            const elements = namedBindings.elements;
            for (let i = 0; i < elements.length; i++) {
                const e = elements[i];
                e.isTypeOnly && blankExactAndOptionalTrailingComma(e);
            }
        }
    }
    return VISITED_JS;
}

/**
 * `export ...`
 */
function visitExportDeclaration(node: ts.ExportDeclaration): VisitResult {
    if (node.isTypeOnly) {
        blankStatement(node);
        return VISIT_BLANKED;
    }

    const { exportClause } = node;
    if (exportClause && tslib.isNamedExports(exportClause)) {
        const elements = exportClause.elements;
        for (let i = 0; i < elements.length; i++) {
            const e = elements[i];
            e.isTypeOnly && blankExactAndOptionalTrailingComma(e);
        }
    }
    return VISITED_JS;
}

/**
 * `export default ...`
 */
function visitExportAssignment(node: ts.ExportAssignment): VisitResult {
    if (node.isExportEquals) {
        // `export = ...`
        onError && onError(node);
        return VISITED_JS;
    }
    visitor(node.expression);
    return VISITED_JS;
}

function visitEnumOrModule(node: ts.EnumDeclaration | ts.ModuleDeclaration): VisitResult {
    if (node.modifiers && modifiersContainsDeclare(node.modifiers)) {
        blankStatement(node);
        return VISIT_BLANKED;
    } else {
        onError && onError(node);
        return VISITED_JS;
    }
}

function modifiersContainsDeclare(modifiers: ArrayLike<ts.ModifierLike>): boolean {
    for (let i = 0; i < modifiers.length; i++) {
        const modifier = modifiers[i];
        if (modifier.kind === SK.DeclareKeyword) {
            return true;
        }
    }
    return false;
}

function modifiersContainsAbstractOrDeclare(modifiers: ArrayLike<ts.ModifierLike>): boolean {
    for (let i = 0; i < modifiers.length; i++) {
        const modifierKind = modifiers[i].kind;
        if (modifierKind === SK.AbstractKeyword || modifierKind === SK.DeclareKeyword) {
            return true;
        }
    }
    return false;
}

function scanRange<T>(start: number, end: number, callback: () => T): T {
    return scanner.scanRange(start, /* length: */ end - start, callback);
}

function endPosOfToken(token: ts.SyntaxKind): number {
    let first = true;
    let start = 0;
    while (true) {
        const next = scanner.scan();
        if (first) {
            start = scanner.getTokenStart();
            first = false;
        }
        if (next === token) break;
        if (next === SK.EndOfFileToken) {
            // We should always find the token we are looking for
            // if we don't, return the start of where we started searching from
            return start;
        }
    }
    return scanner.getTokenEnd();
}

/** > */
function getGreaterThanToken() {
    return endPosOfToken(SK.GreaterThanToken);
}

/** ) */
function getClosingParen() {
    return endPosOfToken(SK.CloseParenToken);
}

function blankTypeNode(n: ts.TypeNode): void {
    // -1 for `:`
    str.blank(n.getFullStart() - 1, n.end);
}

function blankExact(n: ts.Node): void {
    str.blank(n.getStart(ast), n.end);
}

function blankStatement(n: ts.Node): void {
    if (seenJS) {
        str.blankButStartWithSemi(n.getStart(ast), n.end);
    } else {
        str.blank(n.getStart(ast), n.end);
    }
}

function blankExactAndOptionalTrailingComma(n: ts.Node): void {
    scanner.resetTokenState(n.end);
    const trailingComma = scanner.scan() === SK.CommaToken;
    str.blank(n.getStart(ast), trailingComma ? scanner.getTokenEnd() : n.end);
}

/**
 * `<T1, T2>`
 */
function blankGenerics(node: ts.Node, arr: ts.NodeArray<ts.Node>, startWithParen: boolean): void {
    const start = arr.pos - 1;
    const end = scanRange(arr.end, node.end, getGreaterThanToken);
    startWithParen ? str.blankButStartWithOpenParen(start, end) : str.blank(start, end);
}

function getClosingParenthesisPos(node: ts.NodeArray<ts.ParameterDeclaration>): number {
    return scanRange(node.length === 0 ? node.pos : node[node.length - 1].end, ast.end, getClosingParen);
}

function never(_n: never): never {
    throw new Error("unreachable code was reached");
}
