type A = any;
type Box<T> = any;
//^^^^^^^^^^^^^^^^
declare const FOO: { [x: string]: <T>(...args: any[]) => any };
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

const {
    [(FOO as Box<any>).a]: a,
//       ^^^^^^^^^^^^
    [(FOO as Box<any>).b]: b,
//       ^^^^^^^^^^^^
    [(FOO as Box<any>).c]: c,
//       ^^^^^^^^^^^^
} = {} as any;
//    ^^^^^^^

const {
    data: {
        d,
        e,
        f,
    } = {} as Box<any>,
//        ^^^^^^^^^^^^
}: Box<any> = FOO || {};
//^^^^^^^^^

(function({
    name,
    regex,
    uuidType = String as Box<any>,
//                    ^^^^^^^^^^^
}: Box<any>) {
//^^^^^^^^^
});

let g: Box<any>,
    h!: Box<any>,
//   ^
    i: Box<any>;

(class {
    optionalMethod?(v: any) {}
//                ^
});

((value: boolean) => <const>{ value });
//                   <const>{ value })

((value: boolean) => <A>{ value }.value);
//                   <A>{ value }.value);

(function f0(
    this: any,
    //       ^- trailing comma
) {});

(function f1(
    this: any,
    //       ^- trailing comma
    arg1: any
) {});

({
    method() {
        return [FOO.cell/**/</*<*/boolean/*>*/>()]
//                          ^^^^^^^^^^^^^^^^^^^
            .map/**/</*<*/any/*>*/>(() => {})
//                  ^^^^^^^^^^^^^^^
    }
});
