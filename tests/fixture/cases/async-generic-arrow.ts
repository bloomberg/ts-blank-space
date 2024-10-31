
// Simple case
const a = async<T>(v: T) => {};
//             ^^^  ^^^

// Hard case - generic spans multiple lines
const b = async <
    T
>/**/(/**/v: T) => {};
//   ^     ^^^

// Harder case - generic and return type spans multiple lines
const c = async <
    T
>(v: T): Promise<
// ^^^ ^^^^^^^^^^
    T
> => v;
