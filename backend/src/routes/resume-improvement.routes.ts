import { Router } from "express";
import {
  generateImprovements,
  applySingleImprovement,
  applyAllImprovements,
  getImprovementHistory,
  getVersionHistory,
  restoreVersion,
  compareVersions,
} from "../controllers/resume-improvement.controller";
import { requireAuth } from "../middleware/auth";

export const resumeImprovementRouter = Router();

resumeImprovementRouter.post("/generate", requireAuth, generateImprovements);
resumeImprovementRouter.post("/apply", requireAuth, applySingleImprovement);
resumeImprovementRouter.post("/apply-all", requireAuth, applyAllImprovements);
resumeImprovementRouter.get("/history", requireAuth, getImprovementHistory);
resumeImprovementRouter.get("/versions", requireAuth, getVersionHistory);
resumeImprovementRouter.post("/restore", requireAuth, restoreVersion);
resumeImprovementRouter.post("/compare", requireAuth, compareVersions);
