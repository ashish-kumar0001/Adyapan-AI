import type { NextFunction, Request, Response } from "express";
import { loginUser, registerUser } from "../services/auth.service";
import { requireString } from "../utils/request";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await registerUser({
      name: requireString(req.body.name, "name"),
      email: requireString(req.body.email, "email"),
      password: requireString(req.body.password, "password"),
      role: typeof req.body.role === "string" ? req.body.role : undefined,
    });

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await loginUser({
      email: requireString(req.body.email, "email"),
      password: requireString(req.body.password, "password"),
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export function me(req: Request, res: Response) {
  res.json({
    success: true,
    user: req.user,
  });
}

export function logout(_req: Request, res: Response) {
  res.json({
    success: true,
    message: "Logged out",
  });
}

export function forgotPassword(_req: Request, res: Response) {
  res.status(202).json({
    success: true,
    message: "Password reset flow accepted",
  });
}
