import { httpError } from "./httpError";

export function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw httpError(400, `${field} is required`);
  }

  return value.trim();
}
