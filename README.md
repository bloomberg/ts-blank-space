<a href="https://bloomberg.github.io/ts-blank-space">
    <img src="assets/ts-blank-space.png" width="728" alt="'ts-blank-space' as a logo. the 'ts' is in TypeScript blue and the 'blank-space' is in JavaScript orange" />
</a>

A small, fast, pure JavaScript type-stripper that uses the official TypeScript parser.

[![npm Badge](https://img.shields.io/npm/v/ts-blank-space.svg)](https://www.npmjs.com/package/ts-blank-space)

---

TypeScript goes in:

<!-- prettier-ignore -->
```typescript
class C<T> extends Array<T> implements I {
//     ^^^              ^^^^^^^^^^^^^^^^
    private field!: string;
//  ^^^^^^^      ^^^^^^^^^

    method<T>(this: T, a?: string): void {
//        ^^^ ^^^^^^^^  ^^^^^^^^^ ^^^^^^
    }
}
```

JavaScript + space comes out:

<!-- prettier-ignore -->
```javascript
class C    extends Array                 {
//     ^^^              ^^^^^^^^^^^^^^^^
            field         ;
//  ^^^^^^^      ^^^^^^^^^

    method   (         a         )       {
//        ^^^ ^^^^^^^^  ^^^^^^^^^ ^^^^^^
    }
}
```

Try it out in the [playground](https://bloomberg.github.io/ts-blank-space/play/).

## Rationale

The benefits of this library are:

-   It is fast
    -   See [`./perf`](./perf/) folder for a micro-benchmark
        -   Only 4 times slower than a native multi-threaded transformer
        -   Fastest compared to non-native (JavaScript or Wasm)
    -   No new JavaScript code is generated; instead, it re-uses slices of the existing source string
    -   This is particularly true if your program is already generating the TypeScript `SourceFile` object, because it can [be reused](#bring-your-own-ast) -- and producing the AST is the most time consuming part.
-   100% JavaScript runtime
    -   No [Wasm](https://webassembly.org)
    -   No [native-addons](https://nodejs.org/api/addons.html)
    -   No [child process](https://nodejs.org/api/child_process.html)
-   It is small
    -   Around 700 lines of code and one dependency ([`TypeScript`](https://www.npmjs.com/package/typescript))
    -   By doing so little, the code should be relatively easy to maintain
-   Delegates the parsing to the [official TypeScript parser](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
-   No need for additional SourceMap processing; see ["where are my SourceMaps?"](#where-are-my-sourcemaps)

:information_source: Not all TypeScript syntax is supported (see [unsupported syntax](#unsupported-syntax)). There is also no down-leveling; the JavaScript is preserved as is.

## Contents

-   [Installing](#installing)
-   [API](#api)
-   [Node.js Loader](#nodejs-loader)
-   [SourceMaps](#where-are-my-sourcemaps)
-   [Implementation details](#does-it-really-just-blank-out-all-the-type-annotations)
-   [Unsupported Syntax](#unsupported-syntax)
-   [tsconfig.json](#recommended-tsconfigjson-compiler-settings)
-   [TSX/JSX](#tsxjsx)
-   [ESM Output](#ensuring-esm-output)
-   [Contributions](#contributions)
-   [License](#license)
-   [Code of Conduct](#code-of-conduct)
-   [Security Vulnerability Reporting](#security-vulnerability-reporting)

## Installing

```sh
npm install ts-blank-space
```

## API

### String to String

```typescript
export default function tsBlankSpace(ts: string, onError?: (node) => void): string;
```

```javascript
import tsBlankSpace from "ts-blank-space";

console.log(tsBlankSpace(`let x: string;`));
// "let x        ;"
```

### Bring your own AST

```typescript
export function blankSourceFile(ts: typescript.SourceFile, onError?: (node) => void): string;
```

```javascript
import ts from "typescript";
import { blankSourceFile } from "ts-blank-space";

const ast = ts.createSourceFile(...);
console.log(blankSourceFile(ast));
```

## Node.js Loader

`ts-blank-space` exposes the required [Node.js module loader hooks](https://nodejs.org/api/module.html#customization-hooks) to use `ts-blank-space` to pre-process `*.ts` that are imported before they are evaluated.

```sh
# Install (one time):
$ npm install --save-dev ts-blank-space

# Example usage (Node.js >= v18.20):
$ node --import ts-blank-space/register ./path/to/your/file.ts
```

In addition to loading `*.ts` files, an import resolver is also registered which catches failed `*.js` imports and re-attempts the import replacing the extension with `.ts`. This allows import paths to choose either `.ts` or `.js` depending on which other factors the project may need to take into account such as bundling and package distribution.

:information_source: The loader assumes that all `.ts` files are [ESM](https://nodejs.org/api/esm.html).

## Where are my SourceMaps?

Because all the JavaScript in the output is located at the same line, column, and byte-offset as the original source, no mapping information is lost during the transform.

## Does it really just blank out all the type annotations?

There are two cases, described here, where it does more than replace the TypeScript syntax with blank space.

### ASI (automatic semicolon insertion)

To guard against [ASI](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#automatic_semicolon_insertion) issues in the output, `ts-blank-space` will add `;` to the end of type-only statements, and when removing a leading type annotation could introduce an ASI hazard.

#### Example one - type-only statement

<!-- prettier-ignore -->
```typescript
statementWithNoSemiColon
type Erased = true
("not calling above statement")
```

becomes:

<!-- prettier-ignore -->
```javascript
statementWithNoSemiColon
;
("not calling above statement");
```

#### Example two - computed class fields/methods

<!-- prettier-ignore -->
```typescript
class C {
    field = 1/* no ; */
    public ["computed field not accessing above"] = 2
}
```

becomes:

<!-- prettier-ignore -->
```javascript
class C {
    field = 1/* no ; */
    ;      ["computed field not accessing above"] = 2
}
```

### Arrow function type annotations that introduce a new line

If the type annotations around an arrow function's parameters introduce a new line then only replacing them with blank space can be incorrect. Therefore, in addition to removing the type annotation, the `(` or `)` surrounding the function parameters may also be moved.

#### Example one - multi-line return type:

<!-- prettier-ignore -->
```typescript
let f = (a: string, b: string): Array<
   string
> => [a, b];
```

becomes:

<!-- prettier-ignore -->
```javascript
let f = (a        , b

) => [a, b];
```

#### Example two - `async` with multi-line type arguments:

<!-- prettier-ignore -->
```typescript
let f = async <
    T
>(v: T) => {};
```

becomes:

<!-- prettier-ignore -->
```javascript
let f = async (

  v   ) => {};
```

## Unsupported Syntax

Some parts of TypeScript are not supported because they can't be erased in place due to having runtime semantics. See [unsupported_syntax.md](./docs/unsupported_syntax.md).

When unsupported syntax is encountered, `ts-blank-space` will call the optional `onError` callback and continue. Examples can be seen in [`errors.test.ts`](./tests/errors.test.ts).

## Recommended `tsconfig.json` compiler settings

```jsonc
{
    // Because JS syntax is emitted as-is
    "target": "esnext",
    // Because class fields are preserved as written which corresponds
    // to 'define' semantics in the ECMAScript specification
    "useDefineForClassFields": true,
    // Because imports and exports are preserved as written, only removing the
    // parts which are explicitly annotated with the `type` keyword
    "verbatimModuleSyntax": true,
}
```

## TSX/JSX

`.tsx` input will generate `.jsx` output. JSX parts are not transformed, but instead preserved in the output.

By default, `ts-blank-space` will parse the file assuming `.ts`. If the original file contains JSX syntax, then the [parsing should be done manually](#bring-your-own-ast). There is a TSX example in [`valid.test.ts`](./tests/valid.test.ts).

```typescript
import ts from "typescript";
import { blankSourceFile } from "ts-blank-space";

...

const tsxSource = ts.createSourceFile("input.tsx", tsxInput, ts.ScriptTarget.ESNext, false, ts.ScriptKind.TSX);
const jsxOutput = blankSourceFile(tsxSource, onError);
```

## Ensuring ESM output

TypeScript may add an `export {};` if all `import`s and `export`s were removed (because they were `import/export type`).

Because `ts-blank-space` only removes code, this is not performed. To force the output to always have an ESM syntactic marker, you can manually append `"export {};"`;

## 3rd party ecosystem plugins

-   Webpack/Rspack: [ts-blank-loader](https://github.com/leimonio/ts-blank-loader)

## Contributions

We :heart: contributions.

Have you had a good experience with this project? Why not share some love and contribute code, or just let us know about any issues you had with it?

We welcome issue reports [here](../../issues); be sure to choose the proper issue template for your issue, so that we can be sure you're providing the necessary information.

Before sending a [Pull Request](../../pulls), please make sure you read our
[Contribution Guidelines](https://github.com/bloomberg/.github/blob/main/CONTRIBUTING.md).

## License

Please read the [LICENSE](./LICENSE) file.

## Code of Conduct

This project has adopted a [Code of Conduct](https://github.com/bloomberg/.github/blob/main/CODE_OF_CONDUCT.md).
If you have any concerns about the Code, or behavior which you have experienced in the project, please
contact us at opensource@bloomberg.net.

## Security Vulnerability Reporting

Please refer to the project [Security Policy](https://github.com/bloomberg/.github/blob/main/SECURITY.MD).
