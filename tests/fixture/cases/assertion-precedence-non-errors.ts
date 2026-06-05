let a:any, b:any, c:any;
type T = any;

// Operator is a TypeScript type operator
a & b as any & T;
//    ^^^^^^^^^^
a | b as unknown | T;
//    ^^^^^^^^^^^^^^

// Same-operator cases that should erase without error:
1 * 1 as number * 2;
1 / 1 as number / 2;
1 % 1 as number % 2;
1 + 1 as number + 2;
1 - 1 as number - 2;
1 << 1 as number << 2;
1 >> 1 as number >> 2;
1 >>> 1 as number >>> 2;
1 < 1 as any < 2;
1 <= 1 as any <= 2;
1 > 1 as any > 2;
1 >= 1 as any >= 2;
a instanceof b as unknown instanceof c;
a in b as any in c;
a == b as number == c;
a != b as unknown != c;
a === b as unknown === c;
a !== b as unknown !== c;
a ^ b as any ^ c;
a && 1 as unknown && c;
a && b as unknown || c;
a || b as unknown || c;
a || b as unknown && c;
a ?? b as unknown ?? c;

// Lower-precedence next operator should stay safe:
a << a as any < a;
a + a as any << a;
a * a as any + a;
a ** a as any * a;
a <= a as any == a;

// Equal-tier cross-operator cases should stay safe:
(a * b) as any / c;
(a % b) as any * c;
(a + b) as any - c;
(a << b) as any >> c;
(a >>> b) as any << c;
(a < b) as any >= c;
(a <= b) as unknown instanceof c;
(a in b) as any > c;
(a == b) as unknown != c;
(a === b) as unknown !== c;

// Comments do not interfere with safe erasure detection:
1 * 1 as any /* comment */ + 2;

// (Positive) Test cases from https://github.com/microsoft/TypeScript/issues/63527

export const x01 = 1 as number * 2;
export const x02 = 1 as any as number * 2;

export const x05 = 1 as number + 1 * 2;
export const x06 = 1 as any as number + 1 * 2;

export const x07 = 1 * 1 as number + 2;
export const x08 = 1 * 1 as any as number + 2;
export const x09 = 1 as number * 1 + 2;
export const x10 = 1 as any as number * 1 + 2;

export const x11 = (1 + 1 as number) * 2;
export const x12 = (1 + 1 as any as number) * 2;
export const x13 = (1 as number + 1) * 2;
export const x14 = (1 as any as number + 1) * 2;

export const x15 = 1 + 1 as number === 2;
export const x16 = 1 + 1 as any as number === 2;
export const x17 = 1 + 1 as number > 2;
export const x18 = 1 + 1 as any as number > 2;
export const x19 = 1 + 1 as number >= 2;
export const x20 = 1 + 1 as any as number >= 2;

export const x21 = 1 + 1 as number >> 2;
export const x22 = 1 + 1 as any as number >> 2;

export const y01 = 1 satisfies number * 2;
export const y02 = 1 satisfies any satisfies number * 2;

export const y05 = 1 satisfies number + 1 * 2;
export const y06 = 1 satisfies any satisfies number + 1 * 2;

export const y07 = 1 * 1 satisfies number + 2;
export const y08 = 1 * 1 satisfies any satisfies number + 2;
export const y09 = 1 satisfies number * 1 + 2;
export const y10 = 1 satisfies any satisfies number * 1 + 2;

export const y11 = (1 + 1 satisfies number) * 2;
export const y12 = (1 + 1 satisfies any satisfies number) * 2;
export const y13 = (1 satisfies number + 1) * 2;
export const y14 = (1 satisfies any satisfies number + 1) * 2;

export const y15 = 1 + 1 satisfies number === 2;
export const y16 = 1 + 1 satisfies any satisfies number === 2;
export const y17 = 1 + 1 satisfies number > 2;
export const y18 = 1 + 1 satisfies any satisfies number > 2;
export const y19 = 1 + 1 satisfies number >= 2;
export const y20 = 1 + 1 satisfies any satisfies number >= 2;

export const y21 = 1 + 1 satisfies number >> 2;
export const y22 = 1 + 1 satisfies any satisfies number >> 2;
