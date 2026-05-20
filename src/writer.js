import { writeCsv } from "./csv.js";
import { fail } from "./errors.js";

export function writeInc({ metadata = {}, columns = [], rows = [] }) {
  const metadataText = writeMetadata(metadata);
  const csvText = writeCsv(columns, rows);
  if (metadataText === "") {
    return csvText;
  }
  return `---\n${metadataText}---\n${csvText}`;
}

export function writeMetadata(metadata) {
  const lines = [];
  const scalarKeys = Object.keys(metadata)
    .filter((key) => !isSection(metadata[key]))
    .sort();
  const sectionKeys = Object.keys(metadata)
    .filter((key) => isSection(metadata[key]))
    .sort();

  for (const key of scalarKeys) {
    lines.push(`${key} = ${formatMetadataValue(metadata[key])}`);
  }

  for (const section of sectionKeys) {
    lines.push(`[${section}]`);
    for (const key of Object.keys(metadata[section]).sort()) {
      lines.push(`${key} = ${formatMetadataValue(metadata[section][key])}`);
    }
  }

  return lines.length === 0 ? "" : `${lines.join("\n")}\n`;
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
