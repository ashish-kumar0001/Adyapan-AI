import { Router } from "express";
import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  createNotification,
} from "../controllers/notification.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { handleRouteError } from "../utils/routeError";
import { generateJSON, MODELS } from "../lib/ai/openrouter";

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get("/", listNotifications);
notificationRouter.get("/unread-count", getUnreadCount);
notificationRouter.put("/read-all", markAllAsRead);
notificationRouter.delete("/clear", clearAllNotifications);
notificationRouter.delete("/:id", deleteNotification);
notificationRouter.put("/:id/read", markAsRead);
notificationRouter.post("/", requireRole("ADMIN"), createNotification);

// ═══════════════════════════════════════════════════════════════════════════
// AI-POWERED NOTIFICATION ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// ─── POST /ai/digest ─ AI-powered smart notification digest ────────────────
notificationRouter.post("/ai/digest", requireAuth, async (req: any, res) => {
  try {
    const prisma = await getUserPrismaFromRequest(req);
    const userId = req.user?.userId || req.user?.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    if (notifications.length === 0) {
      return res.json({ success: true, digest: "No notifications to summarize." });
    }

    const notifList = notifications.map((n: any, i: number) =>
      `[${i + 1}] ${n.type || "general"}: ${n.title || ""} - ${n.message || ""} (${n.createdAt?.toISOString?.() || "unknown date"})`
    ).join("\n");

    const fallback = { digest: `You have ${notifications.length} notifications. Check them for details.`, highlights: [] as string[], actionItems: [] as string[] };

    const prompt = `You are a smart notification assistant. Summarize the user's recent notifications into a concise, actionable digest.

Recent Notifications (${notifications.length} total):
${notifList}

Create a smart digest that:
1. Groups similar notifications
2. Highlights the most important items
3. Suggests actions the user should take

Return a JSON object with:
- digest: a 2-3 sentence summary of the notifications
- highlights: array of 2-4 key highlights from the notifications
- actionItems: array of 1-3 suggested actions the user should take

Return ONLY the JSON object, no other text.`;

    const result = await generateJSON(
      "You are a smart notification assistant who creates concise, actionable notification digests.",
      prompt,
      { model: MODELS.FAST, temperature: 0.3 },
      fallback
    );

    const data = result && typeof result === "object" ? result : fallback;
    res.json({
      success: true,
      digest: (data as any).digest || "",
      highlights: Array.isArray((data as any).highlights) ? (data as any).highlights : [],
      actionItems: Array.isArray((data as any).actionItems) ? (data as any).actionItems : [],
    });
  } catch (error) {
    handleRouteError(res, error, "Notification.aiDigest", "Failed to generate digest");
  }
});
