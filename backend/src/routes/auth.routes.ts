import { Router } from "express";
import { forgotPassword, login, logout, me, register } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/logout", requireAuth, logout);
authRouter.get("/me", requireAuth, me);
