#!/bin/bash
set -e
set -u
cd "$(dirname "$0")"

echo "\n"

fixture='./fixtures/checker.txt'
count=10

hyperfine --warmup 3 \
   "node ./ts-blank-space.js $fixture $count"\
   "node ./sucrase.js $fixture $count"\
   "node ./typescript.js $fixture $count"\
   "node ./swc-wasm.js $fixture $count"\
   "node ./swc-wasm-strip.js $fixture $count"\
   "node ./swc-native-sync.js $fixture $count"\
   "node ./swc-native-async.js $fixture $count"
