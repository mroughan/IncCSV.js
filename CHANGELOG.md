# Changelog

All notable changes to IncCSV.js are recorded here.

This project follows semantic versioning once released on npm. During early
`0.x` releases, minor versions may still include API changes while the INC
specification and JavaScript API settle.

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
