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

const ast = ts.createSourceFile(...);
console.log(blankSourceFile(ast));
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

There are two cases, described here, where it does more than replace the TypeScript syntax with blank space.

### Arrow function return types that introduce a new line

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

### Prefix style type assertions in a return position

Before TypeScript added `val as Type` in [TypeScript 1.6 (2015)](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-1-6.html#jsx-support), assertions were always written as `<Type>val`.

This angle bracket `<` style is not compatible with parsing JSX, and being a prefix
has a larger impact on the parser. Specifically for `ts-blank-space` there are situations
where erasing it could change the semantics of the remaining JavaScript.

The first situation is when the type assertions follows a `return` and is followed by a newline.
`ts-blank-space` solves this by using the [comma operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Comma_operator) to preserve the correct semantics.

Example input:

```typescript
function f() {
    return <string>
        "string on a new line";
}
```

becomes:

```javascript
function f() {
    return 0,
        "string on a new line";
}
```

The second situation is when the type assertions is at the start of an arrow `=>` function body and is followed
by an object literal. `() => <Type>{}`. A different approach is needed here, and the assertion is replaced with `0||`.

Example input:

```typescript
const f = () => <MyType>{};
```

becomes:

```javascript
const f = () => 0||     {};
```

However this approach will not work for more complex arrow function bodies. When these
arise `ts-blank-space` will leave the assertion in place and call the optional `onError` callback.
See [`./tests/errors`](./tests/errors.test.js).

If possible it is advised to switch to using `(exp as T)` over `(<T>exp)` to avoid these cases.

## Unsupported

Some parts of TypeScript are not supported because they can't be erased in place due to having
runtime semantics.

- `enum` (unless `declare enum`)
- `namespace` (unless `declare namespace`)
- `module` (unless `declare module`)
- `import lib = ...`, `export = ...` (TypeScript style CommonJS)
- `constructor(public x) {}` (parameter properties in class constructors)
- Some prefix style `<Type>` assertions (see [above](#legacy-type-assertions-in-a-return-position))

When any of the above are encountered `ts-blank-space` will call the optional `onError` callback and continue.
Examples can be seen in [`errors.test.js`](./tests/errors.test.js).

## Recommend `tsconfig.json` compiler settings

```jsonc
{
    // Because class fields are preserved as written which corresponds
    // to 'define' semantics in the ECMAScript specification
    "useDefineAsClassFields": true,
    // Because imports and exports are preserved as written, only removing the
    // parts which are explicitly annotated with the `type` keyword
    "verbatimModuleSyntax": true
}
```

## TSX/JSX

JSX is not transformed, it will be preserved in the output.

By default `ts-blank-space` will parse the file assuming `.ts`. If the original file contains JSX syntax
then the parsing should be done manually. There is a TSX example in [`valid.test.js`](./tests/valid.test.js).
