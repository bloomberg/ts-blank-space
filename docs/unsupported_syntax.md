# TypeScript syntax not supported by `ts-blank-space`

-   [Runtime impacting syntax](#runtime-impacting-syntax)
-   [Compile time only syntax](#compile-time-only-syntax)

## Runtime impacting syntax

The following TypeScript features can not be erased by `ts-blank-space` because they have runtime semantics

-   `enum` (unless `declare enum`) [more details](#enums)
-   `namespace` (unless only contains types) [more details](#namespace-declarations)
-   `module` (unless `declare module`) [more details](#module-declarations)
-   `import lib = ...`, `export = ...` (TypeScript style CommonJS)
-   `constructor(public x) {}` [more details](#constructor-parameter-properties)

For more details on use of `declare` see [the `declare` hazard](#the-declare--hazard).

### Enums

The following `enum` declaration will not be transformed by `ts-blank-space`.

```typescript
enum Direction {
    North,
    South,
    East,
    West,
}
```

An alternative approach to defining an enum like value and type, which is `ts-blank-space` compatible:

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

The following usage of a constructor parameter property will not be transformed by `ts-blank-space`.

```typescript
class Person {
    constructor(public name: string) {}
    //          ^^^^^^
}
```

The equivalent `ts-blank-space` compatible approach:

```typescript
class Person {
    public name;
    constructor(name: string) {
        this.name = name;
    }
}
```

### `namespace` declarations

While sharing the same syntax there are technically two categories of `namespace` within TypeScript. Instantiated and non-instantiated. Instantiated namespaces create objects that exist at runtime. Non-instantiated namespaces can be erased. A namespace is non-instantiated if it only contains types, more specifically it may only contain:

-   type aliases: `[export] type A = ...`
-   interfaces: `[export] interface I { ... }`
-   Importing types from other namespaces: `import A = OtherNamespace.X`
-   More non-instantiated namespaces (the rule is recursive)

`ts-blank-space` will always erase non-instantiated namespaces and namespaces marked with [`declare`](#the-declare--hazard).

Examples of supported namespace syntax can be seen in the test fixture [tests/fixture/cases/namespaces.ts](../tests/fixture/cases/namespaces.ts). Error cases can be seen in [tests/errors](../tests/errors.test.ts).

### `module` declarations

`ts-blank-space` only erases TypeScript's `module` declarations if they are marked with `declare` (see [`declare` hazard](#the-declare--hazard)).

All other TypeScript `module` declarations will trigger the `onError` callback and be left in the output text verbatim. Including an empty declaration:

```ts
module M {} // `ts-blank-space` error
```

Note that, since TypeScript 5.6, use of `module` namespace declarations (not to be confused with _"ambient module declarations"_) will be shown with a strike-through (~~`module`~~) to hint that the syntax is deprecated in favour of [`namespace`](#namespace-declarations).

See https://github.com/microsoft/TypeScript/issues/51825 for more information.

### The `declare ...` hazard

As with `declare const ...`, while `ts-blank-space` will erase syntax such as `declare enum ...` and `declare namespace ...` without error it should be used with the knowledge that of what it symbolizes.
When using `declare` in TypeScript it is an _assertion_ by the author than the value will exist at runtime.

For example:

<!-- prettier-ignore -->
```ts
declare namespace N {
    export const x: number;
}
console.log(N.x);
```

The above will not be a build time error and will be transformed to:

<!-- prettier-ignore -->
```js



console.log(N.x);
```

So it may throw at runtime if nothing created a runtime value for `N` as promised by the `declare`.

Tests are a great way to catch issues that may arise from an incorrect `declare`.

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
