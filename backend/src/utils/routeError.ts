import type { Response } from "express";
import type { HttpError } from "./httpError";

/**
 * Consistent error handling for route handlers that respond directly instead of
 * delegating to the central `errorHandler` middleware.
 *
 * It fixes two long-standing problems with the ad-hoc `catch` blocks that used
 * to live in the route files:
 *   1. The caught error was discarded, so failures were swallowed silently and
 *      were impossible to debug. It is now always logged server-side.
 *   2. Every failure was reported as a generic HTTP 500, masking client errors
 *      such as validation (400), auth (401) or rate-limit (429) failures that
 *      are thrown as `httpError`s further down the stack. The original status
 *      code and message are now propagated to the client.
 */
export function handleRouteError(
  res: Response,
  error: unknown,
  context: string,
  fallbackMessage: string
): void {
  const httpErr = error as Partial<HttpError> & { status?: number };
  const statusCode = httpErr?.statusCode ?? httpErr?.status ?? 500;

  console.error(`[${context}] request failed (${statusCode}):`, error);

  // For client errors, surface the real message so the caller can act on it.
  // For unexpected server errors, keep the caller-facing message generic and
  // rely on the server-side log above for the details.
  const message =
    statusCode < 500 && error instanceof Error ? error.message : fallbackMessage;

  res.status(statusCode).json({ success: false, error: message });
}
