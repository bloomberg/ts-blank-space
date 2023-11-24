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
