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
  const records = [];
  let record = [];
  let field = "";
  let inQuotes = false;
  let atFieldStart = true;
  let atLineStart = true;
  let skippingComment = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (skippingComment) {
      if (ch === "\n") {
        skippingComment = false;
        atLineStart = true;
      }
      continue;
    }

    if (atLineStart && comment && text.startsWith(comment, i)) {
      skippingComment = true;
      i += comment.length - 1;
      continue;
    }

    if (inQuotes) {
      if (ch === escape && next === quote) {
        field += quote;
        i += 1;
      } else if (escape !== quote && ch === escape && next === escape) {
        field += escape;
        i += 1;
      } else if (escape === quote && ch === quote && next === quote) {
        field += quote;
        i += 1;
      } else if (ch === quote) {
        inQuotes = false;
      } else {
        field += ch;
      }
      atLineStart = false;
      continue;
    }

    if (atFieldStart && ch === quote) {
      inQuotes = true;
      atFieldStart = false;
      atLineStart = false;
      continue;
    }

    if (ch === delimiter) {
      record.push(field);
      field = "";
      atFieldStart = true;
      atLineStart = false;
      continue;
    }

    if (ch === "\r" || ch === "\n") {
      if (ch === "\r" && next === "\n") {
        i += 1;
      }
      record.push(field);
      if (!(record.length === 1 && record[0] === "")) {
        records.push(record);
      }
      record = [];
      field = "";
      atFieldStart = true;
      atLineStart = true;
      continue;
    }

    field += ch;
    atFieldStart = false;
    atLineStart = false;
  }

  if (inQuotes) {
    fail("CSV quote was not closed.", "invalid_csv");
  }

  if (field !== "" || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  return records;
}

export function writeCsv(columns, rows, options = {}) {
  const delimiter = options.delimiter ?? ",";
  const quote = options.quotechar ?? '"';
  const escape = options.escapechar ?? quote;
  const format = (value) => formatCsvField(value, { delimiter, quote, escape });
  const lines = [columns.map(format).join(delimiter)];
  for (const row of rows) {
    const fields = columns.map((column) => {
      if (Array.isArray(row)) {
        return format(row[columns.indexOf(column)] ?? "");
      }
      return format(row[column] ?? "");
    });
    lines.push(fields.join(delimiter));
  }
  return `${lines.join("\n")}\n`;
}

function formatCsvField(value, { delimiter, quote, escape }) {
  const text = String(value);
  if (!text.includes(delimiter) && !text.includes(quote) && !/[\r\n]/u.test(text)) {
    return text;
  }
  const escaped = escape === quote
    ? text.replaceAll(quote, `${quote}${quote}`)
    : text.replaceAll(escape, `${escape}${escape}`).replaceAll(quote, `${escape}${quote}`);
  return `${quote}${escaped}${quote}`;
}
