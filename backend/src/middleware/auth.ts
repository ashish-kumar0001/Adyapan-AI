import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { httpError } from "../utils/httpError";

export type AuthRole = "USER" | "ADMIN";

export type AuthUser = {
  userId: string;
  email: string;
  role: AuthRole;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    next(httpError(401, "Authentication token is required"));
    return;
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret) as AuthUser;
    next();
  } catch {
    next(httpError(401, "Invalid or expired authentication token"));
  }
}

export function requireRole(role: AuthRole) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(httpError(401, "Authentication token is required"));
      return;
    }

    if (req.user.role !== role) {
      next(httpError(403, "You do not have permission to access this resource"));
      return;
    }

    next();
  };
}
