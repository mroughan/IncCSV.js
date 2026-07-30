import { writeCsv } from "./csv.js";
import { fail } from "./errors.js";
import { assertName, isSection } from "./metadata.js";

const WRITER_STRUCTURE_KEYS = new Set(["delimiter", "quotechar", "escapechar"]);

export function writeInc({ metadata = {}, columns = [], rows = [], csvOptions = {} }) {
  const metadataText = writeMetadata(metadata);
  const csvText = writeCsv(columns, rows, csvWriteOptions(metadata, csvOptions));
  if (metadataText === "") {
    return csvText;
  }
  return `---\n${metadataText}---\n${csvText}`;
}

function csvWriteOptions(metadata, csvOptions) {
  const options = {};
  const structure = metadata.structure;

  if (structure !== undefined) {
    if (!isSection(structure)) {
      fail("[structure] must be a section.", "invalid_structure_value");
    }

    const delimiterValue = structure.delimiter ?? structure.delim;
    if (delimiterValue !== undefined) {
      options.delimiter = coerceCharacter(delimiterValue);
    }
    if (structure.quotechar !== undefined) {
      options.quotechar = coerceCharacter(structure.quotechar);
    }
    if (structure.escapechar !== undefined) {
      options.escapechar = coerceCharacter(structure.escapechar);
    }
  }

  const explicit = { ...csvOptions };
  if (explicit.delim !== undefined && explicit.delimiter === undefined) {
    explicit.delimiter = explicit.delim;
    delete explicit.delim;
  }

  for (const [key, value] of Object.entries(explicit)) {
    const normalized = WRITER_STRUCTURE_KEYS.has(key) ? coerceCharacter(value) : value;
    if (WRITER_STRUCTURE_KEYS.has(key) && options[key] !== undefined && options[key] !== normalized) {
      fail(
        `CSV write option ${key} conflicts with [structure] metadata.`,
        "conflicting_structure_option",
      );
    }
    options[key] = normalized;
  }

  return options;
}

export function writeMetadata(metadata) {
  const lines = [];
  if (!isSection(metadata)) {
    fail("Metadata must be an object.", "invalid_metadata_value");
  }

  const scalarKeys = Object.keys(metadata)
    .filter((key) => !isSection(metadata[key]))
    .sort();
  const sectionKeys = Object.keys(metadata)
    .filter((key) => isSection(metadata[key]))
    .sort();

  for (const key of scalarKeys) {
    assertName(key);
    lines.push(`${key} = ${formatMetadataValue(metadata[key])}`);
  }

  for (const section of sectionKeys) {
    assertName(section);
    const sectionKeys = Object.keys(metadata[section]).sort();
    if (sectionKeys.length === 0) {
      fail(`Section [${section}] has no properties.`, "empty_section");
    }
    lines.push(`[${section}]`);
    for (const key of sectionKeys) {
      assertName(key);
      lines.push(`${key} = ${formatMetadataValue(metadata[section][key])}`);
    }
  }

  return lines.length === 0 ? "" : `${lines.join("\n")}\n`;
}

function formatMetadataValue(value) {
  if (Number.isInteger(value)) {
    return String(value);
  }
  if (typeof value !== "string") {
    fail("Metadata values must be integers or strings.", "invalid_metadata_value");
  }
  const text = String(value);
  if (/[\r\n]/u.test(text)) {
    fail("Metadata values cannot contain newlines.", "invalid_metadata_value");
  }
  if (text === "" || /^\s|\s$/u.test(text) || /^[-+]?\d+$/u.test(text) || /["\\]/u.test(text)) {
    return `"${text.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
  }
  return text;
}

function coerceCharacter(value) {
  if (Number.isInteger(value)) {
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
