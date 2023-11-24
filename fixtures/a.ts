let x /**/: number/**/ = 1!;
//        ^^^^^^^^        ^

[] as [] satisfies [];
// ^^^^^^^^^^^^^^^^^^

class C /**/< T >/*︎*/ extends Array/**/<T> /*︎*/implements I,J/*︎*/ {
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
// ^^^^^^^^^^^

/** @doc */
type J = I;
// ^^^^^^^^

/**/import type T from "node:assert";
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

/**/export type { I };
//  ^^^^^^^^^^^^^^^^^^

/**/export type * from "node:buffer";
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

import {type AssertPredicate/**/, deepEqual} from "node:assert";
//      ^^^^^^^^^^^^^^^^^^^^^^^^^

export {
    C,
    type T,
//  ^^^^^^
}

/**/export type T2 = 1;
//  ^^^^^^^^^^^^^^^^^^^

function foo<T>(p: any = (): any => 1): any {
//          ^^^  ^^^^^     ^^^^^      ^^^^^
    return p as any;
//           ^^^^^^
}
