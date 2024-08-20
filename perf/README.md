# `ts-blank-space` performance tests

Transforming just over 500,000 lines of TypeScript (one 50k file, ten times).

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

```sh
Summary
  node ./swc-native-async.js ./fixtures/checker.txt 10 ran
    1.52 ± 0.05 times faster than node ./ts-blank-space.js ./fixtures/checker.txt 10
    1.71 ± 0.03 times faster than node ./swc-wasm-strip.js ./fixtures/checker.txt 10
    1.85 ± 0.05 times faster than node ./sucrase.js ./fixtures/checker.txt 10
    3.19 ± 0.05 times faster than node ./swc-native-sync.js ./fixtures/checker.txt 10
    4.98 ± 0.08 times faster than node ./swc-wasm.js ./fixtures/checker.txt 10
    7.58 ± 0.16 times faster than node ./typescript.js ./fixtures/checker.txt 10
```

```sh
Benchmark: node ./swc-native-async.js ./fixtures/checker.txt 10
  Time (mean ± σ):     853.7 ms ±  11.8 ms    [User: 2891.6 ms, System: 144.4 ms]
  Range (min … max):   836.9 ms … 865.9 ms    10 runs

Benchmark: node ./ts-blank-space.js ./fixtures/checker.txt 10
  Time (mean ± σ):      1.295 s ±  0.035 s    [User: 2.150 s, System: 0.146 s]
  Range (min … max):    1.255 s …  1.363 s    10 runs

Benchmark: node ./swc-wasm-strip.js ./fixtures/checker.txt 10
  Time (mean ± σ):      1.462 s ±  0.013 s    [User: 1.670 s, System: 0.050 s]
  Range (min … max):    1.444 s …  1.481 s    10 runs

Benchmark: node ./sucrase.js ./fixtures/checker.txt 10
  Time (mean ± σ):      1.583 s ±  0.041 s    [User: 2.261 s, System: 0.250 s]
  Range (min … max):    1.535 s …  1.637 s    10 runs

Benchmark: node ./swc-native-sync.js ./fixtures/checker.txt 10
  Time (mean ± σ):      2.727 s ±  0.020 s    [User: 2.856 s, System: 0.133 s]
  Range (min … max):    2.698 s …  2.755 s    10 runs

Benchmark: node ./swc-wasm.js ./fixtures/checker.txt 10
  Time (mean ± σ):      4.252 s ±  0.027 s    [User: 5.605 s, System: 0.136 s]
  Range (min … max):    4.223 s …  4.313 s    10 runs

Benchmark: node ./typescript.js ./fixtures/checker.txt 10
  Time (mean ± σ):      6.470 s ±  0.109 s    [User: 9.967 s, System: 0.370 s]
  Range (min … max):    6.336 s …  6.710 s    10 runs
```
