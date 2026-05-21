var IncCSV = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/browser-global.js
  var browser_global_exports = {};
  __export(browser_global_exports, {
    IncError: () => IncError,
    parseCsv: () => parseCsv,
    parseCsvRecords: () => parseCsvRecords,
    parseInc: () => parseInc,
    parseMetadataLines: () => parseMetadataLines,
    readSchemaFromText: () => readSchemaFromText,
    schemaFromMetadata: () => schemaFromMetadata,
    validateSchema: () => validateSchema,
    writeCsv: () => writeCsv,
    writeInc: () => writeInc,
    writeMetadata: () => writeMetadata
  });

  // src/errors.js
  var IncError = class extends Error {
    constructor(message, code) {
      super(message);
      this.name = "IncError";
      this.code = code;
    }
  };
  function fail(message, code) {
    throw new IncError(message, code);
  }

  // src/csv.js
  function parseCsv(text, options = {}) {
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
  function parseCsvRecords(text, options = {}) {
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
  function writeCsv(columns, rows) {
    const lines = [columns.map(formatCsvField).join(",")];
    for (const row of rows) {
      const fields = columns.map((column) => {
        if (Array.isArray(row)) {
          return formatCsvField(row[columns.indexOf(column)] ?? "");
        }
        return formatCsvField(row[column] ?? "");
      });
      lines.push(fields.join(","));
    }
    return `${lines.join("\n")}
`;
  }
  function formatCsvField(value) {
    const text = String(value);
    if (!/[",\r\n]/.test(text)) {
      return text;
    }
    return `"${text.replaceAll('"', '""')}"`;
  }

  // src/parser.js
  var VALID_STRUCTURE_KEYS = /* @__PURE__ */ new Set([
    "delim",
    "delimiter",
    "quotechar",
    "escapechar",
    "comment",
    "header",
    "footerskip"
  ]);
  function parseInc(text, options = {}) {
    const normalized = text.replace(/\r\n/g, "\n");
    const lines = normalized.split("\n");
    let metadata = {};
    let csvText = normalized;
    if (isDelimiterLine(lines[0] ?? "")) {
      const closeIndex = lines.findIndex((line, index) => index > 0 && isDelimiterLine(line));
      if (closeIndex === -1) {
        fail("Opening metadata delimiter has no closing delimiter.", "missing_closing_delimiter");
      }
      metadata = parseMetadataLines(lines.slice(1, closeIndex));
      csvText = lines.slice(closeIndex + 1).join("\n");
    }
    const structure = structureOptions(metadata.structure, options);
    const csv = parseCsv(csvText, structure);
    return { metadata, columns: csv.columns, rows: csv.rows };
  }
  function parseMetadataLines(lines) {
    const metadata = {};
    let sectionName = null;
    let sectionHasProperty = false;
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line === "" || line.startsWith("#") || line.startsWith(";")) {
        continue;
      }
      const sectionMatch = line.match(/^\[([^\]]*)\]\s*(?:[#;].*)?$/u);
      if (sectionMatch) {
        if (sectionName !== null && !sectionHasProperty) {
          fail(`Section [${sectionName}] has no properties.`, "empty_section");
        }
        sectionName = sectionMatch[1];
        assertName(sectionName);
        if (Object.hasOwn(metadata, sectionName)) {
          fail(`Duplicate section [${sectionName}].`, "duplicate_key");
        }
        metadata[sectionName] = {};
        sectionHasProperty = false;
        continue;
      }
      const equalsIndex = rawLine.indexOf("=");
      if (equalsIndex === -1) {
        fail(`Metadata line is not a property: ${rawLine}`, "invalid_name");
      }
      const key = rawLine.slice(0, equalsIndex).trim();
      assertName(key);
      const value = parseValue(rawLine.slice(equalsIndex + 1));
      const target = sectionName === null ? metadata : metadata[sectionName];
      if (Object.hasOwn(target, key)) {
        fail(`Duplicate metadata key ${key}.`, "duplicate_key");
      }
      target[key] = value;
      if (sectionName !== null) {
        sectionHasProperty = true;
      }
    }
    if (sectionName !== null && !sectionHasProperty) {
      fail(`Section [${sectionName}] has no properties.`, "empty_section");
    }
    return metadata;
  }
  function isDelimiterLine(line) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(\p{General_Category=Dash_Punctuation}{3,})(?:\s*[#;].*)?$/u);
    return Boolean(match);
  }
  function parseValue(rawValue) {
    const leftTrimmed = rawValue.replace(/^[ \t]*/u, "");
    if (leftTrimmed.startsWith('"')) {
      return parseQuotedValue(leftTrimmed);
    }
    const withoutComment = stripInlineComment(leftTrimmed);
    const value = withoutComment.trim();
    if (/^[+-]?\d+$/u.test(value)) {
      return Number.parseInt(value, 10);
    }
    return value;
  }
  function parseQuotedValue(value) {
    let output = "";
    let escaped = false;
    for (let i = 1; i < value.length; i += 1) {
      const ch = value[i];
      if (escaped) {
        if (ch === '"' || ch === "\\") {
          output += ch;
        } else {
          output += `\\${ch}`;
        }
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        const rest = value.slice(i + 1).trim();
        if (rest !== "" && !rest.startsWith("#") && !rest.startsWith(";")) {
          fail("Unexpected text after quoted metadata value.", "invalid_name");
        }
        return output;
      }
      output += ch;
    }
    fail("Quoted metadata value was not closed.", "invalid_name");
  }
  function stripInlineComment(value) {
    for (let i = 0; i < value.length; i += 1) {
      const ch = value[i];
      if ((ch === "#" || ch === ";") && i > 0 && /[ \t]/u.test(value[i - 1])) {
        return value.slice(0, i);
      }
    }
    return value;
  }
  function assertName(name) {
    if (name === "" || /[\s[\]=#;]/u.test(name)) {
      fail(`Invalid metadata name ${name}.`, "invalid_name");
    }
  }
  function structureOptions(structure = {}, overrides = {}) {
    const options = {};
    if (structure && typeof structure !== "object") {
      fail("[structure] must be a section.", "invalid_structure_value");
    }
    for (const key of Object.keys(structure ?? {})) {
      if (!VALID_STRUCTURE_KEYS.has(key)) {
        fail(`Unsupported [structure] key ${key}.`, "unsupported_structure_key");
      }
    }
    const delimiterValue = structure?.delimiter ?? structure?.delim;
    if (delimiterValue !== void 0) {
      options.delimiter = coerceCharacter(delimiterValue);
    }
    if (structure?.quotechar !== void 0) {
      options.quotechar = coerceCharacter(structure.quotechar);
    }
    if (structure?.escapechar !== void 0) {
      options.escapechar = coerceCharacter(structure.escapechar);
    }
    if (structure?.comment !== void 0) {
      if (typeof structure.comment !== "string") {
        fail("[structure].comment must be a string.", "invalid_structure_value");
      }
      options.comment = structure.comment;
    }
    if (structure?.header !== void 0) {
      options.header = coerceInteger(structure.header, "header");
    }
    if (structure?.footerskip !== void 0) {
      options.footerskip = coerceInteger(structure.footerskip, "footerskip");
    }
    return { ...options, ...overrides };
  }
  function coerceCharacter(value) {
    if (typeof value === "number" && Number.isInteger(value)) {
      return String.fromCodePoint(value);
    }
    if (typeof value !== "string") {
      fail("Structure character value must be a string or integer.", "invalid_structure_value");
    }
    if (value === "tab" || value === "\\t") {
      return "	";
    }
    if (value === "space") {
      return " ";
    }
    if (/^\d+$/u.test(value)) {
      return String.fromCodePoint(Number.parseInt(value, 10));
    }
    if ([...value].length !== 1) {
      fail("Structure character value must resolve to one character.", "invalid_structure_value");
    }
    return value;
  }
  function coerceInteger(value, key) {
    if (!Number.isInteger(value)) {
      fail(`[structure].${key} must be an integer.`, "invalid_structure_value");
    }
    return value;
  }

  // src/writer.js
  function writeInc({ metadata = {}, columns = [], rows = [] }) {
    const metadataText = writeMetadata(metadata);
    const csvText = writeCsv(columns, rows);
    if (metadataText === "") {
      return csvText;
    }
    return `---
${metadataText}---
${csvText}`;
  }
  function writeMetadata(metadata) {
    const lines = [];
    const scalarKeys = Object.keys(metadata).filter((key) => !isSection(metadata[key])).sort();
    const sectionKeys = Object.keys(metadata).filter((key) => isSection(metadata[key])).sort();
    for (const key of scalarKeys) {
      lines.push(`${key} = ${formatMetadataValue(metadata[key])}`);
    }
    for (const section of sectionKeys) {
      lines.push(`[${section}]`);
      for (const key of Object.keys(metadata[section]).sort()) {
        lines.push(`${key} = ${formatMetadataValue(metadata[section][key])}`);
      }
    }
    return lines.length === 0 ? "" : `${lines.join("\n")}
`;
  }
  function isSection(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }
  function formatMetadataValue(value) {
    if (Number.isInteger(value)) {
      return String(value);
    }
    const text = String(value);
    if (/[\r\n]/u.test(text)) {
      fail("Metadata values cannot contain newlines.", "invalid_metadata_value");
    }
    if (text === "" || /^[-+]?\d+$/u.test(text) || /["\\]/u.test(text)) {
      return `"${text.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
    }
    return text;
  }

  // src/schema.js
  var MUST_ALIASES = /* @__PURE__ */ new Set(["must", "required", "shall"]);
  var MAYBE_ALIASES = /* @__PURE__ */ new Set(["maybe", "optional", "may"]);
  var MUST_NOT_ALIASES = /* @__PURE__ */ new Set(["must_not", "shall_not"]);
  var SCHEMA_ALIASES = /* @__PURE__ */ new Set(["schema", "options"]);
  var DESCRIPTION_ALIASES = /* @__PURE__ */ new Set(["description", "descriptions", "describe"]);
  var FALSY_ALLOW_EXTRA = /* @__PURE__ */ new Set(["false", "0", "no", "deny", "closed"]);
  function readSchemaFromText(text) {
    const file = parseInc(text);
    return schemaFromMetadata(file.metadata);
  }
  function schemaFromMetadata(metadata) {
    const schemaSection = getSection(metadata, SCHEMA_ALIASES);
    const allowExtraRaw = schemaSection.allow_extra ?? "true";
    const allowExtra = !FALSY_ALLOW_EXTRA.has(String(allowExtraRaw).toLowerCase());
    const schema = {
      must: stringifySection(getSection(metadata, MUST_ALIASES)),
      maybe: stringifySection(getSection(metadata, MAYBE_ALIASES)),
      mustNot: stringifySection(getSection(metadata, MUST_NOT_ALIASES)),
      allowExtra,
      description: stringifySection(getSection(metadata, DESCRIPTION_ALIASES))
    };
    const seen = /* @__PURE__ */ new Map();
    for (const [requirement, paths] of [
      ["MUST", Object.keys(schema.must)],
      ["MAYBE", Object.keys(schema.maybe)],
      ["MUST_NOT", Object.keys(schema.mustNot)]
    ]) {
      for (const path of paths) {
        if (path.split(".").length > 2) {
          fail(`Schema path ${path} is too deep.`, "invalid_schema_path");
        }
        if (seen.has(path)) {
          fail(`Schema path ${path} is duplicated.`, "duplicate_schema_requirement");
        }
        seen.set(path, requirement);
      }
    }
    return schema;
  }
  function validateSchema(file, schema) {
    const paths = metadataPaths(file.metadata);
    const schemaPaths = /* @__PURE__ */ new Set([
      ...Object.keys(schema.must),
      ...Object.keys(schema.maybe),
      ...Object.keys(schema.mustNot)
    ]);
    const missing = Object.keys(schema.must).filter((path) => !hasPath(file.metadata, path)).sort();
    const forbidden = Object.keys(schema.mustNot).filter((path) => hasPath(file.metadata, path)).sort();
    const extra = [...paths].filter((path) => !schemaPaths.has(path)).sort();
    const valid = missing.length === 0 && forbidden.length === 0 && (schema.allowExtra || extra.length === 0);
    return { valid, missing, forbidden, extra };
  }
  function getSection(metadata, aliases) {
    for (const [key, value] of Object.entries(metadata)) {
      if (aliases.has(key.toLowerCase()) && value && typeof value === "object" && !Array.isArray(value)) {
        return value;
      }
    }
    return {};
  }
  function stringifySection(section) {
    return Object.fromEntries(Object.entries(section).map(([key, value]) => [key, String(value)]));
  }
  function metadataPaths(metadata) {
    const paths = /* @__PURE__ */ new Set();
    for (const [key, value] of Object.entries(metadata)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        for (const child of Object.keys(value)) {
          paths.add(`${key}.${child}`);
        }
      } else {
        paths.add(key);
      }
    }
    return paths;
  }
  function hasPath(metadata, path) {
    if (!path.includes(".")) {
      return Object.hasOwn(metadata, path);
    }
    const [section, key] = path.split(".");
    const value = metadata[section];
    return Boolean(value && typeof value === "object" && Object.hasOwn(value, key));
  }
  return __toCommonJS(browser_global_exports);
})();
//# sourceMappingURL=inccsv.browser.js.map
