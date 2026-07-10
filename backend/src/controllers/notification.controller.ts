import type { NextFunction, Request, Response } from "express";
import { httpError } from "../utils/httpError";
import { emitNotification } from "../lib/notificationEmitter";
import { getUserPrismaFromRequest, masterPrisma } from "../utils/prisma";

// ─── 1. List Notifications (paginated) ────────────────────────────

export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const userPrisma = await getUserPrismaFromRequest(req);
    const [notifications, total] = await Promise.all([
      userPrisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      userPrisma.notification.count({ where: { userId } }),
    ]);

    res.json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── 2. Get Unread Count ──────────────────────────────────────────

export async function getUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const userPrisma = await getUserPrismaFromRequest(req);
    const count = await userPrisma.notification.count({
      where: { userId, read: false },
    });

    res.json({ success: true, count });
  } catch (error) {
    next(error);
  }
}

// ─── 3. Mark Single Notification as Read ──────────────────────────

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const id = req.params.id as string;

    const userPrisma = await getUserPrismaFromRequest(req);
    const notification = await userPrisma.notification.findUnique({ where: { id } });
    if (!notification) throw httpError(404, "Notification not found");
    if (notification.userId !== userId) throw httpError(403, "Not your notification");

    await userPrisma.notification.update({
      where: { id },
      data: { read: true },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// ─── 4. Mark All Notifications as Read ────────────────────────────

export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const userPrisma = await getUserPrismaFromRequest(req);
    await userPrisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// ─── 5. Delete Single Notification ────────────────────────────────

export async function deleteNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const id = req.params.id as string;

    const userPrisma = await getUserPrismaFromRequest(req);
    const notification = await userPrisma.notification.findUnique({ where: { id } });
    if (!notification) throw httpError(404, "Notification not found");
    if (notification.userId !== userId) throw httpError(403, "Not your notification");

    await userPrisma.notification.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// ─── 6. Clear All Notifications ───────────────────────────────────

export async function clearAllNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const userPrisma = await getUserPrismaFromRequest(req);
    await userPrisma.notification.deleteMany({ where: { userId } });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// ─── 7. Create Notification (internal use / admin) ───────────────

export async function createNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const requester = await masterPrisma.user.findUnique({ where: { id: userId } });
    const { targetUserId, type, title, message, link } = req.body;

    if (!targetUserId || !type || !title || !message) {
      throw httpError(400, "Missing required fields: targetUserId, type, title, message");
    }

    if (requester?.role !== "ADMIN" && targetUserId !== userId) {
      throw httpError(403, "Only admins can create notifications for other users");
    }

    const userPrisma = await getUserPrismaFromRequest(req);
    const notification = await userPrisma.notification.create({
      data: { userId: targetUserId, type, title, message, link },
    });

    // Emit real-time event via Socket.io
    emitNotification(targetUserId, notification);

    res.status(201).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
}
