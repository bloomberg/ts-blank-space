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
