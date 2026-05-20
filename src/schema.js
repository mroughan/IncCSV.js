import { parseInc } from "./parser.js";
import { fail } from "./errors.js";

const MUST_ALIASES = new Set(["must", "required", "shall"]);
const MAYBE_ALIASES = new Set(["maybe", "optional", "may"]);
const MUST_NOT_ALIASES = new Set(["must_not", "shall_not"]);
const SCHEMA_ALIASES = new Set(["schema", "options"]);
const DESCRIPTION_ALIASES = new Set(["description", "descriptions", "describe"]);
const FALSY_ALLOW_EXTRA = new Set(["false", "0", "no", "deny", "closed"]);

export function readSchemaFromText(text) {
  const file = parseInc(text);
  return schemaFromMetadata(file.metadata);
}

export function schemaFromMetadata(metadata) {
  const schemaSection = getSection(metadata, SCHEMA_ALIASES);
  const allowExtraRaw = schemaSection.allow_extra ?? "true";
  const allowExtra = !FALSY_ALLOW_EXTRA.has(String(allowExtraRaw).toLowerCase());

  const schema = {
    must: stringifySection(getSection(metadata, MUST_ALIASES)),
    maybe: stringifySection(getSection(metadata, MAYBE_ALIASES)),
    mustNot: stringifySection(getSection(metadata, MUST_NOT_ALIASES)),
    allowExtra,
    description: stringifySection(getSection(metadata, DESCRIPTION_ALIASES)),
  };

  const seen = new Map();
  for (const [requirement, paths] of [
    ["MUST", Object.keys(schema.must)],
    ["MAYBE", Object.keys(schema.maybe)],
    ["MUST_NOT", Object.keys(schema.mustNot)],
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

export function validateSchema(file, schema) {
  const paths = metadataPaths(file.metadata);
  const schemaPaths = new Set([
    ...Object.keys(schema.must),
    ...Object.keys(schema.maybe),
    ...Object.keys(schema.mustNot),
  ]);

  const missing = Object.keys(schema.must).filter((path) => !hasPath(file.metadata, path)).sort();
  const forbidden = Object.keys(schema.mustNot).filter((path) => hasPath(file.metadata, path)).sort();
  const extra = [...paths].filter((path) => !schemaPaths.has(path)).sort();
  const valid = missing.length === 0
    && forbidden.length === 0
    && (schema.allowExtra || extra.length === 0);

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
  const paths = new Set();
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
