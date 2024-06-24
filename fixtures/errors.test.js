// @ts-check
import {it, mock} from 'node:test';
import assert from 'node:assert';
import tsBlankSpace from '../index.js';

it("errors on enums", () => {
    const onError = mock.fn();
    const out = tsBlankSpace(`
       enum E1 {}
       export enum E2 {}
    `, onError);
    assert.equal(onError.mock.callCount(), 2);
    assert.equal(out, `
       enum E1 {}
       export enum E2 {}
    `);
});

it("allows ambient enum", () => {
    const onError = mock.fn();
    tsBlankSpace(`
       declare enum E1 {}
    `, onError);
    assert.equal(onError.mock.callCount(), 0);
});

it("errors on parameter properties", () => {
    const onError = mock.fn();
    const out = tsBlankSpace(`
        class C {
            constructor(public a, private b, protected c, readonly d) {}
        }
    `, onError);
    assert.equal(onError.mock.callCount(), 4);
    assert.equal(out, `
        class C {
            constructor(public a, private b, protected c, readonly d) {}
        }
    `);
});

it("errors on namespace value", () => {
    const onError = mock.fn();
    const out = tsBlankSpace(`
        namespace N {}
        module M {}
    `, onError);
    assert.equal(onError.mock.callCount(), 2);
    assert.equal(out, `
        namespace N {}
        module M {}
    `);
});

it("allows declared namespace value", () => {
    const onError = mock.fn();
    tsBlankSpace(`
        declare namespace N {}
        declare module M {}
    `, onError);
    assert.equal(onError.mock.callCount(), 0);
});

it("errors on legacy type assertions for function returns", () => {
    // This is not supported because blanking out the type can result in
    // semantically different JS.
    // If `return` is followed by a newline then that means: `return;`
    const onError = mock.fn();
    const out = tsBlankSpace(`
        function foo() {
            return <string>
                "string on separate line";
        }
    `, onError);
    assert.equal(onError.mock.callCount(), 1);
    assert.equal(out, `
        function foo() {
            return <string>
                "string on separate line";
        }
    `);
});

it("errors on export assignment", () => {
    const onError = mock.fn();
    const out = tsBlankSpace(`
        export = 1;
    `, onError);
    assert.equal(onError.mock.callCount(), 1);
    assert.equal(out, `
        export = 1;
    `);
});
