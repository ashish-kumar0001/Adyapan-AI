import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: any, res) => {
  try {
    const challenges = await prisma.challenge.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ challenges });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch challenges" });
  }
});

router.post("/submit", async (req: any, res) => {
  try {
    const { challengeId, code, language } = req.body;
    if (!challengeId || !code) return res.status(400).json({ error: "Missing required fields" });

    // Mock validation logic
    const status = Math.random() > 0.3 ? "Accepted" : "Failed";
    const score = status === "Accepted" ? 100 : 0;

    const submission = await prisma.challengeSubmission.create({
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
      // Update leaderboard
      await prisma.leaderboard.upsert({
        where: { id: req.user.id }, // Simplification
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
    res.status(500).json({ error: "Failed to submit challenge" });
  }
});

router.get("/leaderboard", async (req, res) => {
  try {
    const leaderboard = await prisma.leaderboard.findMany({
      orderBy: { score: 'desc' },
      take: 10,
      include: { user: { select: { name: true } } }
    });
    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export const challengesRouter = router;
