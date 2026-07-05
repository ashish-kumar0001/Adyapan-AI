import { Router } from "express";
import {
  createResume,
  listResumes,
  getResume,
  updateResume,
  deleteResume,
  generateSummary,
  exportResumePdf,
  exportResumeDocx,
  enhanceProject,
  enhanceExperience,
  optimizeResume,
  resumeChat,
} from "../controllers/resume.controller";
import { analyzeSWOT, matchJob } from "../controllers/resume-analyzer.controller";
import { requireAuth } from "../middleware/auth";

export const resumeRouter = Router();

resumeRouter.post("/create", requireAuth, createResume);
resumeRouter.get("/list", requireAuth, listResumes);
resumeRouter.get("/:id", requireAuth, getResume);
resumeRouter.put("/update/:id", requireAuth, updateResume);
resumeRouter.delete("/delete/:id", requireAuth, deleteResume);
resumeRouter.post("/generate-summary", requireAuth, generateSummary);
resumeRouter.post("/export-pdf", requireAuth, exportResumePdf);
resumeRouter.post("/export-docx", requireAuth, exportResumeDocx);
resumeRouter.post("/enhance-project", requireAuth, enhanceProject);
resumeRouter.post("/enhance-experience", requireAuth, enhanceExperience);
resumeRouter.post("/optimize-resume", requireAuth, optimizeResume);
resumeRouter.post("/ai-chat", requireAuth, resumeChat);
resumeRouter.post("/analyze", requireAuth, analyzeSWOT);
resumeRouter.post("/job-match", requireAuth, matchJob);
