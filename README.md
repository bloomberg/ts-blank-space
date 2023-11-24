# ts-blank-space

TS goes in:

```typescript
class C /**/< T >/*︎*/ extends Array/**/<T> /*︎*/implements I,J/*︎*/ {
//          ^^^^^                      ^^^     ^^^^^^^^^^^^^^
    readonly field/**/: string/**/ = "";
//  ^^^^^^^^          ^^^^^^^^
    static accessor f1;
    private f2/**/!/**/: string/*︎*/;
//  ^^^^^^^       ^    ^^^^^^^^

    method/**/<T>/*︎*/(/*︎*/this: T,/**/ a? /*︎*/: string/**/)/*︎*/: void/*︎*/ {
//            ^^^         ^^^^^^^^      ^     ^^^^^^^^         ^^^^^^
    }
}
```

Blank Space comes out:

```javascript
class C /**/     /*︎*/ extends Array/**/    /*︎*/              /*︎*/ {
//          ^^^^^                      ^^^     ^^^^^^^^^^^^^^
             field/**/        /**/ = "";
//  ^^^^^^^^          ^^^^^^^^
    static accessor f1;
            f2/**/ /**/        /*︎*/;
//  ^^^^^^^       ^    ^^^^^^^^

    method/**/   /*︎*/(/*︎*/        /**/ a  /*︎*/        /**/)/*︎*/      /*︎*/ {
//            ^^^         ^^^^^^^^      ^     ^^^^^^^^         ^^^^^^
    }
}
```

## API

```javascript
import tsBlankSpace from "ts-blank-space";

console.log(tsBlankSpace(`let x: string;`));
```