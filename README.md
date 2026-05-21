# IncCSV.js

A JavaScript implementation of the
[INC file format](https://github.com/mroughan/INCspec).

INC files are ordinary CSV files with an optional, lightweight metadata block at
the top. This package parses and writes INC text in browsers and Node.js. Node
file helpers are available from the `inccsv/fs` export.

Package name: [`inccsv`](https://www.npmjs.com/package/inccsv).

See also the Julia implementation
[`IncCSV.jl`](https://github.com/mroughan/IncCSV.jl) and the Python
implementation [`IncCSV.py`](https://github.com/lewismath/IncCSV.py).

## Documentation

Static documentation and browser demos live in [`docs/`](docs/):

- [Overview](docs/index.html): API quick reference and INC file anatomy.
- [Playground](docs/playground.html): parse, inspect, and write INC text.
- [Schema demo](docs/schema.html): validate metadata with an INC mini-schema.
- [Examples](docs/examples.html): rendered examples for common INC patterns.
- [Shiny](docs/shiny.html): use the browser bundle from an R Shiny app.

Run the local docs server from this package directory:

```sh
npm run docs
```

Then open `http://127.0.0.1:4173/docs/`.

## Installation

After publication to npm:

```sh
npm install inccsv
```

## Usage

```js
import { parseInc, writeInc } from "inccsv";

const file = parseInc(`---
title = Sensor readings
[columns]
temperature = Celsius
---
time,temperature
0,21.4
1,21.8
`);

console.log(file.metadata.title);
console.log(file.rows);

const text = writeInc({
  metadata: file.metadata,
  columns: file.columns,
  rows: file.rows,
});
```

For Node file I/O:

```js
import { readInc, writeIncFile } from "inccsv/fs";

const file = await readInc("data.inc");
await writeIncFile("copy.inc", file);
```

## Browser Bundle And Shiny

Build a browser-ready global bundle with:

```sh
npm run build
```

This writes:

```text
dist/inccsv.browser.js
dist/inccsv.browser.min.js
```

Both expose the package as `window.IncCSV`. A complete R Shiny example is
included in [`examples/shiny/`](examples/shiny/). The build script also copies
the browser bundle into `examples/shiny/www/` so the app can serve it as a
normal Shiny asset:

```sh
cd examples/shiny
R -e 'shiny::runApp(".")'
```

## Current Scope

- INC and plain CSV reading.
- Metadata parsing with sections, integer/string values, quoting, and comments.
- `[structure]` support for delimiter, quote character, escape character,
  comment marker, header, and footerskip.
- INC writing with deterministic metadata ordering.
- Mini-schema reading and validation.
- Shared conformance tests for the INC specification fixtures.

This package is intentionally small and dependency-free. It is suitable for
lightweight browser and Node workflows; applications with highly specialized CSV
requirements may still prefer to adapt the parser boundary to their CSV library
of choice.

## Development

```sh
npm test
```

The test harness reads fixtures from `../INCspec`.

Before publishing a release, run:

```sh
npm run release:check
```

Release notes and the publishing checklist are maintained in
[`CHANGELOG.md`](CHANGELOG.md) and [`RELEASE.md`](RELEASE.md).

## Disclosure

This package was developed with assistance from OpenAI Codex, an AI coding
assistant based on GPT-5. Code design decisions were human mediated, and the
resulting code was manually reviewed.
