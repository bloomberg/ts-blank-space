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
-   1 File read done in Node.js
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
| typescript           | sync JS    | 6.375 s ± 0.086 s  |
| @babel/core          | sync JS    | 7.517 s ± 0.060 s  |

```sh
Benchmark: node ./esbuild-async.js ./fixtures/checker.txt 10
  Time (mean ± σ):      309.6 ms ±  11.5 ms    [User: 113.1 ms, System: 48.4 ms]
  Range (min … max):    296.2 ms … 332.1 ms    10 runs

Benchmark: node ./swc-native-async.js ./fixtures/checker.txt 10
  Time (mean ± σ):      512.2 ms ±  10.4 ms    [User: 1667.0 ms, System: 101.8 ms]
  Range (min … max):    497.0 ms … 526.1 ms    10 runs

Benchmark: node ./esbuild-sync.js ./fixtures/checker.txt 10
  Time (mean ± σ):      1.146 s ±  0.011 s    [User: 1.640 s, System: 0.156 s]
  Range (min … max):    1.127 s …  1.161 s    10 runs

Benchmark: node ./ts-blank-space.js ./fixtures/checker.txt 10
  Time (mean ± σ):      1.255 s ±  0.014 s    [User: 2.090 s, System: 0.130 s]
  Range (min … max):    1.235 s …  1.281 s    10 runs

Benchmark: node ./swc-wasm-strip.js ./fixtures/checker.txt 10
  Time (mean ± σ):      1.436 s ±  0.012 s    [User: 1.646 s, System: 0.046 s]
  Range (min … max):    1.425 s …  1.457 s    10 runs

Benchmark: node ./sucrase.js ./fixtures/checker.txt 10
  Time (mean ± σ):      1.537 s ±  0.037 s    [User: 2.206 s, System: 0.231 s]
  Range (min … max):    1.494 s …  1.625 s    10 runs

Benchmark: node ./swc-native-sync.js ./fixtures/checker.txt 10
  Time (mean ± σ):      1.580 s ±  0.019 s    [User: 1.640 s, System: 0.082 s]
  Range (min … max):    1.563 s …  1.634 s    10 runs

Benchmark: node ./swc-wasm.js ./fixtures/checker.txt 10
  Time (mean ± σ):      2.679 s ±  0.011 s    [User: 3.431 s, System: 0.091 s]
  Range (min … max):    2.660 s …  2.701 s    10 runs

Benchmark: node ./esbuild-wasm-async.js ./fixtures/checker.txt 10
  Time (mean ± σ):      5.448 s ±  0.018 s    [User: 0.122 s, System: 0.045 s]
  Range (min … max):    5.421 s …  5.481 s    10 runs

Benchmark: node ./esbuild-wasm-sync.js ./fixtures/checker.txt 10
  Time (mean ± σ):      6.264 s ±  0.028 s    [User: 8.124 s, System: 0.269 s]
  Range (min … max):    6.233 s …  6.306 s    10 runs

Benchmark: node ./typescript.js ./fixtures/checker.txt 10
  Time (mean ± σ):      6.375 s ±  0.086 s    [User: 9.701 s, System: 0.405 s]
  Range (min … max):    6.249 s …  6.549 s    10 runs

Benchmark 1: node ./babel.js ./fixtures/checker.txt 10
  Time (mean ± σ):      7.517 s ±  0.060 s    [User: 11.499 s, System: 0.653 s]
  Range (min … max):    7.419 s …  7.615 s    10 runs
```
