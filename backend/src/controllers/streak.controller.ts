import type { Request, Response } from "express";
import { StreakService } from "../services/streak.service";
import { getUserPrismaFromRequest } from "../utils/prisma";

export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const tz = (req.headers["x-timezone"] as string) || "UTC";
    const data = await StreakService.getDashboardData(userId, tz, userPrisma);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Streak getDashboard error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to get streak dashboard" });
  }
}

export async function updateStreak(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { eventType, eventSource, documentId, activityPoints } = req.body;
    
    if (!eventType || !eventSource) {
      res.status(400).json({ success: false, error: "Missing eventType or eventSource" });
      return;
    }
    
    const userPrisma = await getUserPrismaFromRequest(req);
    const tz = (req.headers["x-timezone"] as string) || "UTC";
    const result = await StreakService.trackActivity(
      userId,
      eventType,
      eventSource,
      documentId || null,
      activityPoints ? Number(activityPoints) : 10,
      tz,
      userPrisma
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Streak updateStreak error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to update streak" });
  }
}

export async function getAchievements(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const achievements = await StreakService.getAchievementsData(userId, userPrisma);
    res.json({ success: true, achievements });
  } catch (error: any) {
    console.error("Streak getAchievements error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to get achievements" });
  }
}

export async function getHeatmap(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const daysRange = req.query.days ? Number(req.query.days) : 365;
    const userPrisma = await getUserPrismaFromRequest(req);
    const tz = (req.headers["x-timezone"] as string) || "UTC";
    const heatmap = await StreakService.getHeatmapData(userId, daysRange, tz, userPrisma);
    res.json({ success: true, heatmap });
  } catch (error: any) {
    console.error("Streak getHeatmap error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to get heatmap" });
  }
}

export async function getInsights(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const tz = (req.headers["x-timezone"] as string) || "UTC";
    const insights = await StreakService.getStreakInsights(userId, tz, userPrisma);
    res.json({ success: true, insights });
  } catch (error: any) {
    console.error("Streak getInsights error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to get insights" });
  }
}
