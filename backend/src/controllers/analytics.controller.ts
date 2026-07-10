import type { Request, Response } from "express";
import { AnalyticsService } from "../services/analytics.service";
import { getUserPrismaFromRequest } from "../utils/prisma";

export async function generateAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const analytics = await AnalyticsService.generateAnalytics(userId, userPrisma);
    res.json({ success: true, analytics });
  } catch (error: any) {
    console.error("Generate analytics controller error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate learning analytics" });
  }
}

export async function getDashboardData(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const analytics = await AnalyticsService.getDashboardData(userId, userPrisma);
    res.json({ success: true, analytics });
  } catch (error: any) {
    console.error("Get dashboard analytics error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch learning analytics" });
  }
}

export async function getRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const analytics = await AnalyticsService.getDashboardData(userId, userPrisma);
    res.json({
      success: true,
      recommendations: analytics.recommendationsJson,
      learningScore: analytics.learningScore,
      examReadiness: analytics.examReadiness
    });
  } catch (error: any) {
    console.error("Get recommendations error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch recommendations" });
  }
}

export async function getTopicInsights(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const analytics = await AnalyticsService.getDashboardData(userId, userPrisma);
    const insights = analytics.insightsJson as any;
    res.json({
      success: true,
      topicAnalytics: analytics.topicAnalyticsJson,
      knowledgeDistribution: insights?.knowledgeDistribution || { beginner: [], intermediate: [], advanced: [] },
      insights: insights?.insights || []
    });
  } catch (error: any) {
    console.error("Get topic insights error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch topic insights" });
  }
}

export async function getLearningTrends(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    
    // Fetch events, notes, quizzes, documents in the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [events, notes, quizAttempts, docs] = await Promise.all([
      userPrisma.learningEvent.findMany({
        where: { userId, createdAt: { gte: ninetyDaysAgo } },
        orderBy: { createdAt: "asc" }
      }),
      userPrisma.generatedNote.findMany({
        where: { userId, createdAt: { gte: ninetyDaysAgo } },
        orderBy: { createdAt: "asc" }
      }),
      userPrisma.quizAttempt.findMany({
        where: { userId, createdAt: { gte: ninetyDaysAgo } },
        orderBy: { createdAt: "asc" }
      }),
      userPrisma.uploadedDocument.findMany({
        where: { userId, createdAt: { gte: ninetyDaysAgo } },
        orderBy: { createdAt: "asc" }
      })
    ]);

    // Group items by local date (YYYY-MM-DD)
    const dailyData: Record<string, {
      studyTime: number;
      documentsProcessed: number;
      questionsPracticed: number;
      notesGenerated: number;
    }> = {};

    const getDayKey = (date: Date) => date.toISOString().split("T")[0];

    const initDay = (key: string) => {
      if (!dailyData[key]) {
        dailyData[key] = { studyTime: 0, documentsProcessed: 0, questionsPracticed: 0, notesGenerated: 0 };
      }
    };

    // Aggregate events
    events.forEach(e => {
      const key = getDayKey(e.createdAt);
      initDay(key);
      dailyData[key].studyTime += e.duration ?? 0;
    });

    // Aggregate notes (assume 15 min duration if no matching event)
    notes.forEach(n => {
      const key = getDayKey(n.createdAt);
      initDay(key);
      dailyData[key].notesGenerated += 1;
      // Only add to studyTime if not already accounted for by event logger
      const eventMatches = events.filter(e => getDayKey(e.createdAt) === key && e.eventType === "note_generation").length;
      if (eventMatches === 0) {
        dailyData[key].studyTime += 15;
      }
    });

    // Aggregate documents (assume 5 min duration)
    docs.forEach(d => {
      const key = getDayKey(d.createdAt);
      initDay(key);
      dailyData[key].documentsProcessed += 1;
      const eventMatches = events.filter(e => getDayKey(e.createdAt) === key && e.eventType === "document_upload").length;
      if (eventMatches === 0) {
        dailyData[key].studyTime += 5;
      }
    });

    // Aggregate quiz attempts (assume 12 min duration)
    quizAttempts.forEach(q => {
      const key = getDayKey(q.createdAt);
      initDay(key);
      dailyData[key].questionsPracticed += q.total;
      const eventMatches = events.filter(e => getDayKey(e.createdAt) === key && e.eventType === "quiz_attempt").length;
      if (eventMatches === 0) {
        dailyData[key].studyTime += 12;
      }
    });

    // Helper to generate consecutive dates
    const getTrendsList = (daysCount: number) => {
      const list = [];
      const today = new Date();
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const key = getDayKey(d);
        const data = dailyData[key] || { studyTime: 0, documentsProcessed: 0, questionsPracticed: 0, notesGenerated: 0 };
        list.push({
          date: key,
          dayLabel: d.toLocaleDateString("en-US", { weekday: "short" }),
          displayDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          studyHours: Number((data.studyTime / 60).toFixed(2)),
          studyTimeMinutes: data.studyTime,
          documentsProcessed: data.documentsProcessed,
          questionsPracticed: data.questionsPracticed,
          notesGenerated: data.notesGenerated,
        });
      }
      return list;
    };

    res.json({
      success: true,
      trends: {
        last7Days: getTrendsList(7),
        last30Days: getTrendsList(30),
        last90Days: getTrendsList(90)
      }
    });
  } catch (error: any) {
    console.error("Get learning trends error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch learning trends" });
  }
}

export async function seedMockData(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    await AnalyticsService.seedDemoData(userId, userPrisma);
    res.json({ success: true, message: "Demo learning analytics data populated successfully." });
  } catch (error: any) {
    console.error("Seed mock data controller error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to seed demo analytics data" });
  }
}
