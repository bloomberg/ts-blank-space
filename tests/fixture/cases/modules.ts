/**/import type T from "node:assert";
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ `import type`

type I = any;
class C {}

/**/export type { I };
//  ^^^^^^^^^^^^^^^^^^ `export type`

/**/export type * from "node:buffer";
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ `export type *`

import {type AssertPredicate/**/, deepEqual} from "node:assert";
//      ^^^^^^^^^^^^^^^^^^^^^^^^^

export {
    C,
    type T,
//  ^^^^^^
}

/**/export type T2 = 1;
//  ^^^^^^^^^^^^^^^^^^^

export default {
    v: true as false
//         ^^^^^^^^^
};
