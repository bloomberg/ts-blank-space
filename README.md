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

### Bring your own AST

```typescript
export function blankSourceFile(
    ts: TS.SourceFile,
    onError?: (node) => void
): string
```

```javascript
import ts from "typescript";
import { blankSourceFile } from "ts-blank-space";

const sf = ts.createSourceFile(...);
console.log(blankSourceFile(sf));
```

## Where are my SourceMaps?

Because all the JavaScript in the output is located at the same line and column as the original
there is no mapping information that is lost during the transform.

## Why?

The benefits of this library are:

- It is fast (for a pure JavaScript transform). See the `./perf` folder
  - No new JavaScript needs to be emitted from an AST, it re-uses slices of the existing source string
  - This is particularly true if other parts of your program are already generating the TypeScript SourceFile object for other reasons because it can [be reused](#bring-your-own-ast), and producing the AST is the most time consuming part.
- It is small (~750 LOC), by doing so little the code should be easy to understand and maintain
- No need for additional SourceMap processing. See ["where are my SourceMaps?"](#where-are-my-sourcemaps)

## Does it really just blank out all the type annotations?

There is one case where it does more than replace the TypeScript syntax with blank space.

If the annotation marking the return type of an arrow function introduces a new line before the `=>`
then only replacing it with blank space would be incorrect. So in addition to removing the type annotation, the `=>` is moved up.

Example input:

```typescript
let f = (): Array<
   string
> => [""];
```

becomes:

```javascript
let f = () =>

     [""];
```

## Unsupported

Some parts of TypeScript are not supported because they can't be erased in place due to having
runtime semantics.

- `enum` (unless `declare enum`)
- `namespace` (unless `declare namespace`)
- parameter properties in class constructors: `constructor(public x) {}`
- `return <Type>value`
  - Type assertions are not allowed as a return statement incase they introduce a new line.
  - use `return value as Type` instead.
- `useDefineAsClassFields: false`
- `verbatimModuleSyntax: false`

## TSX/JSX

JSX is not transformed, it will be preserved in the output.
