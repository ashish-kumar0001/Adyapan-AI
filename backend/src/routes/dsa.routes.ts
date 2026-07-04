import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generateDsaHint, reviewDsaSolution } from "../lib/ai/dsa";
import { prisma } from "../config/prisma";

const router = Router();
router.use(requireAuth);

router.get("/problems", async (req: any, res) => {
  try {
    const { category, difficulty, company } = req.query;
    const filter: any = {};
    if (category) filter.category = category as string;
    if (difficulty) filter.difficulty = difficulty as string;
    if (company) filter.companies = { has: company as string };

    const problems = await prisma.problem.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' }
    });
    res.json({ problems });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch problems" });
  }
});

router.post("/hint", async (req, res) => {
  try {
    const { problemContext, currentCode } = req.body;
    if (!problemContext || !currentCode) {
      return res.status(400).json({ error: "Problem context and current code are required" });
    }
    
    const result = await generateDsaHint(problemContext, currentCode);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate hint" });
  }
});

router.post("/submit", async (req: any, res) => {
  try {
    const { problemId, code, language, problemContext } = req.body;
    if (!problemId || !code || !language) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // In a real system, we'd run this code against a sandbox evaluator (like Judge0).
    // For now, we simulate success and run the AI solution reviewer.
    
    const review = await reviewDsaSolution(problemContext || "Unknown problem", code);

    const submission = await prisma.submission.create({
      data: {
        userId: req.user!.userId,
        problemId,
        code,
        language,
        status: "Accepted", // Hardcoded mock
        timeMs: Math.floor(Math.random() * 50) + 10,
        memoryKb: Math.floor(Math.random() * 5000) + 2000,
        aiReview: review,
      }
    });

    // Update Progress
    const progress = await prisma.dSAProgress.upsert({
      where: { id: req.user!.userId }, // Assuming we adjust schema to make userId unique or find first
      create: {
        userId: req.user!.userId,
        solved: 1,
        accuracy: 100,
        streak: 1,
      },
      update: {
        solved: { increment: 1 },
      }
    });

    res.json({ submission, review, progress });
  } catch (error) {
    res.status(500).json({ error: "Failed to submit code" });
  }
});

router.get("/progress", async (req: any, res) => {
  try {
    let progress = await prisma.dSAProgress.findFirst({
      where: { userId: req.user!.userId }
    });
    
    if (!progress) {
      progress = await prisma.dSAProgress.create({
        data: { userId: req.user!.userId }
      });
    }
    
    res.json({ progress });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch progress" });
  }
});

export const dsaRouter = router;
