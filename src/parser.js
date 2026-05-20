import { parseCsv } from "./csv.js";
import { fail } from "./errors.js";

const VALID_STRUCTURE_KEYS = new Set([
  "delim",
  "delimiter",
  "quotechar",
  "escapechar",
  "comment",
  "header",
  "footerskip",
]);

export function parseInc(text, options = {}) {
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

export function parseMetadataLines(lines) {
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

export function isDelimiterLine(line) {
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
  if (delimiterValue !== undefined) {
    options.delimiter = coerceCharacter(delimiterValue);
  }
  if (structure?.quotechar !== undefined) {
    options.quotechar = coerceCharacter(structure.quotechar);
  }
  if (structure?.escapechar !== undefined) {
    options.escapechar = coerceCharacter(structure.escapechar);
  }
  if (structure?.comment !== undefined) {
    if (typeof structure.comment !== "string") {
      fail("[structure].comment must be a string.", "invalid_structure_value");
    }
    options.comment = structure.comment;
  }
  if (structure?.header !== undefined) {
    options.header = coerceInteger(structure.header, "header");
  }
  if (structure?.footerskip !== undefined) {
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
    return "\t";
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
