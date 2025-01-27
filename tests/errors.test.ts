import { it, mock } from "node:test";
import assert from "node:assert";
import tsBlankSpace from "../src/index.ts";

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

it("errors on deprecated 'module' value", () => {
    const onError = mock.fn();
    const out = tsBlankSpace(
        `
        module M {}
    `,
        onError,
    );
    assert.equal(onError.mock.callCount(), 1);
    assert.equal(
        out,
        `
        module M {}
    `,
    );
});

it("errors on value namespaces", () => {
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
