# Contributing

Thank you for helping improve IncCSV.js.

## Development Setup

Use Node.js 20 or newer.

```sh
npm install
npm test
```

The test harness reads language-neutral fixtures from `../INCspec`, so the
recommended local layout is:

```text
INC/
  INCspec/
  IncCSV.js/
```

## Documentation

Run the local documentation server with:

```sh
npm run docs
```

Then open:

```text
http://127.0.0.1:4173/docs/
```

## Pull Request Checklist

- Keep changes focused on INC parsing, writing, validation, or documentation.
- Preserve the public API unless the changelog and README are updated.
- Add or update conformance tests when behavior changes.
- Run `npm test` before submitting.
- Run `npm run release:check` before release-oriented changes.
