                                     
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ `import type`

import { "🙂" as C2 } from "./modules";

;            
 lass C {}
C === C2;

;                     
 ;                                  

                                     
 /  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ `export type *`

import {ty                    */, deepEqual} from "node:assert";
//      ^^^^^^^^^^^^^^^^^^^^^^^^^

export {
    C,
           
//  ^^^^^^
    C as "🙂"
}

/*;                    
    ^^^^^^^^^^^^^^^^^^^

export default {
    v: true as      
           ^^^^^^^^^
};
