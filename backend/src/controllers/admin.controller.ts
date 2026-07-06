import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { httpError } from "../utils/httpError";
import bcrypt from "bcrypt";

// ─── 1. Dashboard Overview ───────────────────────────────────────

export async function getDashboardStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      adminUsers,
      premiumUsers,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      payments,
      totalRevenue,
      monthRevenue,
      resumeCount,
      atsCount,
      coverLetterCount,
      linkedinCount,
      studySessions,
      notesCount,
      quizzesCount,
      assignmentsCount,
      pptsCount,
      mindmapsCount,
      codingSessions,
      submissionsCount,
      challengesCount,
      interviewSessions,
      chatSessions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { plan: { not: "free" }, subscriptionStatus: "active" } }),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.payment.findMany({ select: { amount: true, status: true, createdAt: true } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "paid" } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "paid", createdAt: { gte: monthAgo } } }),
      prisma.resume.count(),
      prisma.aTSReport.count(),
      prisma.coverLetter.count(),
      prisma.linkedInReport.count(),
      prisma.studySession.count(),
      prisma.generatedNote.count(),
      prisma.quiz.count(),
      prisma.assignment.count(),
      prisma.presentation.count(),
      prisma.mindMap.count(),
      prisma.codingSession.count(),
      prisma.submission.count(),
      prisma.challengeSubmission.count(),
      prisma.interviewSession.count(),
      prisma.chatSession.count(),
    ]);

    const revenueTotal = totalRevenue._sum.amount ?? 0;
    const revenueMonth = monthRevenue._sum.amount ?? 0;
    const successfulPayments = payments.filter(p => p.status === "paid").length;
    const failedPayments = payments.filter(p => p.status === "failed").length;

    const freeUsers = totalUsers - premiumUsers - adminUsers;

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          admin: adminUsers,
          premium: premiumUsers,
          free: Math.max(0, freeUsers),
          newToday: newUsersToday,
          newWeek: newUsersWeek,
          newMonth: newUsersMonth,
        },
        revenue: {
          total: revenueTotal,
          month: revenueMonth,
          successfulPayments,
          failedPayments,
          totalPayments: payments.length,
        },
        modules: {
          resume: { resumes: resumeCount, atsReports: atsCount, coverLetters: coverLetterCount, linkedinReports: linkedinCount },
          learning: { studySessions, notes: notesCount, quizzes: quizzesCount, assignments: assignmentsCount, ppts: pptsCount, mindmaps: mindmapsCount },
          coding: { sessions: codingSessions, submissions: submissionsCount, challenges: challengesCount },
          interview: { sessions: interviewSessions },
          chat: { sessions: chatSessions },
        },
        totalAiRequests: resumeCount + atsCount + coverLetterCount + linkedinCount + studySessions + notesCount + quizzesCount + assignmentsCount + pptsCount + mindmapsCount + codingSessions + submissionsCount + interviewSessions + chatSessions,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── 2. Activity Feed ────────────────────────────────────────────

export async function getActivityFeed(_req: Request, res: Response, next: NextFunction) {
  try {
    const [
      recentUsers, recentResumes, recentCoverLetters, recentAts,
      recentStudy, recentNotes, recentQuizzes, recentAssignments,
      recentPpts, recentMindmaps, recentCoding, recentSubmissions,
      recentInterviews, recentChats, recentPayments,
    ] = await Promise.all([
      prisma.user.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, name: true, createdAt: true } }),
      prisma.resume.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
      prisma.coverLetter.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
      prisma.aTSReport.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
      prisma.studySession.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
      prisma.generatedNote.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
      prisma.quiz.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
      prisma.assignment.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
      prisma.presentation.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
      prisma.mindMap.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
      prisma.codingSession.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
      prisma.submission.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
      prisma.interviewSession.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
      prisma.chatSession.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
      prisma.payment.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
    ]);

    const activities: { time: Date; user: string; action: string; module: string; id: string }[] = [];

    recentUsers.forEach(u => activities.push({ time: u.createdAt, user: u.name, action: "Registered", module: "Platform", id: u.id }));
    recentResumes.forEach(r => activities.push({ time: r.createdAt, user: r.user.name, action: "Generated Resume", module: "Resume Hub", id: r.id }));
    recentCoverLetters.forEach(c => activities.push({ time: c.createdAt, user: c.user.name, action: "Created Cover Letter", module: "Resume Hub", id: c.id }));
    recentAts.forEach(a => activities.push({ time: a.createdAt, user: a.user.name, action: "Ran ATS Check", module: "Resume Hub", id: a.id }));
    recentStudy.forEach(s => activities.push({ time: s.createdAt, user: s.user.name, action: "Started Study Session", module: "Learning Hub", id: s.id }));
    recentNotes.forEach(n => activities.push({ time: n.createdAt, user: n.user.name, action: "Generated Notes", module: "Learning Hub", id: n.id }));
    recentQuizzes.forEach(q => activities.push({ time: q.createdAt, user: q.user.name, action: "Created Quiz", module: "Learning Hub", id: q.id }));
    recentAssignments.forEach(a => activities.push({ time: a.createdAt, user: a.user.name, action: "Generated Assignment", module: "Learning Hub", id: a.id }));
    recentPpts.forEach(p => activities.push({ time: p.createdAt, user: p.user.name, action: "Created PPT", module: "Learning Hub", id: p.id }));
    recentMindmaps.forEach(m => activities.push({ time: m.createdAt, user: m.user.name, action: "Built Mind Map", module: "Learning Hub", id: m.id }));
    recentCoding.forEach(c => activities.push({ time: c.createdAt, user: c.user.name, action: "Started Coding Session", module: "Coding Hub", id: c.id }));
    recentSubmissions.forEach(s => activities.push({ time: s.createdAt, user: s.user.name, action: "Submitted Code", module: "Coding Hub", id: s.id }));
    recentInterviews.forEach(i => activities.push({ time: i.createdAt, user: i.user.name, action: "Completed Interview", module: "Interview Hub", id: i.id }));
    recentChats.forEach(c => activities.push({ time: c.createdAt, user: c.user.name, action: "AI Chat Session", module: "Ady Chat", id: c.id }));
    recentPayments.forEach(p => activities.push({ time: p.createdAt, user: p.user.name, action: `Payment ${p.status}`, module: "Billing", id: p.id }));

    activities.sort((a, b) => b.time.getTime() - a.time.getTime());

    res.json({ success: true, activities: activities.slice(0, 50) });
  } catch (error) {
    next(error);
  }
}

// ─── 3. User Management ──────────────────────────────────────────

export async function getAdminUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const plan = typeof req.query.plan === "string" ? req.query.plan : "";
    const status = typeof req.query.status === "string" ? req.query.status : "";

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (plan) where.plan = plan;
    if (status === "active") where.subscriptionStatus = "active";
    else if (status === "suspended") where.subscriptionStatus = "cancelled";

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, role: true, plan: true,
          subscriptionStatus: true, subscriptionEnd: true,
          createdAt: true, updatedAt: true,
          profile: { select: { college: true, branch: true, location: true, phone: true } },
          _count: { select: { resumes: true, chatSessions: true, interviewSessions: true, codingSessions: true, studySessions: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, users, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
}

// ─── 4. User Actions ─────────────────────────────────────────────

export async function updateUserPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.id as string;
    const { plan, action } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw httpError(404, "User not found");

    if (action === "block") {
      await prisma.user.update({ where: { id: userId }, data: { subscriptionStatus: "cancelled" } });
      return res.json({ success: true, message: "User blocked" });
    }
    if (action === "suspend") {
      await prisma.user.update({ where: { id: userId }, data: { subscriptionStatus: "cancelled" } });
      return res.json({ success: true, message: "User suspended" });
    }
    if (action === "delete") {
      await prisma.user.delete({ where: { id: userId } });
      return res.json({ success: true, message: "User deleted" });
    }
    if (action === "reset-password") {
      const hashed = await bcrypt.hash("Adyapan@123", 10);
      await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
      return res.json({ success: true, message: "Password reset to Adyapan@123" });
    }
    if (action === "upgrade" && plan) {
      await prisma.user.update({
        where: { id: userId },
        data: { plan, subscriptionStatus: "active", subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
      });
      return res.json({ success: true, message: `User upgraded to ${plan}` });
    }
    if (action === "downgrade") {
      await prisma.user.update({
        where: { id: userId },
        data: { plan: "free", subscriptionStatus: "inactive", subscriptionEnd: null },
      });
      return res.json({ success: true, message: "User downgraded to Free" });
    }

    throw httpError(400, "Invalid action");
  } catch (error) {
    next(error);
  }
}

// ─── 5. AI Usage Analytics ───────────────────────────────────────

export async function getAiAnalytics(_req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalResume, totalAts, totalCover, totalLinkedin,
      totalStudy, totalNotes, totalQuiz, totalAssign, totalPpt, totalMindmap,
      totalCoding, totalSubmit, totalInterview, totalChat,
    ] = await Promise.all([
      prisma.resume.count(), prisma.aTSReport.count(), prisma.coverLetter.count(), prisma.linkedInReport.count(),
      prisma.studySession.count(), prisma.generatedNote.count(), prisma.quiz.count(), prisma.assignment.count(),
      prisma.presentation.count(), prisma.mindMap.count(),
      prisma.codingSession.count(), prisma.submission.count(), prisma.interviewSession.count(), prisma.chatSession.count(),
    ]);

    const totalRequests = totalResume + totalAts + totalCover + totalLinkedin + totalStudy + totalNotes + totalQuiz + totalAssign + totalPpt + totalMindmap + totalCoding + totalSubmit + totalInterview + totalChat;

    res.json({
      success: true,
      analytics: {
        totalRequests,
        modules: {
          resumeHub: { resumes: totalResume, atsReports: totalAts, coverLetters: totalCover, linkedinReports: totalLinkedin },
          learningHub: { studySessions: totalStudy, notes: totalNotes, quizzes: totalQuiz, assignments: totalAssign, ppts: totalPpt, mindmaps: totalMindmap },
          codingHub: { sessions: totalCoding, submissions: totalSubmit },
          interviewHub: { sessions: totalInterview },
          chat: { sessions: totalChat },
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── 6. Revenue Analytics ────────────────────────────────────────

export async function getRevenueAnalytics(_req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [payments, monthPayments, premiumUsers, totalAgg] = await Promise.all([
      prisma.payment.findMany({ where: { status: "paid" }, select: { amount: true, createdAt: true, plan: true } }),
      prisma.payment.findMany({ where: { status: "paid", createdAt: { gte: monthAgo } }, select: { amount: true, createdAt: true } }),
      prisma.user.count({ where: { subscriptionStatus: "active" } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "paid" } }),
    ]);

    const totalRevenue = totalAgg._sum.amount ?? 0;
    const monthRevenue = monthPayments.reduce((s, p) => s + p.amount, 0);

    res.json({
      success: true,
      revenue: {
        total: totalRevenue,
        month: monthRevenue,
        today: payments.filter(p => new Date(p.createdAt) >= todayStart).reduce((s, p) => s + p.amount, 0),
        premiumUsers,
        totalTransactions: payments.length,
        monthTransactions: monthPayments.length,
        averageOrderValue: payments.length > 0 ? Math.round(totalRevenue / payments.length) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── 7. System Health ────────────────────────────────────────────

export async function getSystemHealth(_req: Request, res: Response) {
  const usage = process.memoryUsage();
  const uptime = process.uptime();

  res.json({
    success: true,
    health: {
      status: "healthy",
      uptime: Math.floor(uptime),
      memory: {
        used: Math.round(usage.heapUsed / 1024 / 1024),
        total: Math.round(usage.heapTotal / 1024 / 1024),
        rss: Math.round(usage.rss / 1024 / 1024),
      },
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    },
  });
}

// ─── 8. Module Analytics ─────────────────────────────────────────

export async function getModuleAnalytics(_req: Request, res: Response, next: NextFunction) {
  try {
    const resumeModule = await Promise.all([
      prisma.resume.count(),
      prisma.aTSReport.count(),
      prisma.coverLetter.count(),
      prisma.linkedInReport.count(),
      prisma.resume.groupBy({ by: ["template"], _count: true }),
    ]);

    const learningModule = await Promise.all([
      prisma.studySession.count(),
      prisma.generatedNote.count(),
      prisma.quiz.count(),
      prisma.assignment.count(),
      prisma.presentation.count(),
      prisma.mindMap.count(),
    ]);

    const codingModule = await Promise.all([
      prisma.codingSession.count(),
      prisma.submission.count(),
      prisma.challengeSubmission.count(),
    ]);

    const interviewModule = await Promise.all([
      prisma.interviewSession.count(),
      prisma.interviewSession.count({ where: { status: "completed" } }),
      prisma.interviewSession.groupBy({ by: ["type"], _count: true }),
    ]);

    res.json({
      success: true,
      modules: {
        resumeHub: {
          total: resumeModule[0] + resumeModule[1] + resumeModule[2] + resumeModule[3],
          resumes: resumeModule[0],
          atsReports: resumeModule[1],
          coverLetters: resumeModule[2],
          linkedinReports: resumeModule[3],
          templates: resumeModule[4],
        },
        learningHub: {
          total: learningModule.reduce((a, b) => a + b, 0),
          studySessions: learningModule[0],
          notes: learningModule[1],
          quizzes: learningModule[2],
          assignments: learningModule[3],
          ppts: learningModule[4],
          mindmaps: learningModule[5],
        },
        codingHub: {
          total: codingModule.reduce((a, b) => a + b, 0),
          sessions: codingModule[0],
          submissions: codingModule[1],
          challenges: codingModule[2],
        },
        interviewHub: {
          total: interviewModule[0],
          completed: interviewModule[1],
          completionRate: interviewModule[0] > 0 ? Math.round((interviewModule[1] / interviewModule[0]) * 100) : 0,
          byType: interviewModule[2],
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── 9. Security Logs ────────────────────────────────────────────

export async function getSecurityLogs(_req: Request, res: Response) {
  res.json({
    success: true,
    security: {
      totalAdmins: 0,
      activeSessions: 0,
      failedLogins: 0,
      blockedIps: 0,
      status: "secure",
    },
  });
}
