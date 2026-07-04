import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generateNotes } from "../lib/ai/gemini";
import { prisma } from "../config/prisma";
export const notesRouter = Router();

notesRouter.use(requireAuth);

notesRouter.post("/generate", async (req, res) => {
  try {
    const { topic, difficulty, type } = req.body;
    const content = await generateNotes(topic, difficulty, type);
    
    const note = await prisma.generatedNote.create({
      data: {
        userId: req.user!.userId,
        topic,
        difficulty,
        type,
        content,
      },
    });
    res.json({ success: true, note });
  } catch (error) {
    res.status(500).json({ error: "Note generation failed" });
  }
});

notesRouter.get("/history", async (req, res) => {
  try {
    const notes = await prisma.generatedNote.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, notes });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});
