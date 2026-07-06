import type { NextFunction, Request, Response } from "express";
import type { HttpError } from "../utils/httpError";
import { env } from "../config/env";

export function errorHandler(error: HttpError, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = error.statusCode ?? 500;
  const message =
    statusCode === 500 && env.nodeEnv === "production"
      ? "Internal server error"
      : error.message;

  res.status(statusCode).json({
    success: false,
    message,
  });
}
