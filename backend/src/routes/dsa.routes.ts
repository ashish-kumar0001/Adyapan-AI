import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generateDsaHint, reviewDsaSolution } from "../lib/ai/dsa";
import { getUserPrismaFromRequest } from "../utils/prisma";

const router = Router();
router.use(requireAuth);

router.get("/problems", async (req: any, res) => {
  try {
    const { category, difficulty, company } = req.query;
    const filter: any = {};
    if (category) filter.category = category as string;
    if (difficulty) filter.difficulty = difficulty as string;
    if (company) filter.companies = { has: company as string };

    const userPrisma = await getUserPrismaFromRequest(req);
    const problems = await userPrisma.problem.findMany({
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

    const userPrisma = await getUserPrismaFromRequest(req);
    
    const review = await reviewDsaSolution(problemContext || "Unknown problem", code);

    const submission = await userPrisma.submission.create({
      data: {
        userId: req.user!.userId,
        problemId,
        code,
        language,
        status: "Accepted",
        timeMs: Math.floor(Math.random() * 50) + 10,
        memoryKb: Math.floor(Math.random() * 5000) + 2000,
        aiReview: review,
      }
    });

    const progress = await userPrisma.dSAProgress.upsert({
      where: { id: req.user!.userId },
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
    const userPrisma = await getUserPrismaFromRequest(req);
    let progress = await userPrisma.dSAProgress.findFirst({
      where: { userId: req.user!.userId }
    });
    
    if (!progress) {
      progress = await userPrisma.dSAProgress.create({
        data: { userId: req.user!.userId }
      });
    }
    
    res.json({ progress });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch progress" });
  }
});

export const dsaRouter = router;
