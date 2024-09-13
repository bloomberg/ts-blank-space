#!/bin/bash
set -e
set -u
cd "$(dirname "$0")"

echo "\n"

fixture='./fixtures/checker.txt'
# Higher count increases ratio of startup-time vs transform-time
count=10

hyperfine --warmup 3 \
   -n "ts-blank-space"              "node ./ts-blank-space.js $fixture $count"\
   -n "sucrase"                     "node ./sucrase.js $fixture $count"\
   -n "sucrase:ts-ast"              "node ./sucrase.js $fixture $count --ts-ast"\
   -n "@swc/core"                   "node ./swc-native-async.js $fixture $count"\
   -n "@swc/core:ts-ast"            "node ./swc-native-async.js $fixture $count --ts-ast"\
   -n "@swc/core:sync"              "node ./swc-native-sync.js $fixture $count"\
   -n "@swc/wasm-typescript"        "node ./swc-wasm-strip.js $fixture $count"\
   -n "@swc/wasm-typescript:ts-ast" "node ./swc-wasm-strip.js $fixture $count --ts-ast"\
   -n "@swc/wasm"                   "node ./swc-wasm.js $fixture $count"\
   -n "@swc/wasm:ts-ast"            "node ./swc-wasm.js $fixture $count --ts-ast"\
   -n "esbuild"                     "node ./esbuild-async.js $fixture $count"\
   -n "esbuild:ts-ast"              "node ./esbuild-async.js $fixture $count --ts-ast"\
   -n "esbuild:sync"                "node ./esbuild-sync.js $fixture $count"\
   -n "esbuild-wasm"                "node ./esbuild-wasm-async.js $fixture $count"\
   -n "esbuild-wasm:ts-ast"         "node ./esbuild-wasm-async.js $fixture $count --ts-ast"\
   -n "esbuild-wasm:sync"           "node ./esbuild-wasm-sync.js $fixture $count"\
   -n "@babel/core"                 "node ./babel.js $fixture $count"\
   -n "@babel/core:ts-ast"          "node ./babel.js $fixture $count --ts-ast"\
   -n "typescript"                  "node ./typescript.js $fixture $count"\
