import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  suggestTopics,
  fetchSources,
  generatePaperSSE,
  generatePaperSync,
  generateSectionHandler,
  chatWithAI,
  getPaper,
  exportPdf,
  exportDocx,
  exportLatex,
  exportBibtex,
  checkPlagiarism,
  rephraseText,
} from "../controllers/research.controller";

export const researchRouter = Router();

researchRouter.use(requireAuth);

// Topic suggestions
researchRouter.post("/suggest-topics", suggestTopics);

// Source fetching
researchRouter.post("/fetch-sources", fetchSources);

// Paper generation (SSE streaming with real-time progress)
researchRouter.post("/generate-paper", generatePaperSSE);

// Paper generation (non-streaming fallback)
researchRouter.post("/generate-paper-sync", generatePaperSync);

// Individual section generation
researchRouter.post("/generate-section", generateSectionHandler);

// AI chat
researchRouter.post("/chat", chatWithAI);

// Retrieve stored paper
researchRouter.get("/paper/:id", getPaper);

// Export endpoints
researchRouter.post("/export/pdf", exportPdf);
researchRouter.post("/export/docx", exportDocx);
researchRouter.post("/export/latex", exportLatex);
researchRouter.post("/export/bibtex", exportBibtex);

// Legacy plagiarism + rephrase
researchRouter.post("/check-plagiarism", checkPlagiarism);
researchRouter.post("/rephrase", rephraseText);
