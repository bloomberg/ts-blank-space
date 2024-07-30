#!/bin/bash
set -e
set -u
cd "$(dirname "$0")"

git clone --depth=1 https://github.com/microsoft/TypeScript.git typescript
