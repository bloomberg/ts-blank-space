#!/bin/bash
set -e
set -u
cd "$(dirname "$0")"

echo "\n"

hyperfine --warmup 3 \
   'node ./this.js checker.txt 10'\
   'node ./sucrase.js checker.txt 10'\
   'node ./ts.js checker.txt 10'\
   'node ./swc-wasm.js checker.txt 10'\
   'node ./swc-wasm-strip.js checker.txt 10'\
   'node ./swc-native-sync.js checker.txt 10'\
   'node ./swc-native-async.js checker.txt 10'
