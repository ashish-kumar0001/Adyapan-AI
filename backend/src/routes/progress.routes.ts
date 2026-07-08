import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  calculateProgress,
  getProgressDashboard,
  getTopicProgress,
  getConceptMastery,
  getMilestones,
  getProgressRecommendations,
  getTimeline,
  getRevisionQueue,
  getKnowledgeGrowth,
  getStudySessions,
} from "../controllers/progress.controller";

export const progressRouter = Router();

// Secure all progress routes
progressRouter.use(requireAuth);

progressRouter.post("/calculate", calculateProgress);
progressRouter.get("/dashboard", getProgressDashboard);
progressRouter.get("/topics", getTopicProgress);
progressRouter.get("/concepts", getConceptMastery);
progressRouter.get("/milestones", getMilestones);
progressRouter.get("/recommendations", getProgressRecommendations);
progressRouter.get("/timeline", getTimeline);
progressRouter.get("/revision-queue", getRevisionQueue);
progressRouter.get("/knowledge-growth", getKnowledgeGrowth);
progressRouter.get("/study-sessions", getStudySessions);
