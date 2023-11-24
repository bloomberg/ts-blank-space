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
    declare f3: any;
//  ^^^^^^^^^^^^^^^^ declared property

    public method/**/<T>/*︎*/(/*︎*/this: T,/**/ a? /*︎*/: string/**/)/*︎*/: void/*︎*/ {
//  ^^^^^^           ^^^         ^^^^^^^^      ^     ^^^^^^^^         ^^^^^^
    }

    get g(): any { return 1 };
//         ^^^^^
    set g(v: any) { };
//         ^^^^^
}

class D extends C<any> {
//               ^^^^^
    override method(...args): any {}
//  ^^^^^^^^                ^^^^^
}

{
    let m = new (Map!)<string, number>([]!);
    //              ^ ^^^^^^^^^^^^^^^^   ^
}

{
    let a = (foo!)<any>;
    //          ^ ^^^^^
}

{
    let a = (foo!)<any>([]!);
    //          ^ ^^^^^   ^
}

{
    let f = function(p: any) {}
    //                ^^^^^
}

/** @doc */
interface I {}
// ^^^^^^^^^^^ interface

void 0;

/** @doc */
type J = I;
// ^^^^^^^^ type alias

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

/**/declare enum E1 {}
//  ^^^^^^^^^^^^^^^^^^ `declare enum`

void 0;

/**/declare namespace N {}
//  ^^^^^^^^^^^^^^^^^^^^^^ `declare namespace`

void 0;

/**/declare module M {}
//  ^^^^^^^^^^^^^^^^^^^ `declare module`

void 0;

/**/declare let a;
//  ^^^^^^^^^^^^^^ `declare let`

void 0;

/**/declare class DeclaredClass {}
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ `declare class`

void 0;

/**/declare function DeclaredFunction(): void;
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ `declare function`

void 0;
