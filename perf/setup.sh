#!/bin/bash
set -e
set -u
cd "$(dirname "$0")"

# Download fixture
mkdir -p fixtures
curl -L -o fixtures/checker.txt https://gist.github.com/acutmore/63cbfa9367d11ff5ef496f03999243e7/raw/7e907f90496e086edba26e0f220f7a696c9aecd2/checker.txt
