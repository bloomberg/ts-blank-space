/**/                                 
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ `import type`

import { "🙂" as C2 } from "./modules";

;            
class C {}
C === C2;

/**/;                 
//  ^^^^^^^^^^^^^^^^^^ `export type`

/**/;                                
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ `export type *`

import {                          deepEqual} from "node:assert";
//      ^^^^^^^^^^^^^^^^^^^^^^^^^

export {
    C,
           
//  ^^^^^^
    C as "🙂"
}

/**/;                  
//  ^^^^^^^^^^^^^^^^^^^

export default {
    v: true         
//         ^^^^^^^^^
};
