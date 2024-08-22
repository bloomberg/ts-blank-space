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
| @swc/core            | async Rust | 538.8 ms ± 14.5 ms |
| ts-blank-space       | sync JS    | 1.255 s ± 0.014 s  |
| @swc/wasm-typescript | sync wasm  | 1.436 s ± 0.012 s  |
| sucrase              | sync JS    | 1.537 s ± 0.037 s  |
| @swc/core            | sync Rust  | 1.682 s ± 0.030 s  |
| @swc/wasm            | sync wasm  | 2.679 s ± 0.011 s  |
| typescript           | sync JS    | 6.375 s ± 0.086 s  |

```sh
Benchmark: node ./swc-native-async.js ./fixtures/checker.txt 10
  Time (mean ± σ):     538.8 ms ±  14.5 ms    [User: 1765.2 ms, System: 96.6 ms]
  Range (min … max):   521.0 ms … 556.9 ms    10 runs

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
  Time (mean ± σ):      1.682 s ±  0.030 s    [User: 1.737 s, System: 0.085 s]
  Range (min … max):    1.656 s …  1.744 s    10 runs

Benchmark: node ./swc-wasm.js ./fixtures/checker.txt 10
  Time (mean ± σ):      2.679 s ±  0.011 s    [User: 3.431 s, System: 0.091 s]
  Range (min … max):    2.660 s …  2.701 s    10 runs

Benchmark: node ./typescript.js ./fixtures/checker.txt 10
  Time (mean ± σ):      6.375 s ±  0.086 s    [User: 9.701 s, System: 0.405 s]
  Range (min … max):    6.249 s …  6.549 s    10 runs
```
