import type { Request, Response } from "express";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { getTimezone } from "../utils/request";
import { LearningDashboardAggregator } from "../services/dashboard-aggregator.service";

export async function getLearningDashboard(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const tz = getTimezone(req);

    const data = await LearningDashboardAggregator.getDashboardData(userId, tz, userPrisma);

    res.json({
      success: true,
      analytics: data.analytics,
      progress: data.progress,
      planner: data.planner,
      streak: data.streak,
      weak_topics: data.weak_topics,
      recommendations: data.recommendations,
      dailyBrief: data.dailyBrief,
    });
  } catch (error: any) {
    console.error("Dashboard Controller getLearningDashboard error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to retrieve unified learning dashboard statistics",
    });
  }
}
