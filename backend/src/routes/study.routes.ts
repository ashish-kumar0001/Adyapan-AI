import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generateStudyResponse } from "../lib/ai/gemini";
import { prisma } from "../config/prisma";
export const studyRouter = Router();

studyRouter.use(requireAuth);

studyRouter.post("/upload", async (req, res) => {
  try {
    // Dummy upload handler for now
    const { fileName, fileType, fileUrl } = req.body;
    const doc = await prisma.uploadedDocument.create({
      data: {
        userId: req.user!.userId,
        fileName,
        fileType,
        fileUrl,
      },
    });
    res.json({ success: true, doc });
  } catch (error) {
    res.status(500).json({ error: "Failed to upload document" });
  }
});

studyRouter.post("/chat", async (req, res) => {
  try {
    const { query, context } = req.body;
    const responseText = await generateStudyResponse(context || "", query);
    res.json({ success: true, response: responseText });
  } catch (error) {
    res.status(500).json({ error: "Chat processing failed" });
  }
});

studyRouter.get("/history", async (req, res) => {
  try {
    const sessions = await prisma.studySession.findMany({
      where: { userId: req.user!.userId },
      include: { messages: true },
    });
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});
