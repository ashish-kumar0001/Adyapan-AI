import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  analyzeWeakTopics,
  getDashboard,
  getRevisionQueue,
  getWeakConcepts,
  getRecommendations,
  getExamRisk,
  getInterviewRisk,
  updateRevisionStatus,
} from "../controllers/weak-topics.controller";

export const weakTopicsRouter = Router();

weakTopicsRouter.use(requireAuth);

// POST  /api/weak-topics/analyze — trigger full re-analysis
weakTopicsRouter.post("/analyze", analyzeWeakTopics);

// GET   /api/weak-topics/dashboard — full dashboard payload
weakTopicsRouter.get("/dashboard", getDashboard);

// GET   /api/weak-topics/revision-queue
weakTopicsRouter.get("/revision-queue", getRevisionQueue);

// GET   /api/weak-topics/concepts
weakTopicsRouter.get("/concepts", getWeakConcepts);

// GET   /api/weak-topics/recommendations
weakTopicsRouter.get("/recommendations", getRecommendations);

// GET   /api/weak-topics/exam-risk
weakTopicsRouter.get("/exam-risk", getExamRisk);

// GET   /api/weak-topics/interview-risk
weakTopicsRouter.get("/interview-risk", getInterviewRisk);

// PATCH /api/weak-topics/revision-status — mark revision done/skipped
weakTopicsRouter.patch("/revision-status", updateRevisionStatus);
