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
