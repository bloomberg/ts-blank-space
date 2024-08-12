# ts-blank-space

TypeScript goes in:

```typescript
class C<T> extends Array<T> implements I {
//     ^^^              ^^^ ^^^^^^^^^^^^
    private field!: string;
//  ^^^^^^^      ^^^^^^^^^

    method<T>(this: T, a?: string): void {
//        ^^^ ^^^^^^^^  ^  ^^^^^^   ^^^^
    }
}
```

JavaScript + space comes out:

```javascript
class C    extends Array                 {
//     ^^^              ^^^ ^^^^^^^^^^^^
            field         ;
//  ^^^^^^^      ^^^^^^^^^

    method   (         a         )       {
//        ^^^ ^^^^^^^^  ^  ^^^^^^   ^^^^
    }
}
```

## Menu

- [API](#api)
- [Source Maps](#where-are-my-sourcemaps)
- [Rationale](#rationale)
- [Implementation details](#does-it-really-just-blank-out-all-the-type-annotations)
- [Unsupported syntax](#unsupported)
- [tsconfig.json](#recommend-tsconfigjson-compiler-settings)
- [TSX/JSX](#tsxjsx)
- [ESM output](#ensuring-esm-output)
- [Contributions](#contributions)
- [License](#license)
- [Code of Conduct](#code-of-conduct)
- [Security Vulnerability Reporting](#security-vulnerability-reporting)

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
    ts: typescript.SourceFile,
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

Because all the JavaScript in the output is located at the same line, column, and byte-offset as the original
there is no mapping information that is lost during the transform.

## Rationale

The benefits of this library are:

- It is fast (for a pure JavaScript transform). See the `./perf` folder
  - No new JavaScript needs to be emitted from an AST, it re-uses slices of the existing source string
  - This is particularly true if other parts of your program are already generating the TypeScript SourceFile object for other reasons because it can [be reused](#bring-your-own-ast), and producing the AST is the most time consuming part.
- It is small (less than 800 LOC)
  - By doing so little the code should be relatively easy to maintain
  - The hard part, of parsing the source, is delegated to the official TypeScript parser.
- No need for additional SourceMap processing. See ["where are my SourceMaps?"](#where-are-my-sourcemaps)

## Does it really just blank out all the type annotations?

There are two cases, described here, where it does more than replace the TypeScript syntax with blank space.

### ASI (automatic semicolon insertion)

To guard against [ASI](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#automatic_semicolon_insertion) issues in the output `ts-blank-space` will add `;` to the end of type-only statements.

Example input:

```typescript
statementWithNoSemiColon
type Erased = true
("not calling above statement")
```

becomes:

```javascript
statementWithNoSemiColon
;
("not calling above statement");
```

### Arrow function return types that introduce a new line

If the annotation marking the return type of an arrow function introduces a new line before the `=>`
then only replacing it with blank space would be incorrect.

So in addition to removing the type annotation, the `)` is moved down to the end of the type annotation.

Example input:

```typescript
let f = (a: string, b: string): Array<
   string
> => [a, b];
```

becomes:

```javascript
let f = (a        , b

) => [a, b];
```

## Unsupported

Some parts of TypeScript are not supported because they can't be erased in place due to having
runtime semantics. See [unsupported_syntax.md](./docs/unsupported_syntax.md).

When unsupported syntax is encountered `ts-blank-space` will call the optional `onError` callback and continue.
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

`.tsx` input will be `.jsx` output because the JSX parts are not transformed, and instead preserved in the output.

By default `ts-blank-space` will parse the file assuming `.ts`. If the original file contains JSX syntax
then the [parsing should be done manually](#bring-your-own-ast). There is a TSX example in [`valid.test.js`](./tests/valid.test.js).

## Ensuring ESM output

TypeScript may add an `export {};` if all `import`s and `export`s were removed (because they were `import/export type`).

Because `ts-blank-space` only removes code this is not performed. To force the output to always have an ESM syntactic marker you can manually append `"export {};"`;

## Contributions

We :heart: contributions.

Have you had a good experience with this project? Why not share some love and contribute code, or just let us know about any issues you had with it?

We welcome issue reports [here](../../issues); be sure to choose the proper issue template for your issue, so that we can be sure you're providing the necessary information.

Before sending a [Pull Request](../../pulls), please make sure you read our
[Contribution Guidelines](https://github.com/bloomberg/.github/blob/master/CONTRIBUTING.md).

## License

Please read the [LICENSE](./LICENSE) file.

## Code of Conduct

This project has adopted a [Code of Conduct](https://github.com/bloomberg/.github/blob/master/CODE_OF_CONDUCT.md).
If you have any concerns about the Code, or behavior which you have experienced in the project, please
contact us at opensource@bloomberg.net.

## Security Vulnerability Reporting

Please refer to the project [Security Policy](https://github.com/bloomberg/.github/blob/master/SECURITY.MD).
