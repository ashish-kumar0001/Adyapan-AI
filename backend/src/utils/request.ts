import type { Request } from "express";
import { httpError } from "./httpError";

export function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw httpError(400, `${field} is required`);
  }

  return value.trim();
}

/**
 * Returns the authenticated user's id, throwing a 401 HttpError when the
 * request has not been authenticated.
 */
export function requireUserId(req: Request): string {
  const userId = req.user?.userId;
  if (!userId) throw httpError(401, "Unauthorized");
  return userId;
}

/**
 * Reads the client's timezone from the `x-timezone` header, defaulting to
 * "UTC" when the header is absent.
 */
export function getTimezone(req: Request): string {
  return (req.headers["x-timezone"] as string) || "UTC";
}
