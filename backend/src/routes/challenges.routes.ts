import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { handleRouteError } from "../utils/routeError";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: any, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const challenges = await userPrisma.challenge.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ challenges });
  } catch (error) {
    handleRouteError(res, error, "Challenges.list", "Failed to fetch challenges");
  }
});

router.post("/submit", async (req: any, res) => {
  try {
    const { challengeId, code, language } = req.body;
    if (!challengeId || !code) return res.status(400).json({ error: "Missing required fields" });

    const userPrisma = await getUserPrismaFromRequest(req);

    const status = Math.random() > 0.3 ? "Accepted" : "Failed";
    const score = status === "Accepted" ? 100 : 0;

    const submission = await userPrisma.challengeSubmission.create({
      data: {
        userId: req.user.id,
        challengeId,
        code,
        language: language || "javascript",
        status,
        score
      }
    });

    if (status === "Accepted") {
      await userPrisma.leaderboard.upsert({
        where: { id: req.user.id },
        create: {
          userId: req.user.id,
          score: score,
        },
        update: {
          score: { increment: score }
        }
      });
    }

    res.json({ submission });
  } catch (error) {
    handleRouteError(res, error, "Challenges.submit", "Failed to submit challenge");
  }
});

router.get("/leaderboard", async (req, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const leaderboard = await userPrisma.leaderboard.findMany({
      orderBy: { score: 'desc' },
      take: 10,
    });
    res.json({ leaderboard });
  } catch (error) {
    handleRouteError(res, error, "Challenges.leaderboard", "Failed to fetch leaderboard");
  }
});

export const challengesRouter = router;
