import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generateNotes } from "../lib/ai/gemini";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { StreakService } from "../services/streak.service";

export const notesRouter = Router();

notesRouter.use(requireAuth);

notesRouter.post("/generate", async (req, res) => {
  try {
    const { topic, difficulty, type } = req.body;
    const content = await generateNotes(topic, difficulty, type);
    const userPrisma = await getUserPrismaFromRequest(req);
    
    const note = await userPrisma.generatedNote.create({
      data: {
        userId: req.user!.userId,
        topic,
        difficulty,
        type,
        content,
      },
    });

    // Track Streak Activity
    StreakService.trackActivity(
      req.user!.userId,
      "GENERATE_NOTES",
      "notes_generator",
      note.id,
      15, // 15 points
      (req.headers["x-timezone"] as string) || "UTC",
      userPrisma
    ).catch(err => console.error("Streak tracking error:", err));

    res.json({ success: true, note });
  } catch (error) {
    res.status(500).json({ error: "Note generation failed" });
  }
});

notesRouter.get("/history", async (req, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const notes = await userPrisma.generatedNote.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, notes });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});
