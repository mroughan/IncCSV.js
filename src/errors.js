export class IncError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "IncError";
    this.code = code;
  }
}

export function fail(message, code) {
  throw new IncError(message, code);
}
