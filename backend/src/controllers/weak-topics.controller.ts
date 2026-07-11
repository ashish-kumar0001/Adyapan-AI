import type { Request, Response } from "express";
import { WeakTopicsService } from "../services/weak-topics.service";
import { getUserPrismaFromRequest } from "../utils/prisma";

export async function analyzeWeakTopics(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    const data = await WeakTopicsService.analyzeAndPersist(userId, userPrisma);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("WeakTopics analyzeWeakTopics error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to analyze weak topics" });
  }
}

export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);

    // Try existing data first
    let data = await WeakTopicsService.getDashboardData(userId, userPrisma);

    // If no data exists, trigger a fresh analysis
    if (!data) {
      data = await WeakTopicsService.analyzeAndPersist(userId, userPrisma);
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error("WeakTopics getDashboard error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to get weak topics dashboard" });
  }
}

export async function getRevisionQueue(req: Request, res: Response): Promise<void> {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const userId = req.user!.userId;
    const queue = await userPrisma.revisionQueue.findMany({
      where: { userId },
      orderBy: [{ priority: "asc" }, { recommendedDate: "asc" }],
    });
    res.json({ success: true, queue });
  } catch (error: any) {
    console.error("WeakTopics getRevisionQueue error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to get revision queue" });
  }
}

export async function getWeakConcepts(req: Request, res: Response): Promise<void> {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const userId = req.user!.userId;
    const concepts = await userPrisma.weakConcept.findMany({
      where: { userId },
      orderBy: { masteryScore: "asc" },
    });
    res.json({ success: true, concepts });
  } catch (error: any) {
    console.error("WeakTopics getWeakConcepts error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to get weak concepts" });
  }
}

export async function getRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    let data = await WeakTopicsService.getDashboardData(userId, userPrisma);
    if (!data) {
      data = await WeakTopicsService.analyzeAndPersist(userId, userPrisma);
    }
    res.json({ success: true, recommendations: data.recommendations, coachInsight: data.coachInsight });
  } catch (error: any) {
    console.error("WeakTopics getRecommendations error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to get recommendations" });
  }
}

export async function getExamRisk(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    let data = await WeakTopicsService.getDashboardData(userId, userPrisma);
    if (!data) {
      data = await WeakTopicsService.analyzeAndPersist(userId, userPrisma);
    }
    res.json({ success: true, examRisk: data.examRisk });
  } catch (error: any) {
    console.error("WeakTopics getExamRisk error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to get exam risk" });
  }
}

export async function getInterviewRisk(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const userPrisma = await getUserPrismaFromRequest(req);
    let data = await WeakTopicsService.getDashboardData(userId, userPrisma);
    if (!data) {
      data = await WeakTopicsService.analyzeAndPersist(userId, userPrisma);
    }
    res.json({ success: true, interviewRisk: data.interviewRisk });
  } catch (error: any) {
    console.error("WeakTopics getInterviewRisk error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to get interview risk" });
  }
}

export async function updateRevisionStatus(req: Request, res: Response): Promise<void> {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const userId = req.user!.userId;
    const { id, status } = req.body;
    if (!id || !status) {
      res.status(400).json({ success: false, error: "Missing id or status" });
      return;
    }
    const updated = await userPrisma.revisionQueue.updateMany({
      where: { id, userId },
      data: { status },
    });
    res.json({ success: true, updated });
  } catch (error: any) {
    console.error("WeakTopics updateRevisionStatus error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to update revision status" });
  }
}
