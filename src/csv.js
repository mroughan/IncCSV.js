import Papa from "papaparse";

import { fail } from "./errors.js";

export function parseCsv(text, options = {}) {
  const delimiter = options.delimiter ?? ",";
  const quote = options.quotechar ?? '"';
  const escape = options.escapechar ?? quote;
  const comment = options.comment;
  const headerLine = options.header ?? 1;
  const footerskip = options.footerskip ?? 0;

  const records = parseCsvRecords(text, { delimiter, quote, escape, comment });
  const trimmed = footerskip > 0 ? records.slice(0, -footerskip) : records;
  if (trimmed.length === 0) {
    return { columns: [], rows: [] };
  }

  const headerIndex = headerLine - 1;
  if (headerIndex < 0 || headerIndex >= trimmed.length) {
    fail("CSV header line is outside the CSV component.", "invalid_structure_value");
  }

  const columns = trimmed[headerIndex].map(String);
  const rows = trimmed.slice(headerIndex + 1).map((record) => {
    const row = {};
    columns.forEach((column, index) => {
      row[column] = record[index] ?? "";
    });
    return row;
  });

  return { columns, rows };
}

export function parseCsvRecords(text, options = {}) {
  const delimiter = options.delimiter ?? ",";
  const quote = options.quote ?? '"';
  const escape = options.escape ?? quote;
  const comment = options.comment;
  const parsed = Papa.parse(text, {
    comments: comment,
    delimiter,
    dynamicTyping: false,
    escapeChar: escape,
    header: false,
    quoteChar: quote,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    fail(parsed.errors[0].message, "invalid_csv");
  }

  return parsed.data.map((record) => record.map((field) => field ?? ""));
}

export function writeCsv(columns, rows, options = {}) {
  const delimiter = options.delimiter ?? ",";
  const quote = options.quotechar ?? '"';
  const escape = options.escapechar ?? quote;
  const data = [columns, ...rows.map((row) => {
    if (Array.isArray(row)) {
      return columns.map((_, index) => row[index] ?? "");
    }
    return columns.map((column) => row[column] ?? "");
  })];

  return `${Papa.unparse(data, {
    delimiter,
    escapeChar: escape,
    header: false,
    newline: "\n",
    quoteChar: quote,
  })}\n`;
}
