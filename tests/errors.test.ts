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
