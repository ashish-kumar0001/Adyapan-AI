import { Router } from "express";
import multer from "multer";
import {
  generateCoverLetter,
  chatCoverLetter,
  saveCoverLetter,
  listCoverLetters,
  getCoverLetter,
  deleteCoverLetter,
} from "../controllers/cover-letter.controller";
import { requireAuth } from "../middleware/auth";

export const coverLetterRouter = Router();

const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

coverLetterRouter.post("/generate", requireAuth, generateCoverLetter);
coverLetterRouter.post("/chat", requireAuth, chatCoverLetter);
coverLetterRouter.post("/save", requireAuth, saveCoverLetter);
coverLetterRouter.get("/history", requireAuth, listCoverLetters);
coverLetterRouter.get("/:id", requireAuth, getCoverLetter);
coverLetterRouter.delete("/:id", requireAuth, deleteCoverLetter);
