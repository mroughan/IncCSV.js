import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { parseInc, writeInc, readSchemaFromText, validateSchema } from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const specRoot = resolve(here, "../../INCspec");

test("positive INC specification tests", async () => {
  const schedule = await loadJson(join(specRoot, "tests", "positive.json"));
  for (const entry of schedule.tests) {
    if (entry.action === "read") {
      const file = await readFixture(entry.fixture);
      const parsed = parseInc(file);
      assertMetadata(parsed.metadata, entry.expect.metadata, entry.id);
      assertCsv(parsed, entry.expect.csv, entry.id);
    }

    if (entry.action === "validate_schema") {
      const schema = readSchemaFromText(await readFixture(entry.schema_fixture));
      const file = parseInc(await readFixture(entry.target_fixture));
      assert.deepEqual(validateSchema(file, schema), entry.expect, entry.id);
    }
  }
});

test("negative INC specification tests", async () => {
  const schedule = await loadJson(join(specRoot, "tests", "negative.json"));
  for (const entry of schedule.tests) {
    const text = await readFixture(entry.fixture);
    const action = () => {
      if (entry.action === "read") {
        return parseInc(text);
      }
      if (entry.action === "read_schema") {
        return readSchemaFromText(text);
      }
      throw new Error(`Unsupported action ${entry.action}`);
    };

    assert.throws(action, { code: entry.expect_error.error_code }, entry.id);
  }
});

test("roundtrip INC specification tests", async () => {
  const schedule = await loadJson(join(specRoot, "tests", "roundtrip.json"));
  for (const entry of schedule.tests) {
    if (entry.action === "write_read_compare") {
      const text = writeInc({
        metadata: entry.input.metadata,
        columns: entry.input.csv.columns,
        rows: entry.input.csv.rows,
      });
      const expected = await readFixture(entry.expect_canonical_fixture);
      assert.equal(text, expected, entry.id);

      const parsed = parseInc(text);
      assert.deepEqual(parsed.columns, entry.input.csv.columns, entry.id);
      assert.deepEqual(rowsAsMatrix(parsed), entry.input.csv.rows, entry.id);
    }

    if (entry.action === "read_write_compare") {
      const parsed = parseInc(await readFixture(entry.input_fixture));
      const text = writeInc(parsed);
      const expected = await readFixture(entry.expect_canonical_fixture);
      assert.equal(text, expected, entry.id);
    }
  }
});

test("writeInc applies writer-relevant structure metadata", () => {
  const text = writeInc({
    metadata: {
      title: "metadata-driven TSV",
      structure: { delimiter: "tab" },
    },
    columns: ["name", "score"],
    rows: [["Ada", 21], ["Babbage", 12]],
  });

  assert.match(text, /name\tscore/u);
  assert.doesNotMatch(text, /name,score/u);

  const parsed = parseInc(text);
  assert.deepEqual(parsed.columns, ["name", "score"]);
  assert.deepEqual(rowsAsMatrix(parsed), [["Ada", "21"], ["Babbage", "12"]]);
});

test("writeInc rejects explicit CSV options that contradict structure metadata", () => {
  assert.throws(() => writeInc({
    metadata: { structure: { delimiter: "tab" } },
    columns: ["name", "score"],
    rows: [["Ada", 21]],
    csvOptions: { delimiter: "," },
  }), { code: "conflicting_structure_option" });
});

test("schema aliases within a requirement class are merged", () => {
  const schema = readSchemaFromText(`---
[MUST]
title = string
[REQUIRED]
columns.score = number
[OPTIONAL]
notes = string
[MAY]
operator = string
---
title,score
run,1
`);

  assert.deepEqual(schema.must, {
    title: "string",
    "columns.score": "number",
  });
  assert.deepEqual(schema.maybe, {
    notes: "string",
    operator: "string",
  });
});

test("schema aliases reject duplicate paths within a requirement class", () => {
  assert.throws(() => readSchemaFromText(`---
[MUST]
title = string
[REQUIRED]
title = text
---
title
run
`), { code: "duplicate_schema_requirement" });
});

test("schema paths reject empty components", () => {
  assert.throws(() => readSchemaFromText(`---
[MUST]
a. = string
---
a
value
`), { code: "invalid_schema_path" });

  assert.throws(() => readSchemaFromText(`---
[MUST]
.key = string
---
key
value
`), { code: "invalid_schema_path" });
});

async function loadJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function readFixture(relativePath) {
  return readFile(join(specRoot, "tests", relativePath), "utf8");
}

function assertMetadata(actual, expected, label) {
  assert.deepEqual(actual, decodeExpectedMetadata(expected), label);
}

function decodeExpectedMetadata(value) {
  if (value && typeof value === "object" && "type" in value && "value" in value) {
    return value.value;
  }
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [
    key,
    decodeExpectedMetadata(child),
  ]));
}

function assertCsv(actual, expected, label) {
  assert.deepEqual(actual.columns, expected.columns, label);
  assert.deepEqual(rowsAsMatrix(actual), expected.rows, label);
}

function rowsAsMatrix(file) {
  return file.rows.map((row) => file.columns.map((column) => String(row[column] ?? "")));
}
