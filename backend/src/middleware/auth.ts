import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { httpError } from "../utils/httpError";
import { isTokenBlacklisted } from "../services/auth.service";

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

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    next(httpError(401, "Authentication token is required"));
    return;
  }

  try {
    // Check if token is blacklisted
    if (await isTokenBlacklisted(token)) {
      throw new Error("Token is blacklisted");
    }

    req.user = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] }) as AuthUser;
    next();
  } catch (err) {
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

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Content-Security-Policy", "default-src 'self'");
  next();
}
