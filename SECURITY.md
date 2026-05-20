# Security Policy

IncCSV.js is a small parser and writer for text files. It does not execute INC
file contents.

## Supported Versions

Security fixes are provided for the latest published `0.x` version while the
package is pre-1.0.

## Reporting A Vulnerability

Please report suspected vulnerabilities privately to the repository maintainers
before opening a public issue.

When reporting, include:

- the affected package version;
- a minimal input file or code sample;
- the observed behavior;
- the expected safe behavior.

## Parser Safety Notes

- Treat INC and CSV input as untrusted text until parsed and validated.
- Validate metadata with a mini-schema when receiving files from untrusted
  sources.
- Escape rendered metadata and CSV values when displaying them in HTML.
