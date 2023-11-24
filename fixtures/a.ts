let x /**/: number/**/ = 1!;
//        ^^^^^^^^        ^

[] as [] satisfies [];
// ^^^^^^^^^^^^^^^^^^

class C /**/< T >/*︎*/ extends Array/**/<T> /*︎*/implements I,I/*︎*/ {
//          ^^^^^                      ^^^     ^^^^^^^^^^^^^^
    readonly field/**/: string/**/ = "";
//  ^^^^^^^^          ^^^^^^^^
    static accessor f1;
    private f2/**/!/**/: string/*︎*/;
//  ^^^^^^^       ^    ^^^^^^^^

    method/**/<T>/*︎*/(/*︎*/this: T,/**/ a? /*︎*/: string/**/)/*︎*/: void/*︎*/ {
//            ^^^         ^^^^^^^^      ^     ^^^^^^^^         ^^^^^^
    }
}

/** @doc */
interface I {}

/** @doc */
type T = I;

/**/import type T from "node:assert";
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

import {type AssertPredicate} from "node:assert";
//      ^^^^^^^^^^^^^^^^^^^^

export {
    type T
//  ^^^^^^
}

/**/export type T2 = 1;
//  ^^^^^^^^^^^^^^^^^^^
