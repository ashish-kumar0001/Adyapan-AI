import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generateDsaHint, reviewDsaSolution } from "../lib/ai/dsa";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { StreakService } from "../services/streak.service";
import { handleRouteError } from "../utils/routeError";
import { getTimezone } from "../utils/request";

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
    handleRouteError(res, error, "Dsa.problems", "Failed to fetch problems");
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
    handleRouteError(res, error, "Dsa.hint", "Failed to generate hint");
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

    // Track Streak Activity
    StreakService.trackActivity(
      req.user!.userId,
      "PRACTICE_QUESTIONS",
      "dsa_practice",
      submission.id,
      25, // 25 points
      getTimezone(req),
      userPrisma
    ).catch(err => console.error("Streak tracking error:", err));

    res.json({ submission, review, progress });
  } catch (error) {
    handleRouteError(res, error, "Dsa.submit", "Failed to submit code");
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
    handleRouteError(res, error, "Dsa.progress", "Failed to fetch progress");
  }
});

export const dsaRouter = router;
