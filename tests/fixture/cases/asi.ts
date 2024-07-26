function foo() {}

foo
type x = 1;
(1);

foo
type y = 1;
``;

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
