const foo = "";

foo
;          
(1);

foo
;          
``;

foo
;          
`${123}`;

function bar   () {
    bar//
       ;
    (1);
}

foo
;             
(1);

foo
;                
(1);

foo
;                     
(1);

foo
;                 
(1);

foo
;                     
(1);

foo
;                   
(1);

function f3()       {
    if (true)
        ;             
        console.log('f3'); // <- not part of the if
}

// https://github.com/nodejs/amaro/issues/24#issuecomment-2260548354
foo;         /*trailing*/
(1);
foo;                /*trailing*/
(1);
foo;                /*trailing*/
[0];

// No ASI:
foo                 /*trailing*/
+ "";

// More statement types and positions:
let car = 1;         /*trailing*/
(1);

class ASI {
    f = 1;         /*trailing*/
    ["method"]() {
        let v = 1;         /*trailing*/
        (1);

        if (true) (() => { 1 })
        else 1;         /*trailing*/
        (1);

        // Also missing `;` on LHS before visiting RHS
        ((() => { 1/*trailing*/})(), 1) + 1;         /*trailing*/
        (1);
    }
}
