import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getLearningDashboard } from "../controllers/dashboard.controller";

export const dashboardRouter = Router();

// Secure all learning dashboard endpoints
dashboardRouter.use(requireAuth);

// GET /api/dashboard/learning -> aggregated command center stats
dashboardRouter.get("/learning", getLearningDashboard);
