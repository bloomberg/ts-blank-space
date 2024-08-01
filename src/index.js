// Copyright 2023 Bloomberg Finance L.P.
// Distributed under the terms of the Apache 2.0 license.
// @ts-check
import ts from "typescript";
import BlankString from "./blank-string.js";

const BLANK = ""; // blank
const JS = null; // javascript

/** @typedef {"" | null} NodeContents */

/**
 * @type {ts.CreateSourceFileOptions}
 */
const languageOptions = {
    languageVersion: ts.ScriptTarget.ESNext,
    impliedNodeFormat: ts.ModuleKind.ESNext,
};

// State is hoisted to module scope so we can avoid making so many closures

const scanner = ts.createScanner(ts.ScriptTarget.ESNext, /*skipTrivia: */true, ts.LanguageVariant.Standard);
if (ts.JSDocParsingMode) {
    // TypeScript >= 5.3
    languageOptions.jsDocParsingMode = ts.JSDocParsingMode.ParseNone;
    scanner.setJSDocParsingMode(ts.JSDocParsingMode.ParseNone);
}

let src = "";
let str = new BlankString("");

/** @type {ts.SourceFile} */
let ast;

/** @type {undefined | ((n: ts.Node) => void)} */
let onError;

let seenJS = false;
let missingSemiPos = 0;

/**
 * @param {string} input string containing TypeScript
 * @param {typeof onError} [onErrorArg] callback when unsupported syntax is encountered
 * @returns {string} containing JavaScript
 */
export default function tsBlankSpace(input, onErrorArg) {
    return blankSourceFile(
        ts.createSourceFile("input.ts", input, languageOptions, /* setParentNodes: */ false, ts.ScriptKind.TS),
        onErrorArg
    );
}

/**
 * @param {ts.SourceFile} source containing TypeScript's AST
 * @param {typeof onError} [onErrorArg] callback when unsupported syntax is encountered
 * @returns {string} containing JavaScript
 */
export function blankSourceFile(source, onErrorArg) {
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
        ast = /** @type {any} */(undefined);
        str = /** @type {any} */(undefined);
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
    ReturnStatement,
    ExpressionStatement,
    TaggedTemplateExpression,
    Block,
} = ts.SyntaxKind;


/**
 * @param {ts.Node} node
 * @returns {void}
 */
function visitTop(node) {
    if (innerVisitTop(node) === JS) {
        seenJS = true;
    }
}

/**
 * @param {ts.Node} node
 * @returns {NodeContents}
 */
function innerVisitTop(node) {
    const n = /** @type {any} */(node);
    switch (node.kind) {
        case ImportDeclaration: return visitImportDeclaration(n);
        case ExportDeclaration: return visitExportDeclaration(n);
        case ExportAssignment: return visitExportAssignment(n);
        case ImportEqualsDeclaration: onError && onError(n); return JS;
    }
    return visitor(node);
}

/**
 * @param {ts.Node} node
 * @returns {NodeContents}
 */
function visitor(node) {
    const r = innerVisitor(node);
    if (r === JS) {
        seenJS = true;
    }
    return r;
}

/**
 * @param {ts.Node} node
 * @returns {NodeContents}
 */
function innerVisitor(node) {
    const n = /** @type {any} */(node);
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
        case ReturnStatement: return visitReturn(n);
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

/**
 * @param {ts.ExpressionStatement} node
 * @returns {NodeContents}
 */
function visitExpressionStatement(node) {
    if (src.charCodeAt(node.end) !== 59 /* ; */) {
        missingSemiPos = node.end;
    }
    return visitor(node.expression);
}

/**
 * `let x : T` (outer)
 * @param {ts.VariableStatement} node
 * @returns {NodeContents}
 */
function visitVariableStatement(node) {
    if (node.modifiers && modifiersContainsDeclare(node.modifiers)) {
        blankStatement(node);
        return BLANK;
    }
    node.forEachChild(visitor);
    return JS;
}

/**
 * `return ...`
 * @param {ts.ReturnStatement} node
 * @returns {NodeContents}
 */
function visitReturn(node) {
    const exp = node.expression;
    if (exp) {
        visitor(exp);
    }
    return JS;
}

/**
 * `new Set<string>()` | `foo<string>()`
 * @param {ts.NewExpression | ts.CallExpression} node
 * @returns {NodeContents}
 */
function visitCallOrNewExpression(node) {
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
 * @param {ts.TaggedTemplateExpression} node
 * @returns {NodeContents}
 */
function visitTaggedTemplate(node) {
    visitor(node.tag);
    if (node.typeArguments) {
        blankGenerics(node, node.typeArguments);
    }
    visitor(node.template);
    return JS;
}

/**
 * `let x : T = v` (inner)
 * @param {ts.VariableDeclaration} node
 * @returns {NodeContents}
 */
function visitVariableDeclaration(node) {
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
 * @param {ts.ClassLikeDeclaration} node
 * @returns {NodeContents}
 */
function visitClassLike(node) {
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
 * @param {ts.ExpressionWithTypeArguments} node
 * @returns {NodeContents}
 */
function visitExpressionWithTypeArguments(node) {
    visitor(node.expression);
    if (node.typeArguments) {
        blankGenerics(node, node.typeArguments);
    }
    return JS;
}

/**
 * @param {ArrayLike<ts.ModifierLike>} modifiers
 * @returns {void}
 */
function visitModifiers(modifiers) {
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
        }

        // at runtime skip the remaining checks
        // these are here only as a compile-time exhaustive check
        const trueAsFalse = /** @type {false} */(true);
        if (trueAsFalse) continue;

        switch (modifier.kind) {
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

/**
 * prop: T
 * @param {ts.PropertyDeclaration} node
 * @returns {NodeContents}
 */
function visitPropertyDeclaration(node) {
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
 * @param {ts.NonNullExpression} node
 * @returns {NodeContents}
 */
function visitNonNullExpression(node) {
    visitor(node.expression);
    str.blank(node.end - 1, node.end);
    return JS;
}

/**
 * `exp satisfies T, exp as T`
 * @param {ts.SatisfiesExpression | ts.AsExpression} node
 * @returns {NodeContents}
 */
function visitTypeAssertion(node) {
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
 * @param {ts.TypeAssertion} node
 * @returns {NodeContents}
 */
function visitLegacyTypeAssertion(node) {
    onError && onError(node);
    return visitor(node.expression);
}

/**
 * `function<T>(p: T): T {}`
 * @param {ts.FunctionLikeDeclaration} node
 * @returns {NodeContents}
 */
function visitFunctionLikeDeclaration(node) {
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
        const statements = /** @type {ts.Block} */(body).statements;
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

/**
 * @param {number} a
 * @param {number} b
 * @returns {boolean}
 */
function spansLines(a, b) {
    return ast.getLineEndOfPosition(a) !== ast.getLineEndOfPosition(b);
}

/**
 * `import ...`
 * @param {ts.ImportDeclaration} node
 * @returns {NodeContents}
 */
function visitImportDeclaration(node) {
    if (node.importClause) {
        if (node.importClause.isTypeOnly) {
            blankStatement(node);
            return BLANK;
        }
        const {namedBindings} = node.importClause;
        if (namedBindings && ts.isNamedImports(namedBindings)) {
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
 * @param {ts.ExportDeclaration} node
 * @returns {NodeContents}
 */
function visitExportDeclaration(node) {
    if (node.isTypeOnly) {
        blankStatement(node);
        return BLANK;
    }

    const {exportClause} = node;
    if (exportClause && ts.isNamedExports(exportClause)) {
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
 * @param {ts.ExportAssignment} node
 * @returns {NodeContents}
 */
function visitExportAssignment(node) {
    if (node.isExportEquals) {
        // `export = ...`
        onError && onError(node);
        return JS;
    }
    visitor(node.expression);
    return JS;
}

/**
 * @param {ts.EnumDeclaration | ts.ModuleDeclaration} node
 * @returns {NodeContents}
 */
function visitEnumOrModule(node) {
    if (node.modifiers && modifiersContainsDeclare(node.modifiers)) {
        blankStatement(node);
        return BLANK;
    } else {
        onError && onError(node);
        return JS;
    }
}

/**
 * @param {ArrayLike<ts.ModifierLike>} modifiers
 * @returns {boolean}
 */
function modifiersContainsDeclare(modifiers) {
    for (let i = 0; i < modifiers.length; i++) {
        const modifier = modifiers[i];
        if (modifier.kind === DeclareKeyword) {
            return true;
        }
    }
    return false;
}

/**
 * @param {ArrayLike<ts.ModifierLike>} modifiers
 * @returns {boolean}
 */
function modifiersContainsAbstractOrDeclare(modifiers) {
    for (let i = 0; i < modifiers.length; i++) {
        const modifierKind = modifiers[i].kind;
        if (modifierKind === AbstractKeyword || modifierKind === DeclareKeyword) {
            return true;
        }
    }
    return false;
}

/**
 * @template T
 * @param {number} start
 * @param {number} end
 * @param {() => T} callback
 * @returns {T}
 */
function scanRange(start, end, callback) {
    return scanner.scanRange(
        start,
        end - start,
        callback
    );
}

/**
 * @param {ts.SyntaxKind} token
 * @param {boolean} end
 * @returns {number}
 */
function posOfToken(token, end) {
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

/** @param {ts.TypeNode} n  */
function blankTypeNode(n) {
    // -1 for `:`
    str.blank(n.getFullStart() - 1, n.end);
}

/** @param {ts.Node} n  */
function blankExact(n) {
    str.blank(n.getStart(ast), n.end);
}

/** @param {ts.Node} n  */
function blankStatement(n) {
    if (seenJS) {
        str.blankButStartWithSemi(n.getStart(ast), n.end);
    } else {
        str.blank(n.getStart(ast), n.end);
    }
}

/** @param {ts.Node} n  */
function blankExactAndOptionalTrailingComma(n) {
    scanner.resetTokenState(n.end);
    const trailingComma = scanner.scan() === CommaToken;
    str.blank(n.getStart(ast), trailingComma ? scanner.getTokenEnd() : n.end);
}

/**
 * `<T1, T2>`
 * @param {ts.Node} node
 * @param {ts.NodeArray<ts.Node>} arr
 */
function blankGenerics(node, arr) {
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

/**
 * @param {ts.NodeArray<ts.ParameterDeclaration>} node
 * @returns {number}
 */
function getClosingParenthesisPos(node) {
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

/**
 * @param {never} n
 * @return {never}
 */
function never(n) {
    throw new Error("unreachable code was reached");
}
