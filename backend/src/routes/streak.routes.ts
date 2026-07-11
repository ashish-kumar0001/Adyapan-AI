import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getDashboard,
  updateStreak,
  getAchievements,
  getHeatmap,
  getInsights,
} from "../controllers/streak.controller";

export const streakRouter = Router();

streakRouter.use(requireAuth);

streakRouter.get("/dashboard", getDashboard);
streakRouter.post("/update", updateStreak);
streakRouter.get("/achievements", getAchievements);
streakRouter.get("/heatmap", getHeatmap);
streakRouter.get("/insights", getInsights);
