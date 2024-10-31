# TypeScript syntax not supported by `ts-blank-space`

-   [Runtime impacting syntax](#runtime-impacting-syntax)
-   [Compile time only syntax](#compile-time-only-syntax)

## Runtime impacting syntax

The following TypeScript features can not be erased by `ts-blank-space` because they have runtime semantics

-   `enum` (unless `declare enum`) [more details](#enum)
-   `namespace` (unless `declare namespace`)
-   `module` (unless `declare module`)
-   `import lib = ...`, `export = ...` (TypeScript style CommonJS)
-   `constructor(public x) {}` [more details](#constructor-parameter-properties)

### Enum

```typescript
enum Direction {
    North,
    South,
    East,
    West,
}
```

Alternative approach to defining an enum like value and type, which is `ts-blank-space` compatible:

```typescript
const Direction = {
    North: 1,
    South: 2,
    East: 3,
    West: 4,
} as const;
type Direction = (typeof Direction)[keyof typeof Direction];
//   ^? = 1 | 2 | 3 | 4
```

### Constructor Parameter Properties

```typescript
class Person {
    constructor(public name: string) {}
}
```

Alternative `ts-blank-space` compatible approach:

```typescript
class Person {
    public name;
    constructor(name: string) {
        this.name = name;
    }
}
```

## Compile time only syntax

TypeScript type assertions have no runtime semantics, however `ts-blank-space` does not erase the legacy prefix-style type assertions.

<!-- prettier-ignore -->
```typescript
const x = <const>{ a: 1 };
//        ^^^^^^^ not erased by `ts-blank-space`
```

In 2015 [TypeScript 1.6](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-1-6.html#new-tsx-file-extension-and-as-operator) added an alternative style, which `ts-blank-space` does support. The above can be re-written as:

<!-- prettier-ignore -->
```typescript
const x = { a: 1 } as const;
```

Which `ts-blank-space` will transform to:

<!-- prettier-ignore -->
```javascript
const x = { a: 1 }         ;
```

The `as` style also has the advantage of not conflicting with JSX syntax.

The reason `ts-blank-space` doesn't support the prefix style is because there are situations where erasing it would change the runtime semantics of the remaining JavaScript.

### Type assertion at start of a `return` statement

<!-- prettier-ignore -->
```typescript
function foo() {
    return <const>
        [];
}
```

Erasing the type assertion would result in the following **incorrect output**:

<!-- prettier-ignore -->
```javascript
function foo() {
    return
        [];
}
```

Because of the new-line after `return` the above function is actually the same as:

<!-- prettier-ignore -->
```javascript
function foo() {
    return;
}
```

One possible approach `ts-blank-space` could take to retain the original semantics is to insert some JavaScript:

<!-- prettier-ignore -->
```javascript
function foo() {
    return 0,
        [];
}
```

However there are other places where prefix-style type-assertions can't be erased:

### Type assertion at the start of an `=>` arrow function body

<!-- prettier-ignore -->
```typescript
const fn = () => <const>{};
```

Erasing the type assertion would result in the following **incorrect output**:

<!-- prettier-ignore -->
```javascript
const fn = () =>        {};
```

The above function is the same as:

<!-- prettier-ignore -->
```javascript
const fn = () => {
    return;
};
```

The comma-operator approach above doesn't work here because the comma (`,`) could represent the end of the expression:

<!-- prettier-ignore -->
```javascript
function foo(arg1 = () => 1, arg2 = 2) {
//                         ^ comma marks the end of the first argument
}
```

An alternative way for `ts-blank-space` to fix up the output by adding JavaScript could be:

<!-- prettier-ignore -->
```javascript
const fn = () =>     0||{};
```

But this doesn't work for the following input:

<!-- prettier-ignore -->
```typescript
const fn = () => <const>{ p: a }.p ?? b;
```

Because the following output is a syntax error:

<!-- prettier-ignore -->
```javascript
const fn = () =>     0||{ p: a }.p ?? b;
```

### In Summary

Due to the following:

-   There does not appear to be a universal strategy for erasing prefix type assertions
-   Potential solutions involve injecting JavaScript not present in the input
-   Adding parenthesis `(` `)` to the output requires generating a sourcemap
-   `<const>val` can be re-written to `val as const`

`ts-blank-space` has decided to not support the prefix style.

### Async arrow functions with multiline generic parameters

When using an `async` arrow function with generic parameters that span multiple lines, `ts-blank-space` may produce syntactically invalid JavaScript after removing the TypeScript syntax.

Consider the following TypeScript code:

```typescript
// prettier-ignore
const fn = async <
    T,
    U,
    V
>() => null;
```

After transformation with `ts-blank-space`, the output is:

```javascript
const fn = async



 () => null;
```

This results in multiple empty lines and a syntactically invalid arrow function, leading to a runtime error:

```
Uncaught SyntaxError: Malformed arrow function parameter list
```

#### Workaround

To avoid this issue, you can:

-   Use a function declaration instead of a function expression:

    ```typescript
    // prettier-ignore
    async function fn<
        T,
        U,
        V
    >() {
        return null;
    }
    ```

-   Keep the generic parameters on the same line:

    ```typescript
    // prettier-ignore
    const fn = async <T, U, V>() => null;
    ```

-   Disable Prettier's automatic formatting for this section by adding `// prettier-ignore` comments.

This issue occurs because the removal of the generic parameters leaves blank lines that interfere with the syntax of the `async` arrow function. By keeping the generic parameters on the same line or using a function declaration, you can avoid this problem.
