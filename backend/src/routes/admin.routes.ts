import { Router } from "express";
import { getAdminOverview } from "../controllers/admin.controller";
import { requireAuth, requireRole } from "../middleware/auth";

export const adminRouter = Router();

adminRouter.get("/overview", requireAuth, requireRole("ADMIN"), getAdminOverview);
