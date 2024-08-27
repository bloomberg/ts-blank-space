---
layout: base.html
title: ts-blank-space
---

TypeScript goes in:

<!-- prettier-ignore -->
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

<!-- prettier-ignore -->
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

## Playground

Checkout the [playground](./play).

## Links

-   [github.com/bloomberg/ts-blank-space](https://github.com/bloomberg/ts-blank-space)
