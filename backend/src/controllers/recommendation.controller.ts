import type { Request, Response } from "express";
import { RecommendationService } from "../services/recommendation.service";
import { getUserPrismaFromRequest } from "../utils/prisma";

export async function generateRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const data = await RecommendationService.generateRecommendations(userId, userPrisma);
    res.json({ success: true, ...data });
  } catch (error: any) {
    console.error("Recommendation generateRecommendations error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate recommendations" });
  }
}

export async function getDashboardRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);

    // Fetch existing recommendations from DB
    let dbRecommendations = await userPrisma.recommendation.findMany({
      where: { userId },
      orderBy: { generatedAt: "desc" }
    });

    let dailyBrief = {
      text: "Good morning! Welcome back to your learning space. Start today's recommended task to boost your score.",
      metrics: { scoreChange: "+2%", strongestArea: "Database Systems", urgentRevision: "Operating Systems", impactEstimate: "4%" }
    };
    let coachInsight = {
      text: "Focusing on Operating Systems revision today could raise your exam readiness by 8%.",
      efficiency: 75,
      impactEstimate: 8
    };
    let learningPaths = [
      { title: "Core CS Fundamentals", steps: ["SQL Basics", "Normalization", "CPU Scheduling", "Deadlocks", "Process Sync"] }
    ];

    // If no recommendations exist, trigger a fresh generation
    if (dbRecommendations.length === 0) {
      const generated = await RecommendationService.generateRecommendations(userId, userPrisma);
      res.json({ success: true, ...generated });
      return;
    }

    // Try reading cached brief/insight from learning analytics
    const analytics = await userPrisma.learningAnalytics.findUnique({ where: { userId } });
    if (analytics && analytics.recommendationsJson) {
      try {
        const cached = typeof analytics.recommendationsJson === "string" 
          ? JSON.parse(analytics.recommendationsJson) 
          : analytics.recommendationsJson;
        if (cached && cached.dailyBrief) dailyBrief = cached.dailyBrief;
        if (cached && cached.coachInsight) coachInsight = cached.coachInsight;
        if (cached && cached.learningPaths) learningPaths = cached.learningPaths;
      } catch (err) {
        console.warn("Failed parsing cached recommendationsJson", err);
      }
    }

    const payload = dbRecommendations.map(rec => ({
      id: rec.id,
      recommendationType: rec.recommendationType,
      topicName: rec.topicName,
      priority: rec.priority,
      impactScore: rec.impactScore,
      urgencyScore: rec.urgencyScore,
      relevanceScore: rec.relevanceScore,
      reason: rec.reason,
    }));

    if (dailyBrief && typeof dailyBrief.text === "string") {
      dailyBrief.text = dailyBrief.text.replace(/God (morning|afternoon|evening)/gi, "Good $1");
    }

    res.json({
      success: true,
      recommendations: payload,
      dailyBrief,
      coachInsight,
      learningPaths,
      lastGeneratedAt: dbRecommendations[0]?.generatedAt.toISOString()
    });
  } catch (error: any) {
    console.error("Recommendation getDashboardRecommendations error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to get dashboard recommendations" });
  }
}

export async function getStudyRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const dbRecommendations = await userPrisma.recommendation.findMany({
      where: {
        userId,
        recommendationType: { in: ["study_next", "retention_recovery"] }
      },
      orderBy: { urgencyScore: "desc" }
    });
    res.json({ success: true, recommendations: dbRecommendations });
  } catch (error: any) {
    console.error("Recommendation getStudyRecommendations error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to get study recommendations" });
  }
}

export async function getRevisionRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const dbRecommendations = await userPrisma.recommendation.findMany({
      where: {
        userId,
        recommendationType: { in: ["revision", "retention_recovery", "weak_recovery"] }
      },
      orderBy: { urgencyScore: "desc" }
    });
    res.json({ success: true, recommendations: dbRecommendations });
  } catch (error: any) {
    console.error("Recommendation getRevisionRecommendations error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to get revision recommendations" });
  }
}

export async function getExamRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const dbRecommendations = await userPrisma.recommendation.findMany({
      where: {
        userId,
        recommendationType: { in: ["exam_prep", "weak_recovery", "revision"] }
      },
      orderBy: { relevanceScore: "desc" }
    });
    res.json({ success: true, recommendations: dbRecommendations });
  } catch (error: any) {
    console.error("Recommendation getExamRecommendations error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to get exam recommendations" });
  }
}

export async function getInterviewRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const dbRecommendations = await userPrisma.recommendation.findMany({
      where: {
        userId,
        recommendationType: { in: ["interview_prep", "practice"] }
      },
      orderBy: { relevanceScore: "desc" }
    });
    res.json({ success: true, recommendations: dbRecommendations });
  } catch (error: any) {
    console.error("Recommendation getInterviewRecommendations error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to get interview recommendations" });
  }
}
