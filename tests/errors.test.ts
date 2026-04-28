import { it, mock } from "node:test";
import assert from "node:assert";
import tsBlankSpace from "../src/index.ts";
import ts from "typescript";

it("errors on enums", () => {
    const onError = mock.fn();
    const out = tsBlankSpace(
        `
       enum E1 {}
       export enum E2 {}
    `,
        onError,
    );
    assert.equal(onError.mock.callCount(), 2);
    assert.equal(
        out,
        `
       enum E1 {}
       export enum E2 {}
    `,
    );
});

it("errors on parameter properties", () => {
    const onError = mock.fn();
    const out = tsBlankSpace(
        `
        class C {
            constructor(public a, private b, protected c, readonly d) {}
        }
    `,
        onError,
    );
    assert.equal(onError.mock.callCount(), 4);
    assert.equal(
        out,
        `
        class C {
            constructor(public a, private b, protected c, readonly d) {}
        }
    `,
    );
});

function errorCallbackToModuleDeclarationNames(onError: import("node:test").Mock<(...args: any[]) => void>): string[] {
    return onError.mock.calls.map(({ arguments: [node] }) => {
        assert(ts.isModuleDeclaration(node));
        assert(ts.isIdentifier(node.name));
        return node.name.escapedText.toString();
    });
}

it("errors on TypeScript `module` declarations due to overlap with github.com/tc39/proposal-module-declarations", () => {
    const onError = mock.fn();
    const out = tsBlankSpace(
        `
        module A {}
        module B { export type T = string; }
        module C { export const V = ""; }
        module D.E {}
    `,
        onError,
    );
    assert.equal(onError.mock.callCount(), 4);
    const errorNodeNames = errorCallbackToModuleDeclarationNames(onError);
    assert.deepEqual(errorNodeNames, ["A", "B", "C", "D"]);
    assert.equal(
        out,
        `
        module A {}
        module B { export type T = string; }
        module C { export const V = ""; }
        module D.E {}
    `,
    );
});

it("errors on instantiated namespaces due to having runtime emit", () => {
    const onError = mock.fn();
    const out = tsBlankSpace(
        `
        namespace A { 1; }
        namespace B { globalThis; }
        namespace C { export let x; }
        namespace D { declare let x; }
        namespace E { export type T = any; 2; }
        namespace F { export namespace Inner { 3; } }
        namespace G.H { 4; }
        namespace I { export import X = E.T }
        namespace J { {} }
    `,
        onError,
    );
    assert.equal(onError.mock.callCount(), 9);
    const errorNodeNames = errorCallbackToModuleDeclarationNames(onError);
    assert.deepEqual(errorNodeNames, ["A", "B", "C", "D", "E", "F", "G", /* H (nested)*/ "I", "J"]);
    assert.equal(
        out,
        `
        namespace A { 1; }
        namespace B { globalThis; }
        namespace C { export let x; }
        namespace D { declare let x; }
        namespace E { export type T = any; 2; }
        namespace F { export namespace Inner { 3; } }
        namespace G.H { 4; }
        namespace I { export import X = E.T }
        namespace J { {} }
    `,
    );
});

it("importing instantiated namespace", () => {
    const onError = mock.fn();
    const out = tsBlankSpace(
        `
        namespace A { export let x = 1; }
        namespace B { import x = A.x; }
        namespace C { export import x = A.x; }
        `,
        onError,
    );
    assert.equal(onError.mock.callCount(), 2);
    const errorNodeNames = errorCallbackToModuleDeclarationNames(onError);
    assert.deepEqual(errorNodeNames, ["A", "C"]);
    // Only 'B' is erased:
    assert.equal(
        out,
        [
            ``,
            `        namespace A { export let x = 1; }`,
            `        ;                              `,
            `        namespace C { export import x = A.x; }`,
            `        `,
        ].join("\n"),
    );
});

it("errors on declared legacy modules", () => {
    const onError = mock.fn();
    const out = tsBlankSpace(`declare module M {}\n`, onError);
    assert.equal(onError.mock.callCount(), 1);
    assert.equal(out, "declare module M {}\n");
});

it("errors on non-instantiated legacy modules", () => {
    const onError = mock.fn();
    const out = tsBlankSpace(`module M {}\n`, onError);
    assert.equal(onError.mock.callCount(), 1);
    assert.equal(out, "module M {}\n");
});

it("errors on CJS export assignment syntax", () => {
    const onError = mock.fn();
    const out = tsBlankSpace(
        `
        export = 1;
    `,
        onError,
    );
    assert.equal(onError.mock.callCount(), 1);
    assert.equal(
        out,
        `
        export = 1;
    `,
    );
});

it("errors on CJS import syntax", () => {
    const onError = mock.fn();
    const out = tsBlankSpace(
        `
        import lib = require("");
    `,
        onError,
    );
    assert.equal(onError.mock.callCount(), 1);
    assert.equal(
        out,
        `
        import lib = require("");
    `,
    );
});

it("errors on `as` expression that would change operator precedence if erased", () => {
    const onError = mock.fn();
    const tsInput = `1+1 as T / 2`;
    let jsOutput = tsBlankSpace(tsInput, onError);
    assert.equal(onError.mock.callCount(), 1);
    // TypeScript would emit `(1+1) / 2`, but ts-blank-space can't insert
    // the leading `(` without shifting offsets, so it must error.
    assert.equal(jsOutput, `1+1 as T / 2`);
});

it("errors on (invalid) `as const` expression that would change operator precedence if evaluated", () => {
    const onError = mock.fn();
    const tsInput = `1+1 as const / 2`;
    let jsOutput = tsBlankSpace(tsInput, onError);
    assert.equal(onError.mock.callCount(), 1);
    // TypeScript would emit `(1+1) / 2`, but ts-blank-space can't insert
    // the leading `(` without shifting offsets, so it must error.
    assert.equal(jsOutput, `1+1 as const / 2`);
});

it("errors on nested `as` expressions that would change operator precedence if erased", () => {
    const onError = mock.fn();
    const tsInput = `1 + 1 as unknown as number / 2`;
    const jsOutput = tsBlankSpace(tsInput, onError);
    assert.equal(onError.mock.callCount(), 1);
    assert.equal(jsOutput, `1 + 1 as unknown as number / 2`);
});

it("errors on (invalid) ambiguous `??` precedence that would error if erased", () => {
    logicalOr: {
        const onError = mock.fn();
        // TypeScript produces an error for this input:
        const tsInput = `a ?? b as any || 2`; // "ts(5076): '??' and '||' operations cannot be mixed without parentheses"
        // If that TS error was ignored the TS emitted code would actually be valid
        // because TS adds parenthesis: `(a ?? b) || 2`.
        // `ts-blank-space` would only erase, meaning there would be a runtime syntax error.
        // To catch this early we should emit an error.
        const jsOutput = tsBlankSpace(tsInput, onError);
        assert.equal(onError.mock.callCount(), 1);
        assert.equal(jsOutput, `a ?? b as any || 2`);
    }

    logicalAnd: {
        const onError = mock.fn();
        const tsInput = `a ?? b as any && 2`; // "ts(5076): '??' and '||' operations cannot be mixed without parentheses"
        const jsOutput = tsBlankSpace(tsInput, onError);
        assert.equal(onError.mock.callCount(), 1);
        assert.equal(jsOutput, `a ?? b as any && 2`);
    }

    logicalOrReversed: {
        const onError = mock.fn();
        const tsInput = `a || b as any ?? 2`;
        const jsOutput = tsBlankSpace(tsInput, onError);
        assert.equal(onError.mock.callCount(), 1);
        assert.equal(jsOutput, `a || b as any ?? 2`);
    }

    logicalAndReversed: {
        const onError = mock.fn();
        const tsInput = `a && b as any ?? 2`;
        const jsOutput = tsBlankSpace(tsInput, onError);
        assert.equal(onError.mock.callCount(), 1);
        assert.equal(jsOutput, `a && b as any ?? 2`);
    }

    satisfies: {
        const onError = mock.fn();
        const tsInput = `a ?? b satisfies any || 2`;
        const jsOutput = tsBlankSpace(tsInput, onError);
        assert.equal(onError.mock.callCount(), 1);
        assert.equal(jsOutput, `a ?? b satisfies any || 2`);
    }

    assertionChain: {
        const onError = mock.fn();
        const tsInput = `a ?? b as any as unknown && 2`;
        const jsOutput = tsBlankSpace(tsInput, onError);
        assert.equal(onError.mock.callCount(), 1);
        assert.equal(jsOutput, `a ?? b as any as unknown && 2`);
    }
});

it("errors on `??` mix nested inside a larger expression", () => {
    threeOperatorChain: {
        // `a ?? b as T && c || d` parses as `||[??[a, &&[as[b, T], c]], d]`
        // The ?? mix error is caught at the inner `??` node
        const onError = mock.fn();
        const tsInput = `a ?? b as T && c || d`;
        const jsOutput = tsBlankSpace(tsInput, onError);
        assert.equal(onError.mock.callCount(), 1);
        assert.equal(jsOutput, `a ?? b as T && c || d`);
    }

    precedenceErrorDeeperInTree: {
        // `1 + 2 as T * 3 + 4` parses as `+[*[as[+[1, 2], T], 3], 4]`
        // The precedence error (+ vs *) is caught on the nested `as` node
        const onError = mock.fn();
        const tsInput = `1 + 2 as T * 3 + 4`;
        const jsOutput = tsBlankSpace(tsInput, onError);
        assert.equal(onError.mock.callCount(), 1);
        assert.equal(jsOutput, `1 + 2 as T * 3 + 4`);
    }
});

it("errors even with comments between assertion chain and next operator", () => {
    const onError = mock.fn();
    const tsInput = `1 + 1 as unknown /* comment */ / 2`;
    const jsOutput = tsBlankSpace(tsInput, onError);
    assert.equal(onError.mock.callCount(), 1);
    assert.equal(jsOutput, `1 + 1 as unknown /* comment */ / 2`);
});

it("covers assertion-chain binary precedence error cases across operators", () => {
    const runErrorCase = (input: string, context: string) => {
        const onError = mock.fn();
        const jsOutput = tsBlankSpace(input, onError);
        assert.equal(onError.mock.callCount(), 1, `unexpected onError count: ${context}`);
        assert.equal(jsOutput, input, `should preserve source when it errors: ${context}`);
    };

    runErrorCase(`1 ** 1 as unknown ** 2`, "same operator **");

    const higherPrecedenceCases = [
        { base: "<", next: "<<" },
        { base: "<=", next: "<<" },
        { base: ">", next: "<<" },
        { base: ">=", next: "<<" },
        { base: "instanceof", next: "<<" },
        { base: "in", next: "<<" },
        { base: "<<", next: "+" },
        { base: ">>", next: "+" },
        { base: ">>>", next: "+" },
        { base: "+", next: "*" },
        { base: "-", next: "*" },
        { base: "*", next: "**" },
        { base: "/", next: "**" },
        { base: "%", next: "**" },
    ];

    for (const { base, next } of higherPrecedenceCases) {
        runErrorCase(`a ${base} a as unknown ${next} a`, `${next} should outrank ${base}`);
    }

    runErrorCase(`1 + 1 as unknown * 2`, "targeted higher-precedence operator");
});

it("errors on `satisfies` expression that would change operator precedence", () => {
    const onError = mock.fn();
    const tsInput = `1+1 satisfies T / 2`;
    let jsOutput = tsBlankSpace(tsInput, onError);
    assert.equal(onError.mock.callCount(), 1);
    assert.equal(jsOutput, `1+1 satisfies T / 2`);
});

it("errors on prefix type assertion", () => {
    const onError = mock.fn();
    const tsInput = `let x = <string>"test";`;
    let jsOutput = tsBlankSpace(tsInput, onError);
    assert.equal(onError.mock.callCount(), 1);
    assert.equal(jsOutput, `let x = <string>"test";`);
});

it("errors on prefix type assertion as arrow body within binary expressions", () => {
    const onError = mock.fn();
    const tsInput = `(()=><any>{p:null}.p ?? 1);`;
    let jsOutput = tsBlankSpace(tsInput, onError);
    assert.equal(onError.mock.callCount(), 1);
    assert.equal(jsOutput, `(()=><any>{p:null}.p ?? 1);`);
});
