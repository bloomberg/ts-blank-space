;            
;                 
//^^^^^^^^^^^^^^^^
;                                                              
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

const {
    [(FOO            ).a]: a,
//       ^^^^^^^^^^^^
    [(FOO            ).b]: b,
//       ^^^^^^^^^^^^
    [(FOO            ).c]: c,
//       ^^^^^^^^^^^^
} = {}       ;
//    ^^^^^^^

const {
    data: {
        d,
        e,
        f,
    } = {}            ,
//        ^^^^^^^^^^^^
}           = FOO || {};
//^^^^^^^^^

(function({
    name,
    regex,
    uuidType = String            ,
//                    ^^^^^^^^^^^
}          ) {
//^^^^^^^^^
});

let g          ,
    h           ,
//   ^
    i          ;

(class {
    optionalMethod (v     ) {}
//                ^
});

(function f0(
              
    //       ^- trailing comma
) {});

(function f1(
              
    //       ^- trailing comma
    arg1     
) {});

({
    method() {
        return [FOO.cell/**/                   ()]
//                          ^^^^^^^^^^^^^^^^^^^
            .map/**/               (() => {})
//                  ^^^^^^^^^^^^^^^
    }
});
