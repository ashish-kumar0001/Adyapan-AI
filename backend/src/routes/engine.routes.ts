import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { generateEngineQuestion, generateEngineEvaluation } from "../lib/ai/engine-question.service";
import { handleRouteError } from "../utils/routeError";

export const engineRouter = Router();

engineRouter.use(requireAuth);

// ─── Start new engine interview session ──────────────────────────────────
engineRouter.post("/start", async (req, res) => {
  try {
    const {
      interviewType, targetRole, targetCompany, difficulty,
      experienceLevel, durationMinutes, technology, language,
      aiVoiceEnabled, voiceGender, voiceSpeed, voicePitch,
      resumeAware, customInstructions,
    } = req.body;

    if (!targetRole) {
      res.status(400).json({ success: false, error: "Target role is required" });
      return;
    }

    const prisma = await getUserPrismaFromRequest(req);
    const p = prisma as any;

    const session = await p.interviewSession.create({
      data: {
        userId: req.user!.userId,
        role: targetRole,
        company: targetCompany || null,
        type: interviewType || "technical",
        difficulty: difficulty || "medium",
        language: language || "english",
        durationMinutes: durationMinutes || 30,
        technology: technology || null,
        aiVoiceEnabled: aiVoiceEnabled !== false,
        videoEnabled: false,
        status: "in_progress",
        violationPoints: 0,
        violationThreshold: 10,
        startedAt: new Date(),
        configuration: {
          interviewType: interviewType || "technical",
          targetRole,
          targetCompany: targetCompany || null,
          difficulty: difficulty || "medium",
          experienceLevel: experienceLevel || "mid",
          durationMinutes: durationMinutes || 30,
          technology: technology || null,
          language: language || "english",
          aiVoiceEnabled: aiVoiceEnabled !== false,
          voiceGender: voiceGender || "female",
          voiceSpeed: voiceSpeed || 1,
          voicePitch: voicePitch || 1,
          resumeAware: resumeAware !== false,
          customInstructions: customInstructions || "",
        },
      },
    });

    let resumeContext = null;
    if (resumeAware) {
      const resume = await p.resume.findFirst({
        where: { userId: req.user!.userId },
      });
      if (resume) {
        resumeContext = resume.summary || resume.content || null;
      }
    }

    const firstQuestion = await generateEngineQuestion({
      role: targetRole,
      company: targetCompany || "",
      type: interviewType || "technical",
      difficulty: difficulty || "medium",
      technology: technology || "",
      language: language || "english",
      experienceLevel: experienceLevel || "mid",
      history: [],
      resumeContext: resumeContext || "",
      customInstructions: customInstructions || "",
    });

    await p.interviewMessage.create({
      data: {
        sessionId: session.id,
        role: "interviewer",
        content: firstQuestion,
      },
    });

    const messages = await p.interviewMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, role: true, content: true, createdAt: true },
    });

    res.json({
      success: true,
      session,
      messages,
      firstQuestion,
      resumeContext,
    });
  } catch (error) {
    handleRouteError(res, error, "Engine.start", "Failed to start engine interview");
  }
});

// ─── Submit answer and get next question ─────────────────────────────────
engineRouter.post("/:sessionId/answer", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answer } = req.body;

    if (!answer) {
      res.status(400).json({ success: false, error: "Answer is required" });
      return;
    }

    const prisma = await getUserPrismaFromRequest(req);
    const p = prisma as any;

    const session = await p.interviewSession.findFirst({
      where: { id: sessionId, userId: req.user!.userId },
    });
    if (!session) {
      res.status(404).json({ success: false, error: "Interview session not found" });
      return;
    }

    if (session.status === "completed" || session.status === "terminated") {
      res.status(400).json({ success: false, error: "This interview session has already ended" });
      return;
    }

    await p.interviewMessage.create({
      data: {
        sessionId,
        role: "candidate",
        content: answer,
      },
    });

    const allMessages = await p.interviewMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
    });

    const history = allMessages.map((m: any) => ({ role: m.role, content: m.content }));

    const config = session.configuration || {};
    let resumeContext = null;
    if (config.resumeAware) {
      const resume = await p.resume.findFirst({
        where: { userId: req.user!.userId },
      });
      if (resume) {
        resumeContext = resume.summary || resume.content || null;
      }
    }

    const questionCount = allMessages.filter((m: any) => m.role === "interviewer").length;
    const elapsedMinutes = Math.round(
      (Date.now() - new Date(session.startedAt).getTime()) / 60000
    );
    const isComplete = questionCount >= 15 || elapsedMinutes >= (session.durationMinutes || 30);

    if (isComplete) {
      res.json({
        success: true,
        messages: await p.interviewMessage.findMany({
          where: { sessionId },
          orderBy: { createdAt: "asc" },
          select: { id: true, role: true, content: true, createdAt: true },
        }),
        nextQuestion: null,
        isComplete: true,
        questionNumber: questionCount,
      });
      return;
    }

    const nextQuestion = await generateEngineQuestion({
      role: session.role,
      company: session.company || "",
      type: session.type || "technical",
      difficulty: session.difficulty || "medium",
      technology: session.technology || "",
      language: session.language || "english",
      experienceLevel: config.experienceLevel || "mid",
      history,
      resumeContext: resumeContext || "",
      customInstructions: config.customInstructions || "",
    });

    await p.interviewMessage.create({
      data: {
        sessionId,
        role: "interviewer",
        content: nextQuestion,
      },
    });

    const updatedMessages = await p.interviewMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      select: { id: true, role: true, content: true, createdAt: true },
    });

    res.json({
      success: true,
      messages: updatedMessages,
      nextQuestion,
      isComplete: false,
      questionNumber: questionCount + 1,
    });
  } catch (error) {
    handleRouteError(res, error, "Engine.answer", "Failed to process answer");
  }
});

// ─── Voice input endpoint ────────────────────────────────────────────────
engineRouter.post("/:sessionId/voice", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { text, duration } = req.body;

    if (!text) {
      res.status(400).json({ success: false, error: "Text is required" });
      return;
    }

    const prisma = await getUserPrismaFromRequest(req);
    const p = prisma as any;

    const session = await p.interviewSession.findFirst({
      where: { id: sessionId, userId: req.user!.userId },
    });
    if (!session) {
      res.status(404).json({ success: false, error: "Interview session not found" });
      return;
    }

    if (session.status === "completed" || session.status === "terminated") {
      res.status(400).json({ success: false, error: "This interview session has already ended" });
      return;
    }

    await p.interviewMessage.create({
      data: {
        sessionId,
        role: "candidate",
        content: text,
        audioUrl: req.body.audioUrl || null,
        duration: duration || null,
      },
    });

    const allMessages = await p.interviewMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
    });

    const history = allMessages.map((m: any) => ({ role: m.role, content: m.content }));

    const config = session.configuration || {};
    let resumeContext = null;
    if (config.resumeAware) {
      const resume = await p.resume.findFirst({
        where: { userId: req.user!.userId },
      });
      if (resume) {
        resumeContext = resume.summary || resume.content || null;
      }
    }

    const questionCount = allMessages.filter((m: any) => m.role === "interviewer").length;
    const elapsedMinutes = Math.round(
      (Date.now() - new Date(session.startedAt).getTime()) / 60000
    );
    const isComplete = questionCount >= 15 || elapsedMinutes >= (session.durationMinutes || 30);

    if (isComplete) {
      res.json({
        success: true,
        messages: await p.interviewMessage.findMany({
          where: { sessionId },
          orderBy: { createdAt: "asc" },
          select: { id: true, role: true, content: true, createdAt: true },
        }),
        nextQuestion: null,
        isComplete: true,
        questionNumber: questionCount,
      });
      return;
    }

    const nextQuestion = await generateEngineQuestion({
      role: session.role,
      company: session.company || "",
      type: session.type || "technical",
      difficulty: session.difficulty || "medium",
      technology: session.technology || "",
      language: session.language || "english",
      experienceLevel: config.experienceLevel || "mid",
      history,
      resumeContext: resumeContext || "",
      customInstructions: config.customInstructions || "",
    });

    await p.interviewMessage.create({
      data: {
        sessionId,
        role: "interviewer",
        content: nextQuestion,
      },
    });

    const updatedMessages = await p.interviewMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      select: { id: true, role: true, content: true, createdAt: true },
    });

    res.json({
      success: true,
      messages: updatedMessages,
      nextQuestion,
      isComplete: false,
      questionNumber: questionCount + 1,
    });
  } catch (error) {
    handleRouteError(res, error, "Engine.voice", "Failed to process voice input");
  }
});

// ─── Evaluate interview ──────────────────────────────────────────────────
engineRouter.post("/:sessionId/evaluate", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const prisma = await getUserPrismaFromRequest(req);
    const p = prisma as any;

    const session = await p.interviewSession.findFirst({
      where: { id: sessionId, userId: req.user!.userId },
    });
    if (!session) {
      res.status(404).json({ success: false, error: "Interview session not found" });
      return;
    }

    const messages = await p.interviewMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
    });

    if (messages.length === 0) {
      res.status(400).json({ success: false, error: "No messages to evaluate" });
      return;
    }

    let resumeContext = null;
    const config = session.configuration || {};
    if (config.resumeAware) {
      const resume = await p.resume.findFirst({
        where: { userId: req.user!.userId },
      });
      if (resume) {
        resumeContext = resume.summary || resume.content || null;
      }
    }

    const history = messages.map((m: any) => ({ role: m.role, content: m.content }));

    const evaluation = await generateEngineEvaluation({
      role: session.role,
      company: session.company || "",
      type: session.type || "technical",
      difficulty: session.difficulty || "medium",
      technology: session.technology || "",
      language: session.language || "english",
      history,
      resumeContext: resumeContext || "",
    });

    await p.interviewEvaluation.create({
      data: {
        sessionId,
        overallScore: evaluation.overallScore || 0,
        communicationScore: evaluation.communicationScore || 0,
        technicalScore: evaluation.technicalScore || 0,
        hrScore: evaluation.hrScore || 0,
        confidenceScore: evaluation.confidenceScore || 0,
        fluencyScore: evaluation.fluencyScore || 0,
        bodyLanguageScore: evaluation.bodyLanguageScore || 0,
        strengths: evaluation.strengths || [],
        weaknesses: evaluation.weaknesses || [],
        improvements: evaluation.improvements || [],
        summary: evaluation.summary || "",
        hiringRecommendation: evaluation.hiringRecommendation || "maybe",
        detailedAnalysis: evaluation.detailedAnalysis || null,
      },
    });

    const endedAt = new Date();
    const updatedSession = await p.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: "completed",
        endedAt,
        feedback: evaluation.summary || "",
      },
    });

    const savedEvaluation = await p.interviewEvaluation.findFirst({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      evaluation: savedEvaluation,
      session: updatedSession,
    });
  } catch (error) {
    handleRouteError(res, error, "Engine.evaluate", "Failed to evaluate interview");
  }
});

// ─── End interview (early termination) ───────────────────────────────────
engineRouter.post("/:sessionId/end", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const prisma = await getUserPrismaFromRequest(req);
    const p = prisma as any;

    const session = await p.interviewSession.findFirst({
      where: { id: sessionId, userId: req.user!.userId },
    });
    if (!session) {
      res.status(404).json({ success: false, error: "Interview session not found" });
      return;
    }

    const endedAt = new Date();
    const updatedSession = await p.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: "terminated",
        endedAt,
      },
    });

    const messages = await p.interviewMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
    });

    let evaluation = null;
    if (messages.length >= 3) {
      let resumeContext = null;
      const config = session.configuration || {};
      if (config.resumeAware) {
        const resume = await p.resume.findFirst({
          where: { userId: req.user!.userId },
        });
        if (resume) {
          resumeContext = resume.summary || resume.content || null;
        }
      }

      const history = messages.map((m: any) => ({ role: m.role, content: m.content }));

      const partialEvaluation = await generateEngineEvaluation({
        role: session.role,
        company: session.company || "",
        type: session.type || "technical",
        difficulty: session.difficulty || "medium",
        technology: session.technology || "",
        language: session.language || "english",
        history,
        resumeContext: resumeContext || "",
      });

      evaluation = await p.interviewEvaluation.create({
        data: {
          sessionId,
          overallScore: partialEvaluation.overallScore || 0,
          communicationScore: partialEvaluation.communicationScore || 0,
          technicalScore: partialEvaluation.technicalScore || 0,
          hrScore: partialEvaluation.hrScore || 0,
          confidenceScore: partialEvaluation.confidenceScore || 0,
          fluencyScore: partialEvaluation.fluencyScore || 0,
          bodyLanguageScore: partialEvaluation.bodyLanguageScore || 0,
          strengths: partialEvaluation.strengths || [],
          weaknesses: partialEvaluation.weaknesses || [],
          improvements: partialEvaluation.improvements || [],
          summary: partialEvaluation.summary || "Interview terminated early.",
          hiringRecommendation: partialEvaluation.hiringRecommendation || "maybe",
          detailedAnalysis: partialEvaluation.detailedAnalysis || null,
        },
      });
    }

    res.json({
      success: true,
      session: updatedSession,
      evaluation,
    });
  } catch (error) {
    handleRouteError(res, error, "Engine.end", "Failed to end interview");
  }
});

// ─── Analytics endpoint ──────────────────────────────────────────────────
engineRouter.get("/analytics", async (req, res) => {
  try {
    const prisma = await getUserPrismaFromRequest(req);
    const p = prisma as any;

    const sessions = await p.interviewSession.findMany({
      where: { userId: req.user!.userId },
      include: {
        evaluations: { take: 1 },
        messages: { select: { createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const completed = sessions.filter((s: any) => s.evaluations?.[0]);

    const totalSessions = sessions.length;
    const completedSessions = completed.length;
    const avgScore = completed.length
      ? Math.round(
          completed.reduce(
            (a: number, s: any) => a + (s.evaluations?.[0]?.overallScore || 0),
            0,
          ) / completed.length,
        )
      : 0;
    const bestScore = completed.length
      ? Math.max(
          ...completed.map((s: any) => s.evaluations?.[0]?.overallScore || 0),
        )
      : 0;

    const now = new Date();
    const weeklyTrend = Array.from({ length: 8 }, (_, i) => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7 * (7 - i));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekSessions = completed.filter((s: any) => {
        const d = new Date(s.createdAt);
        return d >= weekStart && d < weekEnd;
      });

      const weekAvg = weekSessions.length
        ? Math.round(
            weekSessions.reduce(
              (a: number, s: any) =>
                a + (s.evaluations?.[0]?.overallScore || 0),
              0,
            ) / weekSessions.length,
          )
        : null;

      return {
        week: `W${i + 1}`,
        date: weekStart.toISOString().split("T")[0],
        sessions: weekSessions.length,
        avgScore: weekAvg,
      };
    });

    const typeBreakdown = ["technical", "behavioral", "general"].map((type) => {
      const typeSessions = completed.filter((s: any) => s.type === type);
      return {
        type,
        count: typeSessions.length,
        avgScore: typeSessions.length
          ? Math.round(
              typeSessions.reduce(
                (a: number, s: any) =>
                  a + (s.evaluations?.[0]?.overallScore || 0),
                0,
              ) / typeSessions.length,
            )
          : 0,
      };
    });

    const roleMap = new Map<string, { count: number; totalScore: number }>();
    for (const s of completed) {
      const r = s.role || "Unknown";
      const entry = roleMap.get(r) || { count: 0, totalScore: 0 };
      entry.count += 1;
      entry.totalScore += s.evaluations?.[0]?.overallScore || 0;
      roleMap.set(r, entry);
    }
    const roleBreakdown = Array.from(roleMap.entries()).map(([role, data]) => ({
      role,
      count: data.count,
      avgScore: Math.round(data.totalScore / data.count),
    }));

    const firstHalf = completed.slice(
      Math.floor(completed.length / 2),
    );
    const secondHalf = completed.slice(
      0,
      Math.floor(completed.length / 2),
    );
    const firstAvg = firstHalf.length
      ? Math.round(
          firstHalf.reduce(
            (a: number, s: any) =>
              a + (s.evaluations?.[0]?.overallScore || 0),
            0,
          ) / firstHalf.length,
        )
      : 0;
    const secondAvg = secondHalf.length
      ? Math.round(
          secondHalf.reduce(
            (a: number, s: any) =>
              a + (s.evaluations?.[0]?.overallScore || 0),
            0,
          ) / secondHalf.length,
        )
      : 0;
    const improvementMetrics = {
      recentAvgScore: secondAvg,
      olderAvgScore: firstAvg,
      improvement: secondAvg - firstAvg,
      totalPracticeHours: Math.round(
        sessions.reduce((a: number, s: any) => a + (s.durationMinutes || 0), 0) / 60,
      ),
    };

    res.json({
      success: true,
      analytics: {
        totalSessions,
        completedSessions,
        avgScore,
        bestScore,
        weeklyTrend,
        typeBreakdown,
        roleBreakdown,
        improvementMetrics,
      },
    });
  } catch (error) {
    handleRouteError(res, error, "Engine.analytics", "Failed to fetch analytics");
  }
});

// ─── Interview history ───────────────────────────────────────────────────
engineRouter.get("/history", async (req, res) => {
  try {
    const prisma = await getUserPrismaFromRequest(req);
    const p = prisma as any;

    const sessions = await p.interviewSession.findMany({
      where: { userId: req.user!.userId },
      include: {
        evaluations: { take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const summaries = sessions.map((s: any) => ({
      id: s.id,
      type: s.type,
      role: s.role,
      company: s.company,
      difficulty: s.difficulty,
      technology: s.technology,
      language: s.language,
      status: s.status,
      overallScore: s.evaluations?.[0]?.overallScore || null,
      evaluation: s.evaluations?.[0] || null,
      createdAt: s.createdAt,
      endedAt: s.endedAt,
      duration: s.endedAt
        ? Math.round(
            (new Date(s.endedAt).getTime() - new Date(s.createdAt).getTime()) /
              60000,
          )
        : 0,
    }));

    res.json({ success: true, sessions: summaries });
  } catch (error) {
    handleRouteError(res, error, "Engine.history", "Failed to fetch interview history");
  }
});

// ─── Get full session with messages and evaluation ───────────────────────
engineRouter.get("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const prisma = await getUserPrismaFromRequest(req);
    const p = prisma as any;

    const session = await p.interviewSession.findFirst({
      where: { id: sessionId, userId: req.user!.userId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        evaluations: true,
      },
    });

    if (!session) {
      res.status(404).json({ success: false, error: "Interview session not found" });
      return;
    }

    res.json({ success: true, session });
  } catch (error) {
    handleRouteError(res, error, "Engine.getSession", "Failed to fetch session");
  }
});

// ─── Detailed report with answer breakdowns ──────────────────────────────
engineRouter.get("/:sessionId/report", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const prisma = await getUserPrismaFromRequest(req);
    const p = prisma as any;

    const session = await p.interviewSession.findFirst({
      where: { id: sessionId, userId: req.user!.userId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        evaluations: { take: 1 },
      },
    });

    if (!session) {
      res.status(404).json({ success: false, error: "Interview session not found" });
      return;
    }

    const evaluation = session.evaluations?.[0] || null;

    const questionPairs: Array<{
      questionNumber: number;
      question: string;
      answer: string;
    }> = [];

    const interviewerMsgs = session.messages.filter(
      (m: any) => m.role === "interviewer",
    );
    const candidateMsgs = session.messages.filter(
      (m: any) => m.role === "candidate",
    );

    for (let i = 0; i < interviewerMsgs.length; i++) {
      questionPairs.push({
        questionNumber: i + 1,
        question: interviewerMsgs[i].content,
        answer: candidateMsgs[i]?.content || "No answer provided",
      });
    }

    const duration = session.endedAt
      ? Math.round(
          (new Date(session.endedAt).getTime() -
            new Date(session.createdAt).getTime()) /
            60000,
        )
      : 0;

    res.json({
      success: true,
      report: {
        sessionId: session.id,
        role: session.role,
        company: session.company,
        type: session.type,
        difficulty: session.difficulty,
        technology: session.technology,
        language: session.language,
        status: session.status,
        createdAt: session.createdAt,
        endedAt: session.endedAt,
        duration,
        configuration: session.configuration,
        evaluation,
        questionPairs,
        totalQuestions: interviewerMsgs.length,
        totalAnswers: candidateMsgs.length,
      },
    });
  } catch (error) {
    handleRouteError(res, error, "Engine.report", "Failed to fetch report data");
  }
});
