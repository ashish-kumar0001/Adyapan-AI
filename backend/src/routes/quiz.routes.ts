import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generateQuiz } from "../lib/ai/gemini";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const quizRouter = Router();

quizRouter.use(requireAuth);

quizRouter.post("/generate", async (req, res) => {
  try {
    const { topic, count, difficulty } = req.body;
    const result = await generateQuiz(topic, count, difficulty);
    
    const quiz = await prisma.quiz.create({
      data: {
        userId: req.user!.userId,
        topic,
        difficulty,
        questions: result.questions as any,
      },
    });
    
    // Save flashcards
    for (const fc of result.flashcards) {
      await prisma.flashcard.create({
        data: {
          userId: req.user!.userId,
          quizId: quiz.id,
          topic,
          front: fc.front,
          back: fc.back,
        },
      });
    }

    res.json({ success: true, quiz, flashcards: result.flashcards });
  } catch (error) {
    res.status(500).json({ error: "Quiz generation failed" });
  }
});

quizRouter.get("/history", async (req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: { userId: req.user!.userId },
      include: { attempts: true, flashcards: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, quizzes });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});
