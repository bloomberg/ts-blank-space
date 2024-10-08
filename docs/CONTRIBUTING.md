# Local Development

https://nodejs.org is required for development.

## Setup

```sh
npm install
```

## Build

```sh
npm run build
```

## Test

Update local test fixtures (if code has changed):

```sh
npm run fixtures
```

Run tests:

```sh
npm test
```

### Ecosystem tests

Setup ecosystem fixtures:

```sh
cd ./tests/ecosystem
npm install
./setup.sh
```

Run tests:

```sh
cd ./tests/ecosystem
npm test
# or
npm run test-ecosystem
```

### Performance tests

See [`../perf/README`](../perf/README.md).

## Website

Ensure `ts-blank-space` has been built

```sh
npm run build
```

Start development server

```sh
cd website
npm start
```
