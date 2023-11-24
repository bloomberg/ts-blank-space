let x /*▶︎*/: number/*◀︎*/ = 1!;
//                          ^

class C /*▶︎*/< T >/*◀︎*/ extends Array/**/<T> /*▶︎*/implements I,I/*◀︎*/ {
    /*▶︎*/readonly/*◀︎*/ field /*▶︎*/: string/*◀︎*/ = "";
    static accessor f1;
    /*▶︎*/private/*◀︎*/ f2! /*▶︎*/: string/*◀︎*/;
//                      ^

    method/*▶︎*/<T>/*◀︎*/(/*▶︎*/this: T,/*◀︎*/ a? /*▶︎*/: string/*◀︎*/)/*▶︎*/: void/*◀︎*/ {
//                                          ^
    }
}

/** @doc */
interface I {}

/** @doc */
type T = I;

export {}
