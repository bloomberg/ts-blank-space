#!/bin/bash
set -e
set -u
cd "$(dirname "$0")"

# Download fixture
mkdir -p fixtures
curl -L -o fixtures/checker.txt https://gist.github.com/acutmore/63cbfa9367d11ff5ef496f03999243e7/raw/702de651977456a85adedf000a1facee8abe2e52/checker.txt
