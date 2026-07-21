import { Router } from "express";
import {
  generateRoadmap,
  getLatestRoadmap,
  listRoadmaps,
  getRoadmapById,
  updateTask,
  deleteRoadmap,
} from "../controllers/career.controller";
import { requireAuth } from "../middleware/auth";

export const careerRouter = Router();

careerRouter.post("/generate", requireAuth, generateRoadmap);
careerRouter.get("/latest", requireAuth, getLatestRoadmap);
careerRouter.get("/history", requireAuth, listRoadmaps);
careerRouter.post("/update-task", requireAuth, updateTask);
careerRouter.get("/:id", requireAuth, getRoadmapById);
careerRouter.delete("/:id", requireAuth, deleteRoadmap);
