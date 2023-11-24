let x /**/        /**/ = 1 ;
//        ^^^^^^^^        ^

[]                   ;
// ^^^^^^^^^^^^^^^^^^

class C /**/     /*︎*/ extends Array/**/    /*︎*/              /*︎*/ {
//          ^^^^^                      ^^^     ^^^^^^^^^^^^^^
             field/**/        /**/ = "";
//  ^^^^^^^^          ^^^^^^^^
    static accessor f1;
            f2/**/ /**/        /*︎*/;
//  ^^^^^^^       ^    ^^^^^^^^
                    
//  ^^^^^^^^^^^^^^^^ declared property

           method/**/   /*︎*/(/*︎*/        /**/ a  /*︎*/        /**/)/*︎*/      /*︎*/ {
//  ^^^^^^           ^^^         ^^^^^^^^      ^     ^^^^^^^^         ^^^^^^
    }

    get g()      { return 1 };
//         ^^^^^
    set g(v     ) { };
//         ^^^^^
}

class D extends C      {
//               ^^^^^
             method(...args)      {}
//  ^^^^^^^^                ^^^^^
}

{
    let m = new (Map )                ([] );
    //              ^ ^^^^^^^^^^^^^^^^   ^
}

{
    let a = (foo )     ;
    //          ^ ^^^^^
}

{
    let a = (foo )     ([] );
    //          ^ ^^^^^   ^
}

{
    let f = function(p     ) {}
    //                ^^^^^
}

{
                                
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ overload
    function overload()      {}
//                     ^^^^^
}

           
              
// ^^^^^^^^^^^ interface

void 0;

           
           
// ^^^^^^^^ type alias

/**/                                 
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ `import type`

/**/                  
//  ^^^^^^^^^^^^^^^^^^ `export type`

/**/                                 
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ `export type *`

import {                          deepEqual} from "node:assert";
//      ^^^^^^^^^^^^^^^^^^^^^^^^^

export {
    C,
           
//  ^^^^^^
}

                       
//  ^^^^^^^^^^^^^^^^^^^

function foo   (p      = ()      => 1)      {
//          ^^^  ^^^^^     ^^^^^      ^^^^^
    return p       ;
//           ^^^^^^
}

                      
//  ^^^^^^^^^^^^^^^^^^ `declare enum`

void 0;

                          
//  ^^^^^^^^^^^^^^^^^^^^^^ `declare namespace`

void 0;

                       
//  ^^^^^^^^^^^^^^^^^^^ `declare module`

void 0;

/**/              
//  ^^^^^^^^^^^^^^ `declare let`

void 0;

/**/                              
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ `declare class`

void 0;

/**/                                          
//  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ `declare function`

void 0;
