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
