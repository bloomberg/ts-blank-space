             
                  
//^^^^^^^^^^^^^^^^
                                                               
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

{
    function foo   (a   )     {
//              <T>  : T  : T
        return a;
    }

    class A {
        [foo        ("")]   (a   ) {
//          <string>     <T>  : T
        }

        // @ts-expect-error: computed property names must have simple type
        [("A" + "B")        ] =  1;
//                   as "AB"

        // type syntax in the key and after it
        [("C" + "D")        ]         = 1;
//                   as "CD" : number
        static [("E" + "F")        ]         ;
//                          as "EF" ?: number
        [foo      ("GH")]         ;
//          <"GH">       !: string
    }
};

{
    (   (...args       ) => {})     `tagged ${"template"       }`;
//   <T>        : any[]        <any>                     as any
};

{
    const obj = {
        [("A" + "B")        ]: null
//                   as "AB"
    };
};
