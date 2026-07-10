import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import type { Prisma } from "@prisma/client";
import {
  generateInterviewQuestion,
  generateInterviewFeedback,
} from "../lib/ai/gemini";
import { getUserPrismaFromRequest } from "../utils/prisma";

export const interviewRouter = Router();

interviewRouter.use(requireAuth);

// Start a new interview session
interviewRouter.post("/start", async (req, res) => {
  try {
    const { role, company, type, difficulty } = req.body;
    if (!role || !type) {
      res.status(400).json({ error: "Role and type are required" });
      return;
    }

    const userPrisma = await getUserPrismaFromRequest(req);
    const session = await userPrisma.interviewSession.create({
      data: {
        userId: req.user!.userId,
        role,
        company: company || null,
        type,
        difficulty: difficulty || "medium",
      },
    });

    // Generate first question
    const question = await generateInterviewQuestion(role, company, type, difficulty || "medium", []);

    // Save interviewer message
    await userPrisma.interviewMessage.create({
      data: {
        sessionId: session.id,
        role: "interviewer",
        content: question,
      },
    });

    const messages = await userPrisma.interviewMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "asc" },
    });

    res.json({ success: true, session, messages, lastQuestion: question });
  } catch (error) {
    console.error("Error starting interview:", error);
    res.status(500).json({ error: "Failed to start interview" });
  }
});

// Send answer and get next question
interviewRouter.post("/:sessionId/answer", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answer } = req.body;

    if (!answer) {
      res.status(400).json({ error: "Answer is required" });
      return;
    }

    const userPrisma = await getUserPrismaFromRequest(req);

    // Verify session belongs to user
    const session = await userPrisma.interviewSession.findFirst({
      where: { id: sessionId, userId: req.user!.userId },
    });

    if (!session) {
      res.status(404).json({ error: "Interview session not found" });
      return;
    }

    if (session.status === "completed") {
      res.status(400).json({ error: "Interview session is already completed" });
      return;
    }

    // Save user answer
    await userPrisma.interviewMessage.create({
      data: {
        sessionId,
        role: "user",
        content: answer,
      },
    });

    // Get conversation history
    const messages = await userPrisma.interviewMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    // Generate next question
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    const nextQuestion = await generateInterviewQuestion(
      session.role,
      session.company,
      session.type,
      session.difficulty,
      history
    );

    // Save interviewer message
    await userPrisma.interviewMessage.create({
      data: {
        sessionId,
        role: "interviewer",
        content: nextQuestion,
      },
    });

    const updatedMessages = await userPrisma.interviewMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    res.json({ success: true, messages: updatedMessages, lastQuestion: nextQuestion });
  } catch (error) {
    console.error("Error processing answer:", error);
    res.status(500).json({ error: "Failed to process answer" });
  }
});

// End interview and get feedback
interviewRouter.post("/:sessionId/end", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const userPrisma = await getUserPrismaFromRequest(req);
    const session = await userPrisma.interviewSession.findFirst({
      where: { id: sessionId, userId: req.user!.userId },
    });

    if (!session) {
      res.status(404).json({ error: "Interview session not found" });
      return;
    }

    if (session.status === "completed") {
      res.json({ success: true, session });
      return;
    }

    // Get all messages
    const messages = await userPrisma.interviewMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    // Generate feedback
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    const feedback = await generateInterviewFeedback(
      session.role,
      session.company,
      session.type,
      history
    );

    // Save feedback message
    await userPrisma.interviewMessage.create({
      data: {
        sessionId,
        role: "feedback",
        content: JSON.stringify(feedback),
      },
    });

    // Update session
    const updated = await userPrisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: "completed",
        feedback: feedback as unknown as Prisma.InputJsonValue,
      },
    });

    res.json({ success: true, session: updated, feedback });
  } catch (error) {
    console.error("Error ending interview:", error);
    res.status(500).json({ error: "Failed to end interview" });
  }
});

// Get interview history
interviewRouter.get("/history", async (req, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const sessions = await userPrisma.interviewSession.findMany({
      where: { userId: req.user!.userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, sessions });
  } catch (error) {
    console.error("Error fetching interview history:", error);
    res.status(500).json({ error: "Failed to fetch interview history" });
  }
});

// Get single session
interviewRouter.get("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userPrisma = await getUserPrismaFromRequest(req);
    const session = await userPrisma.interviewSession.findFirst({
      where: { id: sessionId, userId: req.user!.userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!session) {
      res.status(404).json({ error: "Interview session not found" });
      return;
    }

    res.json({ success: true, session });
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});
