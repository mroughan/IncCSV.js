import { fail } from "./errors.js";

export function assertName(name) {
  if (name === "" || /[\s[\]=#;]/u.test(name)) {
    fail(`Invalid metadata name ${name}.`, "invalid_name");
  }
}

export function isSection(value) {
  return value
    && typeof value === "object"
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}
