// @ts-check
import {it, mock} from 'node:test';
import assert from 'node:assert';
import tsBlankSpace from '../index.js';

it("errors on enums", () => {
    const onError = mock.fn();
    tsBlankSpace(`
       enum E1 {}
       export enum E2 {}
    `, onError);
    assert.equal(onError.mock.callCount(), 2);
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
    tsBlankSpace(`
        class C {
            constructor(public a, private b, protected c, readonly d) {}
        }
    `, onError);
    assert.equal(onError.mock.callCount(), 4);
});

it("errors on namespace value", () => {
    const onError = mock.fn();
    tsBlankSpace(`
        namespace N {}
        module M {}
    `, onError);
    assert.equal(onError.mock.callCount(), 2);
});

it("allows declared namespace value", () => {
    const onError = mock.fn();
    tsBlankSpace(`
        declare namespace N {}
        declare module M {}
    `, onError);
    assert.equal(onError.mock.callCount(), 0);
});
