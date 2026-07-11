import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generateFlashcards } from "../lib/ai/gemini";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { StreakService } from "../services/streak.service";
import { handleRouteError } from "../utils/routeError";
import { getTimezone } from "../utils/request";

export const flashcardsRouter = Router();

flashcardsRouter.use(requireAuth);

flashcardsRouter.post("/generate", async (req, res) => {
  try {
    const { topic, mode, cardCount } = req.body;
    const result = await generateFlashcards(topic, mode || "intermediate", cardCount || 5);
    const userPrisma = await getUserPrismaFromRequest(req);

    // Track Streak Activity
    StreakService.trackActivity(
      req.user!.userId,
      "CREATE_FLASHCARDS",
      "flashcards_generator",
      null,
      15, // 15 points
      getTimezone(req),
      userPrisma
    ).catch(err => console.error("Streak tracking error:", err));

    res.json({ success: true, data: result });
  } catch (error) {
    handleRouteError(res, error, "Flashcards.generate", "Flashcard generation failed");
  }
});
