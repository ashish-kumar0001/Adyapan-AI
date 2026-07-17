import type { Request, Response } from "express";
import { ProgressService } from "../services/progress.service";
import { getUserPrismaFromRequest } from "../utils/prisma";

// POST /api/progress/calculate
export async function calculateProgress(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const payload = await ProgressService.calculateProgress(userId, userPrisma);
    res.json({ success: true, data: payload });
  } catch (error) {
    console.error("calculateProgress error:", error);
    const msg = error instanceof Error ? error.message : "Failed to calculate progress";
    res.status(500).json({ success: false, error: msg });
  }
}

// GET /api/progress/dashboard
export async function getProgressDashboard(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const payload = await ProgressService.getDashboard(userId, userPrisma);
    res.json({ success: true, data: payload });
  } catch (error) {
    console.error("getProgressDashboard error:", error);
    const msg = error instanceof Error ? error.message : "Failed to fetch progress dashboard";
    res.status(500).json({ success: false, error: msg });
  }
}

// GET /api/progress/topics
export async function getTopicProgress(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const topics = await userPrisma.topicProgress.findMany({
      where: { userId },
      orderBy: { progressPercentage: "desc" },
    });
    res.json({ success: true, topics });
  } catch (error) {
    console.error("getTopicProgress error:", error);
    const msg = error instanceof Error ? error.message : "Failed to fetch topic progress";
    res.status(500).json({ success: false, error: msg });
  }
}

// GET /api/progress/concepts
export async function getConceptMastery(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const concepts = await userPrisma.conceptMastery.findMany({
      where: { userId },
      orderBy: { masteryScore: "desc" },
    });
    res.json({ success: true, concepts });
  } catch (error) {
    console.error("getConceptMastery error:", error);
    const msg = error instanceof Error ? error.message : "Failed to fetch concept mastery";
    res.status(500).json({ success: false, error: msg });
  }
}

// GET /api/progress/milestones
export async function getMilestones(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const progress = await userPrisma.progressTracking.findUnique({ where: { userId } });
    res.json({
      success: true,
      milestones: (progress?.milestonesJson as any[]) || [],
    });
  } catch (error) {
    console.error("getMilestones error:", error);
    const msg = error instanceof Error ? error.message : "Failed to fetch milestones";
    res.status(500).json({ success: false, error: msg });
  }
}

// GET /api/progress/recommendations
export async function getProgressRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const payload = await ProgressService.calculateProgress(userId, userPrisma);
    res.json({ success: true, recommendations: payload.recommendations, insights: payload.insights });
  } catch (error) {
    console.error("getProgressRecommendations error:", error);
    const msg = error instanceof Error ? error.message : "Failed to fetch recommendations";
    res.status(500).json({ success: false, error: msg });
  }
}

// GET /api/progress/timeline
export async function getTimeline(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const progress = await userPrisma.progressTracking.findUnique({ where: { userId } });
    res.json({
      success: true,
      timeline: (progress?.timelineJson as any[]) || [],
    });
  } catch (error) {
    console.error("getTimeline error:", error);
    const msg = error instanceof Error ? error.message : "Failed to fetch timeline";
    res.status(500).json({ success: false, error: msg });
  }
}

// GET /api/progress/revision-queue
export async function getRevisionQueue(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const progress = await userPrisma.progressTracking.findUnique({ where: { userId } });
    res.json({
      success: true,
      revisionQueue: (progress?.revisionQueueJson as any[]) || [],
    });
  } catch (error) {
    console.error("getRevisionQueue error:", error);
    const msg = error instanceof Error ? error.message : "Failed to fetch revision queue";
    res.status(500).json({ success: false, error: msg });
  }
}

// GET /api/progress/knowledge-growth
export async function getKnowledgeGrowth(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const range = (req.query.range as string) || "30";
    const days = parseInt(range, 10) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [notes, quizAttempts, docs, events] = await Promise.all([
      userPrisma.generatedNote.findMany({ where: { userId, createdAt: { gte: since } }, orderBy: { createdAt: "asc" } }),
      userPrisma.quizAttempt.findMany({ where: { userId, createdAt: { gte: since } }, orderBy: { createdAt: "asc" } }),
      userPrisma.uploadedDocument.findMany({ where: { userId, createdAt: { gte: since } }, orderBy: { createdAt: "asc" } }),
      userPrisma.learningEvent.findMany({ where: { userId, createdAt: { gte: since } }, orderBy: { createdAt: "asc" } }),
    ]);

    const growth = ProgressService.buildKnowledgeGrowth({ notes, quizAttempts, docs, events });
    res.json({ success: true, knowledgeGrowth: growth });
  } catch (error) {
    console.error("getKnowledgeGrowth error:", error);
    const msg = error instanceof Error ? error.message : "Failed to fetch knowledge growth";
    res.status(500).json({ success: false, error: msg });
  }
}

// GET /api/progress/study-sessions
export async function getStudySessions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const sessions = await userPrisma.studySession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { _count: { select: { messages: true } } },
    });
    const events = await userPrisma.learningEvent.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });

    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      topic: s.topic,
      startTime: s.createdAt.toISOString(),
      endTime: s.updatedAt.toISOString(),
      durationMinutes: Math.max(1, Math.round((s.updatedAt.getTime() - s.createdAt.getTime()) / 60000)),
      messagesCount: s._count.messages,
    }));

    res.json({ success: true, sessions: formattedSessions, events: events.slice(0, 20) });
  } catch (error) {
    console.error("getStudySessions error:", error);
    const msg = error instanceof Error ? error.message : "Failed to fetch study sessions";
    res.status(500).json({ success: false, error: msg });
  }
}
