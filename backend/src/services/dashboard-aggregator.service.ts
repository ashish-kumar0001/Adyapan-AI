import { PrismaClient } from "@prisma/user-client";
import { AnalyticsService } from "./analytics.service";
import { ProgressService } from "./progress.service";
import { PlannerService } from "./planner.service";
import { StreakService } from "./streak.service";
import { WeakTopicsService } from "./weak-topics.service";
import { generateText, MODELS } from "../lib/ai/openrouter";
import { masterPrisma } from "../utils/prisma";

export class LearningDashboardAggregator {
  /**
   * Aggregates learning statistics from all child services and generates the AI Daily Brief.
   */
  static async getDashboardData(userId: string, timezone: string = "UTC", prisma: PrismaClient) {
    // 1. Fetch data concurrently from all modules
    const [analytics, progress, planner, streak] = await Promise.all([
      AnalyticsService.getDashboardData(userId, prisma).catch((err) => {
        console.error("Dashboard Aggregator: Analytics fetch error:", err);
        return null;
      }),
      ProgressService.getDashboard(userId, prisma).catch((err) => {
        console.error("Dashboard Aggregator: Progress fetch error:", err);
        return null;
      }),
      PlannerService.getTodayPlan(userId, prisma).catch((err) => {
        console.error("Dashboard Aggregator: Planner fetch error:", err);
        return null;
      }),
      StreakService.getDashboardData(userId, timezone, prisma).catch((err) => {
        console.error("Dashboard Aggregator: Streak fetch error:", err);
        return null;
      }),
    ]);

    // Weak topics dashboard can occasionally be null, in which case we analyze & persist
    let weakTopics = await WeakTopicsService.getDashboardData(userId, prisma).catch((err) => {
      console.error("Dashboard Aggregator: Weak topics fetch error:", err);
      return null;
    });

    if (!weakTopics) {
      weakTopics = await WeakTopicsService.analyzeAndPersist(userId, prisma).catch((err) => {
        console.error("Dashboard Aggregator: Weak topics analyze error:", err);
        return null;
      });
    }

    // 2. Resolve strongest and weakest topics dynamically based on stats
    let strongestTopic = "DBMS";
    let weakestTopic = "Operating Systems";
    let revisionTopic = "CPU Scheduling";

    // Extract strongest from progress
    if (progress?.topicProgress && progress.topicProgress.length > 0) {
      const sortedTopics = [...progress.topicProgress].sort((a, b) => b.masteryScore - a.masteryScore);
      strongestTopic = sortedTopics[0].topicName;
    }

    // Extract weakest from weak topics
    if (weakTopics?.weakTopics && weakTopics.weakTopics.length > 0) {
      const sortedWeak = [...weakTopics.weakTopics].sort((a, b) => a.strengthScore - b.strengthScore);
      weakestTopic = sortedWeak[0].topicName;
    } else if (progress?.topicProgress && progress.topicProgress.length > 0) {
      const sortedTopics = [...progress.topicProgress].sort((a, b) => a.masteryScore - b.masteryScore);
      weakestTopic = sortedTopics[0].topicName;
    }

    // Determine revision topic from planner or weak topics revision queue
    if (planner?.revisions && planner.revisions.length > 0) {
      revisionTopic = planner.revisions[0].topicName;
    } else if (planner?.tasks && planner.tasks.length > 0) {
      revisionTopic = planner.tasks[0].topicName;
    } else if (weakTopics?.revisionQueue?.immediate && weakTopics.revisionQueue.immediate.length > 0) {
      revisionTopic = weakTopics.revisionQueue.immediate[0].topicName;
    }

    // 3. Compute readiness increment (typically 2% to 6% per daily task completed)
    const pendingTasksCount = planner?.tasks?.filter((t: any) => t.status !== "Completed").length || 0;
    const readinessIncrement = pendingTasksCount > 0 ? Math.min(10, Math.max(2, pendingTasksCount * 2)) : 4;

    // 4. Generate AI Daily Brief
    const name = await this.getUserName(userId);
    const streakDays = streak?.currentStreak ?? 0;
    const dailyBrief = await this.generateDailyBrief({
      name,
      streakDays,
      strongestTopic,
      weakestTopic,
      revisionTopic,
      readinessIncrement,
    });

    // 5. Structure recommendations
    const recommendations = {
      studyNext: weakTopics?.recommendations?.studyNext || [],
      reviseNext: weakTopics?.recommendations?.reviseNext || [],
      practiceNext: weakTopics?.recommendations?.practiceNext || [],
      improveNext: weakTopics?.recommendations?.improveNext || [],
    };

    return {
      analytics,
      progress,
      planner,
      streak,
      weak_topics: weakTopics,
      recommendations,
      dailyBrief,
    };
  }

  /**
   * Helper to fetch user's name from master db.
   */
  private static async getUserName(userId: string): Promise<string> {
    try {
      const user = await masterPrisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      return user?.name || "Student";
    } catch {
      return "Student";
    }
  }

  /**
   * AI Daily Brief engine that utilizes LLM to compose a personalized message.
   */
  private static async generateDailyBrief(params: {
    name: string;
    streakDays: number;
    strongestTopic: string;
    weakestTopic: string;
    revisionTopic: string;
    readinessIncrement: number;
  }): Promise<string> {
    const hour = new Date().getHours();
    let greeting = "Good morning";
    if (hour >= 12 && hour < 17) greeting = "Good afternoon";
    else if (hour >= 17) greeting = "Good evening";

    const defaultBrief = `${greeting}, ${params.name}.\n\nYou are maintaining a ${params.streakDays}-day learning streak.\n\nYour strongest area is ${params.strongestTopic}.\n\nYour weakest area is ${params.weakestTopic}.\n\nYou should revise ${params.revisionTopic} today.\n\nCompleting today's study plan will increase your readiness score by ${params.readinessIncrement}%.`;

    try {
      const systemPrompt = `You are an encouraging AI Learning Coach. Generate a friendly, professional learning status brief for a student. Keep it short, actionable, and structured with clean lines. You must use the provided student metrics exactly and greet them appropriately based on the time of day.`;
      
      const userPrompt = `
      Create a brief matching this exact factual structure but written in a natural, cohesive voice:
      Greeting: "${greeting}, ${params.name}."
      Streak state: "You are maintaining a ${params.streakDays}-day learning streak."
      Strongest area: "Your strongest area is ${params.strongestTopic}."
      Weakest area: "Your weakest area is ${params.weakestTopic}."
      Today's revision: "You should revise ${params.revisionTopic} today."
      Readiness projection: "Completing today's study plan will increase your readiness score by ${params.readinessIncrement}%."
      
      Output ONLY the brief text. Do not wrap it in markdown code blocks. Keep spacing clear.
      `;

      const aiText = await generateText(systemPrompt, userPrompt, { model: MODELS.FAST });
      return aiText?.trim() || defaultBrief;
    } catch (e) {
      console.warn("AI Daily Brief Engine fallback used:", e);
      return defaultBrief;
    }
  }
}
