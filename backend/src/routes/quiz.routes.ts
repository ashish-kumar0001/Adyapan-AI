import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generateEnhancedQuiz, generateQuiz } from "../lib/ai/gemini";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { StreakService } from "../services/streak.service";
import { getTimezone } from "../utils/request";

export const quizRouter = Router();

quizRouter.use(requireAuth);

quizRouter.post("/generate", async (req, res) => {
  try {
    const { topic, mode, duration } = req.body;
    const userPrisma = await getUserPrismaFromRequest(req);
    
    if (mode && ["beginner", "intermediate", "interview", "revision"].includes(mode)) {
      const result = await generateEnhancedQuiz(topic, mode, duration || "10m");
      const quiz = await userPrisma.quiz.create({
        data: {
          userId: req.user!.userId,
          topic,
          difficulty: result.difficulty || mode,
          questions: result.questions as any,
        },
      });

      // Track Streak Activity
      StreakService.trackActivity(
        req.user!.userId,
        "GENERATE_QUESTIONS",
        "quiz_generator",
        quiz.id,
        20, // 20 points
        getTimezone(req),
        userPrisma
      ).catch(err => console.error("Streak tracking error:", err));

      res.json({ success: true, quiz: result, id: quiz.id });
    } else {
      const result = await generateQuiz(topic, 5, "medium");
      const quiz = await userPrisma.quiz.create({
        data: {
          userId: req.user!.userId,
          topic,
          difficulty: "medium",
          questions: result.questions as any,
        },
      });
      for (const fc of result.flashcards) {
        await userPrisma.flashcard.create({
          data: { userId: req.user!.userId, quizId: quiz.id, topic, front: fc.front, back: fc.back },
        });
      }

      // Track Streak Activity
      StreakService.trackActivity(
        req.user!.userId,
        "GENERATE_QUESTIONS",
        "quiz_generator",
        quiz.id,
        20, // 20 points
        getTimezone(req),
        userPrisma
      ).catch(err => console.error("Streak tracking error:", err));

      res.json({ success: true, quiz: { questions: result.questions }, flashcards: result.flashcards });
    }
  } catch (error) {
    res.status(500).json({ error: "Quiz generation failed" });
  }
});

quizRouter.get("/history", async (req, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const quizzes = await userPrisma.quiz.findMany({
      where: { userId: req.user!.userId },
      include: { attempts: true, flashcards: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, quizzes });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});
