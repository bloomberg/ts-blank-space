
namespace Empty {}
// ^^^^^^^^^^^^^^^ empty namespace

namespace TypeOnly {
    type A = string;

    export type B = A | number;

    export interface I {}

    export namespace Inner {
        export type C = B;
    }
}
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ type-only namespace

namespace My.Internal.Types {
    export type Foo = number;
}

namespace With.Imports {
    import Types = My.Internal.Types;
    export type Foo = Types.Foo;
}
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ nested namespaces

export const x: With.Imports.Foo = 1;
//            ^^^^^^^^^^^^^^^^^^
