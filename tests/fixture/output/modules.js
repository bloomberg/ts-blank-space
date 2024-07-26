/**/;                                
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ `import type`

;            
class C {}

/**/;                 
//  ^^^^^^^^^^^^^^^^^^ `export type`

/**/;                                
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ `export type *`

import {                          deepEqual} from "node:assert";
//      ^^^^^^^^^^^^^^^^^^^^^^^^^

export {
    C,
           
//  ^^^^^^
}

/**/;                  
//  ^^^^^^^^^^^^^^^^^^^

export default {
    v: true         
//         ^^^^^^^^^
};
