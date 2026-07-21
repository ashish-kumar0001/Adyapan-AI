import { Router } from "express";
import {
  generateRoadmap,
  getLatestRoadmap,
  listRoadmaps,
  getRoadmapById,
  updateTask,
  deleteRoadmap,
} from "../controllers/career.controller";
import { getCareerDashboard } from "../controllers/career-dashboard.controller";
import { requireAuth } from "../middleware/auth";

export const careerRouter = Router();

careerRouter.get("/dashboard", requireAuth, getCareerDashboard);
careerRouter.post("/generate", requireAuth, generateRoadmap);
careerRouter.get("/latest", requireAuth, getLatestRoadmap);
careerRouter.get("/history", requireAuth, listRoadmaps);
careerRouter.post("/update-task", requireAuth, updateTask);
careerRouter.get("/:id", requireAuth, getRoadmapById);
careerRouter.delete("/:id", requireAuth, deleteRoadmap);
