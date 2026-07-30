# Changelog

All notable changes to IncCSV.js are recorded here.

This project follows semantic versioning once released on npm. During early
`0.x` releases, minor versions may still include API changes while the INC
specification and JavaScript API settle.

## 0.2.0 - 2026-07-31

- Replaced the internal CSV reader/writer with PapaParse.
- Applied writer-relevant `[structure]` metadata when writing the CSV component
  and rejected contradictory explicit CSV writer options.
- Rejected invalid writer metadata before emitting unreadable INC: invalid
  names, empty sections, non-integer/non-string values, booleans, floats,
  arrays, objects, dates, and strings containing newlines.
- Quoted string metadata values with leading or trailing whitespace so they
  round-trip.
- Added conformance coverage for key/section-name collisions and
  structure-driven TSV writing.

## 0.1.2 - 2026-05-28

- Merged mini-schema requirement alias sections such as `[MUST]` and
  `[REQUIRED]`.
- Rejected mini-schema paths with empty components such as `a.` and `.key`.

## 0.1.1 - 2026-05-21

- Added a browser bundle build that exposes IncCSV.js as `window.IncCSV`.
- Added normal and minified browser bundles in `dist/`.
- Added a self-contained R Shiny example in `examples/shiny/`.
- Added Shiny integration documentation.
- Updated CI and release checks to build the browser bundle before packaging.

## 0.1.0 - 2026-05-20

Initial npm-ready release.

- Added browser and Node.js parsing for INC and plain CSV text.
- Added deterministic INC writing.
- Added `[structure]` support for delimiter, quote character, escape character,
  comment marker, header, and footerskip.
- Added mini-schema reading and validation.
- Added Node file helpers through the `inccsv/fs` export.
- Added conformance tests against the shared INC specification fixtures.
- Added static documentation and browser demos.
