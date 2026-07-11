import { PrismaClient } from "@prisma/user-client";

export class PlannerService {
  /**
   * Fetches the latest active study plan and the tasks/revisions scheduled for today.
   */
  static async getTodayPlan(userId: string, prisma: PrismaClient) {
    const plan = await prisma.studyPlan.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!plan) {
      return { plan: null, tasks: [], revisions: [] };
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const todayStart = new Date(todayStr);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayStart.getDate() + 1);

    // Query tasks for today
    const tasks = await prisma.studyTask.findMany({
      where: {
        studyPlanId: plan.id,
        scheduledDate: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });

    // Query revisions for today
    const revisions = await prisma.studyRevision.findMany({
      where: {
        userId,
        revisionDate: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });

    return { plan, tasks, revisions };
  }
}
