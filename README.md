# ts-blank-space

TypeScript goes in:

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

JavaScript + space comes out:

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

### String to String

```typescript
export default function tsBlankSpace(
    ts: string,
    onError?: (node) => void
): string;
```

```javascript
import tsBlankSpace from "ts-blank-space";

console.log(tsBlankSpace(`let x: string;`));
// "let x        ;"
```

## Where are my SourceMaps?

Because all the JavaScript in the output is located at the same line and column as the original
there is no mapping information that is lost during the transform.
