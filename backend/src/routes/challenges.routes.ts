import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { handleRouteError } from "../utils/routeError";

const router = Router();
router.use(requireAuth);

// ─── Categories ─────────────────────────────────────────────────────────────

router.get("/categories", async (req: any, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const categories = await userPrisma.challengeCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        challenges: {
          select: { id: true, difficulty: true },
        },
      },
    });

    const userId = req.user?.userId || req.user?.id;

    const result = await Promise.all(
      categories.map(async (cat) => {
        const total = cat.challenges.length;
        const easy = cat.challenges.filter((c) => c.difficulty === "Easy").length;
        const medium = cat.challenges.filter((c) => c.difficulty === "Medium").length;
        const hard = cat.challenges.filter((c) => c.difficulty === "Hard").length;

        let solved = 0;
        if (userId && total > 0) {
          const challengeIds = cat.challenges.map((c) => c.id);
          const progress = await userPrisma.userQuestionProgress.findMany({
            where: { userId, solved: true, questionId: { in: challengeIds } },
          });
          solved = progress.length;
        }

        const difficultyRange = hard > 0 ? (medium > 0 ? "Easy → Hard" : "Easy → Hard") : medium > 0 ? "Easy → Medium" : "Easy";

        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          gradient: cat.gradient,
          color: cat.color,
          challengeCount: total,
          difficultyRange,
          breakdown: { easy, medium, hard },
          solved,
          progress: total > 0 ? Math.round((solved / total) * 100) : 0,
          popularity: total * 12 + Math.floor(Math.random() * 50),
        };
      })
    );

    res.json({ categories: result });
  } catch (error) {
    handleRouteError(res, error, "Challenges.categories", "Failed to fetch categories");
  }
});

// ─── Challenges by Category ─────────────────────────────────────────────────

router.get("/categories/:slug", async (req: any, res) => {
  try {
    const { slug } = req.params;
    const { difficulty, status, search, sort } = req.query;
    const userId = req.user?.userId || req.user?.id;

    const userPrisma = await getUserPrismaFromRequest(req);

    const category = await userPrisma.challengeCategory.findUnique({
      where: { slug },
    });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const where: Record<string, unknown> = { categoryId: category.id };
    if (difficulty && difficulty !== "All") {
      where.difficulty = difficulty;
    }
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const orderBy: Record<string, string> =
      sort === "points" ? { points: "desc" } :
      sort === "difficulty" ? { difficulty: "asc" } :
      { createdAt: "desc" };

    const challenges = await userPrisma.challenge.findMany({
      where,
      orderBy,
      select: {
        id: true,
        slug: true,
        title: true,
        difficulty: true,
        points: true,
        topics: true,
        createdAt: true,
      },
    });

    let progressMap: Record<string, { solved: boolean; attempted: boolean; timeSpent: number }> = {};
    if (userId) {
      const challengeIds = challenges.map((c) => c.id);
      const progress = await userPrisma.userQuestionProgress.findMany({
        where: { userId, questionId: { in: challengeIds } },
        select: { questionId: true, solved: true, attempted: true, timeSpent: true },
      });
      for (const p of progress) {
        progressMap[p.questionId] = {
          solved: p.solved,
          attempted: p.attempted,
          timeSpent: p.timeSpent,
        };
      }
    }

    const enriched = challenges.map((ch) => {
      const prog = progressMap[ch.id];
      const userStatus = prog?.solved ? "solved" : prog?.attempted ? "attempted" : "unsolved";
      return {
        ...ch,
        userStatus,
        timeSpent: prog?.timeSpent || 0,
      };
    });

    const filtered =
      status && status !== "All"
        ? enriched.filter((ch) => ch.userStatus === (status as string).toLowerCase())
        : enriched;

    const totalSolved = enriched.filter((ch) => ch.userStatus === "solved").length;
    const totalAttempted = enriched.filter((ch) => ch.userStatus === "attempted").length;

    res.json({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        gradient: category.gradient,
        color: category.color,
      },
      challenges: filtered,
      stats: {
        total: enriched.length,
        solved: totalSolved,
        attempted: totalAttempted,
        unsolved: enriched.length - totalSolved - totalAttempted,
      },
    });
  } catch (error) {
    handleRouteError(res, error, "Challenges.byCategory", "Failed to fetch challenges");
  }
});

// ─── Single Challenge Detail ────────────────────────────────────────────────

router.get("/:slug", async (req: any, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user?.userId || req.user?.id;
    const userPrisma = await getUserPrismaFromRequest(req);

    const challenge = await userPrisma.challenge.findUnique({
      where: { slug },
      include: { category: true },
    });
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    let userProgress = null;
    if (userId) {
      userProgress = await userPrisma.userQuestionProgress.findUnique({
        where: { userId_questionId: { userId, questionId: challenge.id } },
      });
    }

    const recentSubmissions = await userPrisma.challengeSubmission.findMany({
      where: { challengeId: challenge.id, userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, status: true, score: true, language: true, createdAt: true },
    });

    res.json({
      challenge: {
        ...challenge,
        category: undefined,
        categorySlug: challenge.category?.slug,
        categoryName: challenge.category?.name,
      },
      userProgress,
      recentSubmissions,
    });
  } catch (error) {
    handleRouteError(res, error, "Challenges.detail", "Failed to fetch challenge");
  }
});

// ─── Submit Challenge ───────────────────────────────────────────────────────

router.post("/submit", async (req: any, res) => {
  try {
    const { challengeId, code, language } = req.body;
    if (!challengeId || !code) return res.status(400).json({ error: "Missing required fields" });

    const userPrisma = await getUserPrismaFromRequest(req);

    const challenge = await userPrisma.challenge.findUnique({ where: { id: challengeId } });
    const status = Math.random() > 0.3 ? "Accepted" : "Failed";
    const score = status === "Accepted" ? (challenge?.points || 100) : 0;

    const submission = await userPrisma.challengeSubmission.create({
      data: {
        userId: req.user.id,
        challengeId,
        code,
        language: language || "javascript",
        status,
        score,
      },
    });

    if (status === "Accepted") {
      await userPrisma.leaderboard.upsert({
        where: { id: req.user.id },
        create: { userId: req.user.id, score },
        update: { score: { increment: score } },
      });
    }

    res.json({ submission });
  } catch (error) {
    handleRouteError(res, error, "Challenges.submit", "Failed to submit challenge");
  }
});

// ─── Leaderboard ────────────────────────────────────────────────────────────

router.get("/leaderboard/top", async (_req, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(_req);
    const leaderboard = await userPrisma.leaderboard.findMany({
      orderBy: { score: "desc" },
      take: 10,
    });
    res.json({ leaderboard });
  } catch (error) {
    handleRouteError(res, error, "Challenges.leaderboard", "Failed to fetch leaderboard");
  }
});

export const challengesRouter = router;
