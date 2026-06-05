let a    , b    , c    ;
             

// Operator is a TypeScript type operator
a & b           ;
//    ^^^^^^^^^^
a | b               ;
//    ^^^^^^^^^^^^^^

// Same-operator cases that should erase without error:
1 * 1           * 2;
1 / 1           / 2;
1 % 1           % 2;
1 + 1           + 2;
1 - 1           - 2;
1 << 1           << 2;
1 >> 1           >> 2;
1 >>> 1           >>> 2;
1 < 1        < 2;
1 <= 1        <= 2;
1 > 1        > 2;
1 >= 1        >= 2;
a instanceof b            instanceof c;
a in b        in c;
a == b           == c;
a != b            != c;
a === b            === c;
a !== b            !== c;
a ^ b        ^ c;
a && 1            && c;
a && b            || c;
a || b            || c;
a || b            && c;
a ?? b            ?? c;

// Lower-precedence next operator should stay safe:
a << a        < a;
a + a        << a;
a * a        + a;
a ** a        * a;
a <= a        == a;

// Equal-tier cross-operator cases should stay safe:
(a * b)        / c;
(a % b)        * c;
(a + b)        - c;
(a << b)        >> c;
(a >>> b)        << c;
(a < b)        >= c;
(a <= b)            instanceof c;
(a in b)        > c;
(a == b)            != c;
(a === b)            !== c;

// Comments do not interfere with safe erasure detection:
1 * 1        /* comment */ + 2;

// (Positive) Test cases from https://github.com/microsoft/TypeScript/issues/63527

export const x01 = 1           * 2;
export const x02 = 1                  * 2;

export const x05 = 1           + 1 * 2;
export const x06 = 1                  + 1 * 2;

export const x07 = 1 * 1           + 2;
export const x08 = 1 * 1                  + 2;
export const x09 = 1           * 1 + 2;
export const x10 = 1                  * 1 + 2;

export const x11 = (1 + 1          ) * 2;
export const x12 = (1 + 1                 ) * 2;
export const x13 = (1           + 1) * 2;
export const x14 = (1                  + 1) * 2;

export const x15 = 1 + 1           === 2;
export const x16 = 1 + 1                  === 2;
export const x17 = 1 + 1           > 2;
export const x18 = 1 + 1                  > 2;
export const x19 = 1 + 1           >= 2;
export const x20 = 1 + 1                  >= 2;

export const x21 = 1 + 1           >> 2;
export const x22 = 1 + 1                  >> 2;

export const y01 = 1                  * 2;
export const y02 = 1                                * 2;

export const y05 = 1                  + 1 * 2;
export const y06 = 1                                + 1 * 2;

export const y07 = 1 * 1                  + 2;
export const y08 = 1 * 1                                + 2;
export const y09 = 1                  * 1 + 2;
export const y10 = 1                                * 1 + 2;

export const y11 = (1 + 1                 ) * 2;
export const y12 = (1 + 1                               ) * 2;
export const y13 = (1                  + 1) * 2;
export const y14 = (1                                + 1) * 2;

export const y15 = 1 + 1                  === 2;
export const y16 = 1 + 1                                === 2;
export const y17 = 1 + 1                  > 2;
export const y18 = 1 + 1                                > 2;
export const y19 = 1 + 1                  >= 2;
export const y20 = 1 + 1                                >= 2;

export const y21 = 1 + 1                  >> 2;
export const y22 = 1 + 1                                >> 2;
