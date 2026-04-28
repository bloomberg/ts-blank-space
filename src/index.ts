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
let semicolonNeeded = false;
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
        semicolonNeeded = false;
        parentStatement = undefined;
    }
}

function visitUnknownNodeArray(nodes: ts.NodeArray<ts.Node>): VisitResult {
    if (nodes.length === 0) return VISITED_JS;
    return visitNodeArray(nodes, tslib.isStatement(nodes[0]), /* isFunctionBody: */ false);
}

function visitNodeArray(nodes: ts.NodeArray<ts.Node>, isStatementLike: boolean, isFunctionBody: boolean): VisitResult {
    const previousParentStatement = parentStatement;
    const previousSemicolonNeeded = semicolonNeeded;
    if (isFunctionBody) {
        semicolonNeeded = false; // 'semicolonNeeded' resets for nested execution context
    }
    for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (isStatementLike) {
            parentStatement = n;
        }
        if (visitStatementLike(n) === VISITED_JS) {
            semicolonNeeded = src.charCodeAt(n.end - 1) !== 59 /* ; */;
        }
    }
    parentStatement = previousParentStatement;
    if (isFunctionBody) {
        semicolonNeeded = previousSemicolonNeeded;
    }
    return semicolonNeeded ? VISITED_JS : VISIT_BLANKED;
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
    if (r === VISITED_JS) semicolonNeeded = src.charCodeAt(node.end - 1) !== 59 /* ; */;
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
        case SK.BinaryExpression: return visitBinaryExpression(node as ts.BinaryExpression);
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
        case SK.EnumDeclaration: return visitEnum(node as ts.EnumDeclaration);
        case SK.ModuleDeclaration: return visitModule(node as ts.ModuleDeclaration);
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
    if (assertionChainWouldChangeBinaryGrouping(node)) {
        onError && onError(node);
        return VISITED_JS;
    }

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

function isAssertionExpression(node: ts.Node): node is ts.AsExpression | ts.SatisfiesExpression {
    return node.kind === SK.AsExpression || node.kind === SK.SatisfiesExpression;
}

/**
 * Detect if erasing a type-assertion annotation would result in a runtime
 * syntax error due to unparenthesized mixing of `??` with `&&` or `||`.
 * e.g. In `a ?? b as T && c` erasing `as T` would produce `a ?? b && c` which is a SyntaxError.
 */
function visitBinaryExpression(node: ts.BinaryExpression): VisitResult {
    const opKind = node.operatorToken.kind;
    if (isNullishOrLogical(opKind)) {
        if (
            tslib.isBinaryExpression(node.right) &&
            hasUnsafeNullishLogicalMix(opKind, node.right.operatorToken.kind) &&
            isAssertionExpression(node.right.left)
        ) {
            // e.g. `a ?? b as T && c` parses as `??[a, &&[as[b, T], c]]`
            visitor(node.left);
            onError && onError(node.right.left);
            visitor(node.right.right);
            return VISITED_JS;
        }
        if (
            tslib.isBinaryExpression(node.left) &&
            hasUnsafeNullishLogicalMix(opKind, node.left.operatorToken.kind) &&
            isAssertionExpression(node.left.right)
        ) {
            // e.g. `a && b as T ?? c` parses as `??[&&[a, as[b, T]], c]`
            //   or `a || b as T ?? c` parses as `??[||[a, as[b, T]], c]`
            //   or `a ?? b as T || c` parses as `||[??[a, as[b, T]], c]`
            visitor(node.left.left);
            onError && onError(node.left.right);
            visitor(node.right);
            return VISITED_JS;
        }
    }
    visitor(node.left);
    visitor(node.right);
    return VISITED_JS;
}

/**
 * Detect cases where erasing a type assertion would change operator grouping. e.g. `1 + 1 as T / 2`
 * @see https://github.com/bloomberg/ts-blank-space/issues/62
 */
function assertionChainWouldChangeBinaryGrouping(node: ts.AsExpression | ts.SatisfiesExpression): boolean {
    let baseExpr: ts.Expression = node.expression;
    while (isAssertionExpression(baseExpr)) {
        baseExpr = baseExpr.expression;
    }

    if (!tslib.isBinaryExpression(baseExpr)) {
        return false;
    }

    const nextToken = scanRange(node.end, ast.end, scanner.scan.bind(scanner));
    const basePrecedence = getBinaryOperatorPrecedence(baseExpr.operatorToken.kind);
    const nextPrecedence = getBinaryOperatorPrecedence(nextToken);
    if (basePrecedence === undefined || nextPrecedence === undefined) {
        return false;
    }

    if (nextPrecedence > basePrecedence) {
        return true; // higher next precedence is unsafe, the grouping would change
    }

    if (nextPrecedence === basePrecedence) {
        // Only right-associative is unsafe e.g. `**`
        return !areOperatorsSafelyAssociative(baseExpr.operatorToken.kind, nextToken);
    }

    return false;
}

function getBinaryOperatorPrecedence(token: ts.SyntaxKind): number | undefined {
    switch (token) {
        case SK.AsteriskAsteriskToken:
            return 15;
        case SK.AsteriskToken:
        case SK.SlashToken:
        case SK.PercentToken:
            return 14;
        case SK.PlusToken:
        case SK.MinusToken:
            return 13;
        case SK.LessThanLessThanToken:
        case SK.GreaterThanGreaterThanToken:
        case SK.GreaterThanGreaterThanGreaterThanToken:
            return 12;
        case SK.LessThanToken:
        case SK.LessThanEqualsToken:
        case SK.GreaterThanToken:
        case SK.GreaterThanEqualsToken:
        case SK.InstanceOfKeyword:
        case SK.InKeyword:
            return 11;
        case SK.EqualsEqualsToken:
        case SK.ExclamationEqualsToken:
        case SK.EqualsEqualsEqualsToken:
        case SK.ExclamationEqualsEqualsToken:
            return 10;
        case SK.AmpersandToken:
            return 9;
        case SK.CaretToken:
            return 8;
        case SK.BarToken:
            return 7;
        case SK.AmpersandAmpersandToken:
            return 6;
        case SK.BarBarToken:
            return 5;
        case SK.QuestionQuestionToken:
            return 4;
        default:
            return undefined;
    }
}

function isNullishOrLogical(token: ts.SyntaxKind): boolean {
    return token === SK.QuestionQuestionToken || token === SK.BarBarToken || token === SK.AmpersandAmpersandToken;
}

// JavaScript requires explicit parentheses when mixing `??` with `||` or `&&`.
function hasUnsafeNullishLogicalMix(left: ts.SyntaxKind, right: ts.SyntaxKind): boolean {
    if (left === right) return false;
    if (left === SK.QuestionQuestionToken) return isNullishOrLogical(right);
    if (right === SK.QuestionQuestionToken) return isNullishOrLogical(left);
    return false;
}

function areOperatorsSafelyAssociative(left: ts.SyntaxKind, right: ts.SyntaxKind): boolean {
    // Exponentiation is right-associative, so `(a ** b) ** c` and `a ** b ** c` differ.
    if (left === SK.AsteriskAsteriskToken || right === SK.AsteriskAsteriskToken) {
        return false;
    }
    return true;
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
    const params = node.parameters;
    if (node.typeParameters && node.typeParameters.length) {
        moveOpenParen = spansLines(node.typeParameters.pos, params.pos);
        blankGenerics(node, node.typeParameters, moveOpenParen);
    }

    // method?
    node.questionToken && blankExact(node.questionToken);

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

function visitModule(node: ts.ModuleDeclaration): VisitResult {
    if (
        // `declare global {...}
        node.flags & tslib.NodeFlags.GlobalAugmentation ||
        // `namespace N {...}`
        (node.flags & tslib.NodeFlags.Namespace &&
            // `declare namespace N {...}`
            ((node.modifiers && modifiersContainsDeclare(node.modifiers)) ||
                // `namespace N { <no values> }`
                !valueNamespaceWorker(node))) ||
        // `declare module "./path" {...}`
        node.name.kind === SK.StringLiteral
    ) {
        blankStatement(node);
        return VISIT_BLANKED;
    } else {
        onError && onError(node);
        return VISITED_JS;
    }
}

function visitEnum(node: ts.EnumDeclaration): VisitResult {
    if (node.modifiers && modifiersContainsDeclare(node.modifiers)) {
        blankStatement(node);
        return VISIT_BLANKED;
    } else {
        onError && onError(node);
        return VISITED_JS;
    }
}

function valueNamespaceWorker(node: ts.Node): boolean {
    switch (node.kind) {
        case SK.TypeAliasDeclaration:
        case SK.InterfaceDeclaration:
            return false;
        case SK.ImportEqualsDeclaration: {
            const { modifiers } = node as ts.ImportEqualsDeclaration;
            return modifiers?.some((m) => m.kind === SK.ExportKeyword) || false;
        }
        case SK.ModuleDeclaration: {
            if (!(node.flags & tslib.NodeFlags.Namespace)) return true;
            const { body } = node as ts.ModuleDeclaration;
            if (!body) return false;
            if (body.kind === SK.ModuleDeclaration) return valueNamespaceWorker(body);
            return body.forEachChild(valueNamespaceWorker) || false;
        }
    }
    return true;
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
    if (semicolonNeeded) {
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
