# IncCSV.js

A JavaScript implementation of the
[INC file format](https://github.com/mroughan/INCspec).

INC files are ordinary CSV files with an optional, lightweight metadata block at
the top. This package parses and writes INC text in browsers and Node.js. Node
file helpers are available from the `inccsv/fs` export.

See also the Julia implementation
[`IncCSV.jl`](https://github.com/mroughan/IncCSV.jl) and the Python
implementation [`IncCSV.py`](https://github.com/lewismath/IncCSV.py).

## Documentation

Static documentation and browser demos live in [`docs/`](docs/):

- [Overview](docs/index.html): API quick reference and INC file anatomy.
- [Playground](docs/playground.html): parse, inspect, and write INC text.
- [Schema demo](docs/schema.html): validate metadata with an INC mini-schema.
- [Examples](docs/examples.html): rendered examples for common INC patterns.

Run the local docs server from this package directory:

```sh
npm run docs
```

Then open `http://127.0.0.1:4173/docs/`.

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
