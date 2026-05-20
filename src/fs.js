import { readFile, writeFile } from "node:fs/promises";
import { parseInc } from "./parser.js";
import { writeInc } from "./writer.js";
import { readSchemaFromText } from "./schema.js";

export async function readInc(path, options = {}) {
  const text = await readFile(path, "utf8");
  return parseInc(text, options);
}

export async function writeIncFile(path, incFile) {
  await writeFile(path, writeInc(incFile), "utf8");
}

export async function readSchema(path) {
  const text = await readFile(path, "utf8");
  return readSchemaFromText(text);
}
