import type { NextFunction, Request, Response } from "express";
import type { HttpError } from "../utils/httpError";

export function errorHandler(error: HttpError, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = error.statusCode ?? 500;
  const message = statusCode === 500 ? "Internal server error" : error.message;

  res.status(statusCode).json({
    success: false,
    message,
  });
}
