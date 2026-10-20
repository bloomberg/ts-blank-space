const foo = "";

foo
type x = 1;
(1);

foo
type y = 1;
``;

foo
type z = 1;
`${123}`;

function bar<T>() {
    bar//
    <T>;
    (1);
}

foo
interface I {}
(1);

foo
declare enum E {}
(1);

foo
declare namespace N {}
(1);

foo
declare class C {}
(1);

foo
declare let x: number;
(1);

foo
declare function f()
(1);

function f3(): void {
    if (true)
        type foo = [];
        console.log('f3'); // <- not part of the if
}

// https://github.com/nodejs/amaro/issues/24#issuecomment-2260548354
foo as string/*trailing*/
(1);
foo satisfies string/*trailing*/
(1);
foo satisfies string/*trailing*/
[0];

// No ASI:
foo satisfies string/*trailing*/
+ "";

// More statement types and positions:
let car = 1 as number/*trailing*/
(1);

class ASI {
    f = 1 as number/*trailing*/
    ["method"]() {
        let v = 1 as number/*trailing*/
        (1);

        if (true) (() => { 1 })
        else 1 as number/*trailing*/
        (1);

        // Also missing `;` on LHS before visiting RHS
        ((() => { 1/*trailing*/})(), 1) + 1 as number/*trailing*/
        (1);
    }
    g = 2/*missing ; */
    public ["computed-field"] = 1
//  ;^^^^^
    h = 3/*missing ; */
    public ["computed-method"]() {}
//  ;^^^^^
    i = 4/*missing ; */
    private *generator() {}
//  ;^^^^^^
    j = 5/*missing ; */
    method(): void
//  ;^^^^^^^^^^^^^
    *[Symbol.iterator]() {}
}

abstract class AbstractASI {
    f = 1/*missing ; */
    abstract method(): void
//  ;^^^^^^^^^^^^^^^^^^^^^^
    ["computed-method"]() {}
}

class NoASI {
    f = 1/*missing ; */
    static readonly ["computed-field"] = 1
//         ^^^^^^^^
    g = 2;
    private *generator() {}
//  ^^^^^^^
    h = 3;
    public ["computed-method"]() {}
//  ^^^^^^
}

// Fields named like a modifier must not become a modifier of the next member
class ContextualModifierNames {
    get?
//     ;
    a() {}
    set!: number
//     ;^^^^^^^^
    b(v) {}
    static: number
//        ;^^^^^^^
    c() {}
    static get?: number
//            ;^^^^^^^^
    d() {}
}

class ContextualModifierNamesNoASI {
    get = 1 as number
//          ^^^^^^^^^
    a() {}
    async?: number
//       ^^^^^^^^^
    b() {}
    "set"?: number
//       ^^^^^^^^^
    c() {}
}

// Semi-colon preservation rules
let x;
interface I {}
let y;

let a
interface J {}
let b

function foo() {}
interface K {}
