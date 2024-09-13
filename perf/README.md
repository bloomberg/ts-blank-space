# `ts-blank-space` performance tests

Transforming just over 500,000 lines of TypeScript (one ~50k file, ten times).

## Setup

```sh
npm i
./setup.sh
```

You will also need to install https://github.com/sharkdp/hyperfine

## Running

```sh
./bench.sh
```

## Results

-   Node.js v20.11.1
-   Apple M2 Pro 32GB
-   1 file read done using `node:fs`
-   3 warmup runs
-   10 measured runs

| package              | runtime    | mean time ± σ      |
| -------------------- | ---------- | ------------------ |
| esbuild              | async Go   | 309.6 ms ± 11.5 ms |
| @swc/core            | async Rust | 512.2 ms ± 10.4 ms |
| esbuild              | sync Go    | 1.146 s ± 0.011 s  |
| ts-blank-space       | sync JS    | 1.255 s ± 0.014 s  |
| @swc/wasm-typescript | sync wasm  | 1.436 s ± 0.012 s  |
| sucrase              | sync JS    | 1.537 s ± 0.037 s  |
| @swc/core            | sync Rust  | 1.580 s ± 0.019 s  |
| @swc/wasm            | sync wasm  | 2.679 s ± 0.011 s  |
| esbuild-wasm         | async wasm | 5.448 s ± 0.018 s  |
| esbuild-wasm         | sync wasm  | 6.264 s ± 0.028 s  |
| typescript           | sync JS    | 7.068 s ± 0.061 s  |
| @babel/core          | sync JS    | 7.517 s ± 0.060 s  |

```sh
Benchmark: esbuild
  Time (mean ± σ):      309.6 ms ±  11.5 ms    [User: 113.1 ms, System: 48.4 ms]
  Range (min … max):    296.2 ms … 332.1 ms    10 runs

Benchmark: @swc/core
  Time (mean ± σ):      512.2 ms ±  10.4 ms    [User: 1667.0 ms, System: 101.8 ms]
  Range (min … max):    497.0 ms … 526.1 ms    10 runs

Benchmark: esbuild:sync
  Time (mean ± σ):      1.146 s ±  0.011 s    [User: 1.640 s, System: 0.156 s]
  Range (min … max):    1.127 s …  1.161 s    10 runs

Benchmark: ts-blank-space
  Time (mean ± σ):      1.255 s ±  0.014 s    [User: 2.090 s, System: 0.130 s]
  Range (min … max):    1.235 s …  1.281 s    10 runs

Benchmark: @swc/wasm-typescript
  Time (mean ± σ):      1.436 s ±  0.012 s    [User: 1.646 s, System: 0.046 s]
  Range (min … max):    1.425 s …  1.457 s    10 runs

Benchmark: sucrase
  Time (mean ± σ):      1.537 s ±  0.037 s    [User: 2.206 s, System: 0.231 s]
  Range (min … max):    1.494 s …  1.625 s    10 runs

Benchmark: @swc/core:sync
  Time (mean ± σ):      1.580 s ±  0.019 s    [User: 1.640 s, System: 0.082 s]
  Range (min … max):    1.563 s …  1.634 s    10 runs

Benchmark: @swc/wasm
  Time (mean ± σ):      2.679 s ±  0.011 s    [User: 3.431 s, System: 0.091 s]
  Range (min … max):    2.660 s …  2.701 s    10 runs

Benchmark: esbuild-wasm
  Time (mean ± σ):      5.448 s ±  0.018 s    [User: 0.122 s, System: 0.045 s]
  Range (min … max):    5.421 s …  5.481 s    10 runs

Benchmark: esbuild-wasm:sync
  Time (mean ± σ):      6.264 s ±  0.028 s    [User: 8.124 s, System: 0.269 s]
  Range (min … max):    6.233 s …  6.306 s    10 runs

Benchmark: typescript
  Time (mean ± σ):      7.068 s ±  0.061 s    [User: 10.395 s, System: 0.397 s]
  Range (min … max):    6.955 s …  7.150 s    10 runs

Benchmark: @babel/core
  Time (mean ± σ):      7.517 s ±  0.060 s    [User: 11.499 s, System: 0.653 s]
  Range (min … max):    7.419 s …  7.615 s    10 runs
```

### Including accessing TypeScript AST

One of the benefits of `ts-blank-space` is that it can [reuse an existing TypeScript AST](../README.md#bring-your-own-ast).

This is important for Bloomberg's use case because we also require JavaScript access to the TypeScript AST for analysis.
Here are the results of the experiment when we also include the cost of exposing the AST to JavaScript.

`@babel/core` (via `@babel/parser`), `@swc/core`, and `@swc/wasm` expose an AST. `esbuild`, `sucrase`, and `@swc/wasm-typescript` do not expose an AST, for these packages `typescript` is used to provide an AST.

| package              | runtime    | mean time ± σ     |
| -------------------- | ---------- | ----------------- |
| ts-blank-space       | sync JS    | 1.255 s ± 0.014 s |
| esbuild              | async Go   | 1.422 s ± 0.018 s |
| @swc/core            | async Rust | 1.570 s ± 0.015 s |
| sucrase              | sync JS    | 2.580 s ± 0.042 s |
| @swc/wasm-typescript | sync wasm  | 2.597 s ± 0.029 s |
| @swc/wasm            | sync wasm  | 5.032 s ± 0.015 s |
| esbuild-wasm         | async wasm | 6.466 s ± 0.020 s |
| typescript           | sync JS    | 7.068 s ± 0.061 s |
| @babel/core          | sync JS    | 7.609 s ± 0.130 s |

```sh
Benchmark: ts-blank-space
  Time (mean ± σ):      1.255 s ±  0.014 s    [User: 2.090 s, System: 0.130 s]
  Range (min … max):    1.235 s …  1.281 s    10 runs

Benchmark: esbuild:ts-ast
  Time (mean ± σ):      1.422 s ±  0.018 s    [User: 3.256 s, System: 0.248 s]
  Range (min … max):    1.397 s …  1.468 s    10 runs

Benchmark: @swc/core:ts-ast
  Time (mean ± σ):      1.570 s ±  0.015 s    [User: 4.282 s, System: 0.279 s]
  Range (min … max):    1.547 s …  1.595 s    10 runs

Benchmark: sucrase:ts-ast
  Time (mean ± σ):      2.580 s ±  0.042 s    [User: 4.116 s, System: 0.348 s]
  Range (min … max):    2.512 s …  2.662 s    10 runs

Benchmark: @swc/wasm-typescript:ts-ast
  Time (mean ± σ):      2.597 s ±  0.029 s    [User: 3.669 s, System: 0.168 s]
  Range (min … max):    2.565 s …  2.646 s    10 runs

Benchmark: @swc/wasm:ts-ast
  Time (mean ± σ):      5.032 s ±  0.015 s    [User: 6.611 s, System: 0.273 s]
  Range (min … max):    5.009 s …  5.064 s    10 runs

Benchmark: esbuild-wasm:ts-ast
  Time (mean ± σ):      6.466 s ±  0.020 s    [User: 2.143 s, System: 0.166 s]
  Range (min … max):    6.438 s …  6.508 s    10 runs

Benchmark: typescript
  Time (mean ± σ):      7.068 s ±  0.061 s    [User: 10.395 s, System: 0.397 s]
  Range (min … max):    6.955 s …  7.150 s    10 runs

Benchmark: @babel/core:ts-ast
  Time (mean ± σ):      7.609 s ±  0.130 s    [User: 11.573 s, System: 0.747 s]
  Range (min … max):    7.428 s …  7.818 s    10 runs
```
