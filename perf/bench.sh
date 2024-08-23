#!/bin/bash
set -e
set -u
cd "$(dirname "$0")"

echo "\n"

fixture='./fixtures/checker.txt'
# Higher count to increases ratio of startup-time vs transform-time
count=10

hyperfine --warmup 3 \
   "node ./ts-blank-space.js $fixture $count"\
   "node ./sucrase.js $fixture $count"\
   "node ./swc-native-async.js $fixture $count"\
   "node ./swc-native-sync.js $fixture $count"\
   "node ./swc-wasm.js $fixture $count"\
   "node ./swc-wasm-strip.js $fixture $count"\
   "node ./esbuild-async.js $fixture $count"\
   "node ./esbuild-sync.js $fixture $count"\
   "node ./esbuild-wasm-async.js $fixture $count"\
   "node ./esbuild-wasm-sync.js $fixture $count"\
   "node ./babel.js $fixture $count"\
   "node ./typescript.js $fixture $count"\
