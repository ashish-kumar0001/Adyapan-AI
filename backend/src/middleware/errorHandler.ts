import type { NextFunction, Request, Response } from "express";
import type { HttpError } from "../utils/httpError";
import { env } from "../config/env";

export function errorHandler(error: HttpError, req: Request, res: Response, _next: NextFunction) {
  const statusCode = error.statusCode ?? 500;

  // Never let a server-side failure disappear silently. Client errors (4xx)
  // are expected and only logged as warnings; unexpected 5xx errors are logged
  // with a full stack trace so they can be diagnosed.
  if (statusCode >= 500) {
    console.error(`[errorHandler] ${req.method} ${req.originalUrl} -> ${statusCode}:`, error);
  } else {
    console.warn(`[errorHandler] ${req.method} ${req.originalUrl} -> ${statusCode}: ${error.message}`);
  }

  const message =
    statusCode === 500 && env.nodeEnv === "production"
      ? "Internal server error"
      : error.message;

  res.status(statusCode).json({
    success: false,
    message,
    // `error` mirrors `message` for backward compatibility with clients that
    // read `response.data.error`.
    error: message,
  });
}
