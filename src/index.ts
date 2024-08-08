// Copyright 2023 Bloomberg Finance L.P.
// Distributed under the terms of the Apache 2.0 license.
import type * as ts from "typescript";
import tslib from "typescript";
import BlankString from "./blank-string.js";

const BLANK = ""; // blank
const JS = null; // javascript
type NodeContents = "" | null;
type ErrorCb = ((n: ts.Node) => void);

const languageOptions: ts.CreateSourceFileOptions = {
    languageVersion: tslib.ScriptTarget.ESNext,
    impliedNodeFormat: tslib.ModuleKind.ESNext,
};

// State is hoisted to module scope so we can avoid making so many closures

const scanner = tslib.createScanner(tslib.ScriptTarget.ESNext, /*skipTrivia: */true, tslib.LanguageVariant.Standard);
if (tslib.JSDocParsingMode) {
    // TypeScript >= 5.3
    languageOptions.jsDocParsingMode = tslib.JSDocParsingMode.ParseNone;
    scanner.setJSDocParsingMode(tslib.JSDocParsingMode.ParseNone);
}

let src = "";
let str = new BlankString("");
let ast: ts.SourceFile;
let onError: ErrorCb | undefined;
let seenJS = false;
let missingSemiPos = 0;

/**
 * @param input string containing TypeScript
 * @param onErrorArg callback when unsupported syntax is encountered
 * @returns the resulting JavaScript
 */
export default function tsBlankSpace(input: string, onErrorArg?: ErrorCb): string {
    return blankSourceFile(
        tslib.createSourceFile("input.ts", input, languageOptions, /* setParentNodes: */ false, tslib.ScriptKind.TS),
        onErrorArg
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

        ast.forEachChild(visitTop);

        return str.toString();
    } finally {
        // Cleanup. Release memory. Reset state.
        scanner.setText("");
        onError = undefined;
        ast = undefined as any;
        str = undefined as any;
        src = "";
        seenJS = false;
        missingSemiPos = 0;
    }
}

const {
    EndOfFileToken,
    Identifier,
    VariableDeclaration,
    VariableStatement,
    InterfaceDeclaration,
    TypeAliasDeclaration,
    ClassDeclaration,
    ClassExpression,
    ExpressionWithTypeArguments,
    PropertyDeclaration,
    IndexSignature,
    NonNullExpression,
    AsExpression,
    SatisfiesExpression,
    Constructor,
    MethodDeclaration,
    FunctionDeclaration,
    ArrowFunction,
    FunctionExpression,
    GetAccessor,
    SetAccessor,
    ImportDeclaration,
    ImportEqualsDeclaration,
    ExportDeclaration,
    ExportAssignment,
    EnumDeclaration,
    ModuleDeclaration,
    PrivateKeyword,
    ProtectedKeyword,
    PublicKeyword,
    AbstractKeyword,
    OverrideKeyword,
    DeclareKeyword,
    ReadonlyKeyword,
    CommaToken,
    GreaterThanToken,
    LessThanToken,
    CloseParenToken,
    ImplementsKeyword,
    ExtendsKeyword,
    NewExpression,
    CallExpression,
    TypeAssertionExpression,
    ExpressionStatement,
    TaggedTemplateExpression,
    Block,
    Decorator,
} = tslib.SyntaxKind;

function visitTop(node: ts.Node): void {
    if (innerVisitTop(node) === JS) {
        seenJS = true;
    }
}

function innerVisitTop(node: ts.Node): NodeContents {
    const n = node as any;
    switch (node.kind) {
        case ImportDeclaration: return visitImportDeclaration(n);
        case ExportDeclaration: return visitExportDeclaration(n);
        case ExportAssignment: return visitExportAssignment(n);
        case ImportEqualsDeclaration: onError && onError(n); return JS;
    }
    return visitor(node);
}

function visitor(node: ts.Node): NodeContents {
    const r = innerVisitor(node);
    if (r === JS) {
        seenJS = true;
    }
    return r;
}

function innerVisitor(node: ts.Node): NodeContents {
    const n = node as any;
    switch (node.kind) {
        case Identifier: return JS;
        case ExpressionStatement: return visitExpressionStatement(n);
        case VariableDeclaration: return visitVariableDeclaration(n);
        case VariableStatement: return visitVariableStatement(n);
        case CallExpression:
        case NewExpression: return visitCallOrNewExpression(n);
        case TypeAliasDeclaration:
        case InterfaceDeclaration: blankStatement(n); return BLANK;
        case ClassDeclaration:
        case ClassExpression: return visitClassLike(n);
        case ExpressionWithTypeArguments: return visitExpressionWithTypeArguments(n);
        case PropertyDeclaration: return visitPropertyDeclaration(n);
        case NonNullExpression: return visitNonNullExpression(n);
        case SatisfiesExpression:
        case AsExpression: return visitTypeAssertion(n);
        case ArrowFunction:
        case FunctionDeclaration:
        case MethodDeclaration:
        case Constructor:
        case FunctionExpression:
        case GetAccessor:
        case SetAccessor:
            return visitFunctionLikeDeclaration(n);
        case EnumDeclaration:
        case ModuleDeclaration: return visitEnumOrModule(n);
        case IndexSignature: blankExact(n); return BLANK;
        case TaggedTemplateExpression: return visitTaggedTemplate(n);
        case TypeAssertionExpression: return visitLegacyTypeAssertion(n);
    }

    return node.forEachChild(visitor) || JS;
}

function visitExpressionStatement(node: ts.ExpressionStatement): NodeContents {
    if (src.charCodeAt(node.end) !== 59 /* ; */) {
        missingSemiPos = node.end;
    }
    return visitor(node.expression);
}

/**
 * `let x : T` (outer)
 */
function visitVariableStatement(node: ts.VariableStatement): NodeContents {
    if (node.modifiers && modifiersContainsDeclare(node.modifiers)) {
        blankStatement(node);
        return BLANK;
    }
    node.forEachChild(visitor);
    return JS;
}

/**
 * `new Set<string>()` | `foo<string>()`
 */
function visitCallOrNewExpression(node: ts.NewExpression | ts.CallExpression): NodeContents {
    visitor(node.expression);
    if (node.typeArguments) {
        blankGenerics(node, node.typeArguments);
    }
    if (node.arguments) {
        for (let i = 0; i < node.arguments.length; i++) {
            visitor(node.arguments[i]);
        }
    }
    return JS;
}

/**
 * foo<T>`tagged template`
 */
function visitTaggedTemplate(node: ts.TaggedTemplateExpression): NodeContents {
    visitor(node.tag);
    if (node.typeArguments) {
        blankGenerics(node, node.typeArguments);
    }
    visitor(node.template);
    return JS;
}

/**
 * `let x : T = v` (inner)
 */
function visitVariableDeclaration(node: ts.VariableDeclaration): NodeContents {
    visitor(node.name);

    // let x!
    node.exclamationToken && blankExact(node.exclamationToken);

    // let x: T
    node.type && blankTypeNode(node.type);

    // let x = v
    if (node.initializer) {
        visitor(node.initializer);
    }
    return JS;
}

/**
 * `class ...`
 */
function visitClassLike(node: ts.ClassLikeDeclaration): NodeContents {
    if (node.modifiers) {
        if (modifiersContainsDeclare(node.modifiers)) {
            blankStatement(node);
            return BLANK;
        }
        visitModifiers(node.modifiers);
    }

    // ... <T>
    if (node.typeParameters && node.typeParameters.length) {
        blankGenerics(node, node.typeParameters);
    }

    const {heritageClauses} = node;
    if (heritageClauses) {
        for (let i = 0; i < heritageClauses.length; i++) {
            const hc = heritageClauses[i];
            // implements T
            if (hc.token === ImplementsKeyword) {
                blankExact(hc);
            }
            // ... extends C<T> ...
            else if (hc.token === ExtendsKeyword) {
                hc.forEachChild(visitor);
            }
        }
    }
    node.members.forEach(visitor);
    return JS;
}

/**
 * Exp<T>
 */
function visitExpressionWithTypeArguments(node: ts.ExpressionWithTypeArguments): NodeContents {
    visitor(node.expression);
    if (node.typeArguments) {
        blankGenerics(node, node.typeArguments);
    }
    return JS;
}

function visitModifiers(modifiers: ArrayLike<ts.ModifierLike>): void {
    for (let i = 0; i < modifiers.length; i++) {
        const modifier = modifiers[i];
        switch (modifier.kind) {
            case PrivateKeyword:
            case ProtectedKeyword:
            case PublicKeyword:
            case AbstractKeyword:
            case OverrideKeyword:
            case DeclareKeyword:
            case ReadonlyKeyword:
                blankExact(modifier);
                continue;
            case Decorator:
                visitor(modifier);
                continue;
        }

        // at runtime skip the remaining checks
        // these are here only as a compile-time exhaustive check
        const trueAsFalse = /** @type {false} */(true);
        if (trueAsFalse) continue;

        switch (modifier.kind) {
            case tslib.SyntaxKind.ConstKeyword:
            case tslib.SyntaxKind.DefaultKeyword:
            case tslib.SyntaxKind.ExportKeyword:
            case tslib.SyntaxKind.InKeyword:
            case tslib.SyntaxKind.StaticKeyword:
            case tslib.SyntaxKind.AccessorKeyword:
            case tslib.SyntaxKind.AsyncKeyword:
            case tslib.SyntaxKind.OutKeyword:
                continue;
            default:
                never(modifier);
        }
    }
}

/**
 * prop: T
 */
function visitPropertyDeclaration(node: ts.PropertyDeclaration): NodeContents {
    if (node.modifiers) {
        if (modifiersContainsAbstractOrDeclare(node.modifiers)) {
            blankStatement(node);
            return BLANK;
        }
        visitModifiers(node.modifiers);
    }
    node.exclamationToken && blankExact(node.exclamationToken);
    node.questionToken && blankExact(node.questionToken);
    node.type && blankTypeNode(node.type);

    visitor(node.name);

    if (node.initializer) {
        visitor(node.initializer);
    }
    return JS;
}

/**
 * `expr!`
 */
function visitNonNullExpression(node: ts.NonNullExpression): NodeContents {
    visitor(node.expression);
    str.blank(node.end - 1, node.end);
    return JS;
}

/**
 * `exp satisfies T, exp as T`
 */
function visitTypeAssertion(node: ts.SatisfiesExpression | ts.AsExpression): NodeContents {
    const r = visitor(node.expression);
    if (node.end === missingSemiPos) {
        str.blankButStartWithSemi(node.expression.end, node.end);
    } else {
        str.blank(node.expression.end, node.end);
    }
    return r;
}

/**
 * `<type>v`
 */
function visitLegacyTypeAssertion(node: ts.TypeAssertion): NodeContents {
    onError && onError(node);
    return visitor(node.expression);
}

/**
 * `function<T>(p: T): T {}`
 */
function visitFunctionLikeDeclaration(node: ts.FunctionLikeDeclaration): NodeContents {
    if (!node.body) {
        if (node.modifiers && modifiersContainsDeclare(node.modifiers)) {
            blankStatement(node);
            return BLANK;
        }
        // else: overload
        blankExact(node);
        return BLANK;
    }

    if (node.modifiers) {
        visitModifiers(node.modifiers);
    }

    if (node.name) {
        visitor(node.name);
    }

    if (node.typeParameters && node.typeParameters.length) {
        blankGenerics(node, node.typeParameters);
    }

    // method?
    node.questionToken && blankExact(node.questionToken);

    for (let i = 0; i < node.parameters.length; i++) {
        const p = node.parameters[i];
        if (i === 0 && p.name.getText(ast) === "this") {
            blankExactAndOptionalTrailingComma(p);
            continue;
        }
        if (p.modifiers) {
            // error on non-standard parameter properties
            for (let i = 0; i < p.modifiers.length; i++) {
                const mod = p.modifiers[i];
                switch (mod.kind) {
                    case PublicKeyword:
                    case ProtectedKeyword:
                    case PrivateKeyword:
                    case ReadonlyKeyword:
                        onError && onError(mod);
                }
            }
        }
        visitor(p.name);
        p.questionToken && blankExact(p.questionToken);
        p.type && blankTypeNode(p.type);
        p.initializer && visitor(p.initializer);
    }

    const returnType = node.type;
    const isArrow = node.kind === ArrowFunction;
    if (returnType) {
        if (!isArrow || !spansLines(node.parameters.end, node.equalsGreaterThanToken.pos)) {
            blankTypeNode(returnType);
        } else {
            // danger! new line between parameters and `=>`
            const paramEnd = getClosingParenthesisPos(node.parameters);
            str.blankButEndWithCloseParen(paramEnd - 1, returnType.getEnd());
        }
    }

    const body = node.body;
    if (body.kind === Block) {
        const statements = (body as ts.Block).statements;
        const cache = seenJS;
        seenJS = false;
        for (let i = 0; i < statements.length; i++) {
            if (visitor(statements[i]) === JS) {
                seenJS = true;
            }
        }
        seenJS = cache;
    } else {
        visitor(node.body);
    }
    return JS;
}

function spansLines(a: number, b: number): boolean {
    return ast.getLineEndOfPosition(a) !== ast.getLineEndOfPosition(b);
}

/**
 * `import ...`
 */
function visitImportDeclaration(node: ts.ImportDeclaration): NodeContents {
    if (node.importClause) {
        if (node.importClause.isTypeOnly) {
            blankStatement(node);
            return BLANK;
        }
        const {namedBindings} = node.importClause;
        if (namedBindings && tslib.isNamedImports(namedBindings)) {
            const elements = namedBindings.elements;
            for (let i = 0; i < elements.length; i++) {
                const e = elements[i];
                e.isTypeOnly && blankExactAndOptionalTrailingComma(e);
            }
        }
    }
    return JS;
}

/**
 * `export ...`
 */
function visitExportDeclaration(node: ts.ExportDeclaration): NodeContents {
    if (node.isTypeOnly) {
        blankStatement(node);
        return BLANK;
    }

    const {exportClause} = node;
    if (exportClause && tslib.isNamedExports(exportClause)) {
        const elements = exportClause.elements;
        for (let i = 0; i < elements.length; i++) {
            const e = elements[i];
            e.isTypeOnly && blankExactAndOptionalTrailingComma(e);
        }
    }
    return JS;
}

/**
 * `export default ...`
 */
function visitExportAssignment(node: ts.ExportAssignment): NodeContents {
    if (node.isExportEquals) {
        // `export = ...`
        onError && onError(node);
        return JS;
    }
    visitor(node.expression);
    return JS;
}

function visitEnumOrModule(node: ts.EnumDeclaration | ts.ModuleDeclaration): NodeContents {
    if (node.modifiers && modifiersContainsDeclare(node.modifiers)) {
        blankStatement(node);
        return BLANK;
    } else {
        onError && onError(node);
        return JS;
    }
}

function modifiersContainsDeclare(modifiers: ArrayLike<ts.ModifierLike>): boolean {
    for (let i = 0; i < modifiers.length; i++) {
        const modifier = modifiers[i];
        if (modifier.kind === DeclareKeyword) {
            return true;
        }
    }
    return false;
}

function modifiersContainsAbstractOrDeclare(modifiers: ArrayLike<ts.ModifierLike>): boolean {
    for (let i = 0; i < modifiers.length; i++) {
        const modifierKind = modifiers[i].kind;
        if (modifierKind === AbstractKeyword || modifierKind === DeclareKeyword) {
            return true;
        }
    }
    return false;
}

function scanRange<T>(start: number, end: number, callback: () => T): T {
    return scanner.scanRange(
        start,
        end - start,
        callback
    );
}

function posOfToken(token: ts.SyntaxKind, end: boolean): number {
    let first = true;
    let start = 0;
    while (true) {
        const next = scanner.scan();
        if (first) {
            start = scanner.getTokenStart();
        }
        first = false;
        if (next === token) break;
        if (next === EndOfFileToken) {
            // We should always find the token we are looking for
            // if we don't, return the start of where we started searching from
            return start;
        }
    }
    return end ? scanner.getTokenEnd() : scanner.getTokenStart();
}

/** < */
function getLessThanToken() {
    return posOfToken(LessThanToken, /* end: */false);
}
/** > */
function getGreaterThanToken() {
    return posOfToken(GreaterThanToken, /* end: */true);
}
/** ) */
function getClosingParen() {
    return posOfToken(CloseParenToken, /* end: */true);
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
    const trailingComma = scanner.scan() === CommaToken;
    str.blank(n.getStart(ast), trailingComma ? scanner.getTokenEnd() : n.end);
}

/**
 * `<T1, T2>`
 */
function blankGenerics(node: ts.Node, arr: ts.NodeArray<ts.Node>): void {
    const start = scanRange(
        arr.pos - 1,
        arr[0].getFullStart(),
        getLessThanToken
    );
    const end = scanRange(
        arr.end,
        node.end,
        getGreaterThanToken
    );
    str.blank(start, end);
}

function getClosingParenthesisPos(node: ts.NodeArray<ts.ParameterDeclaration>): number {
    if (node.length === 0) {
        return scanRange(
            node.pos,
            ast.end,
            getClosingParen,
        );
    }
    return scanRange(
        node[node.length -1].end,
        ast.end,
        getClosingParen,
    );
}

function never(n: never): never {
    throw new Error("unreachable code was reached");
}
