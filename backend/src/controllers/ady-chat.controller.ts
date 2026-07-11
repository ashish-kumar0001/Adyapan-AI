import type { NextFunction, Request, Response } from "express";
import { httpError } from "../utils/httpError";
import { streamChat } from "../lib/ai/ady-chat";
import type { ChatModelId } from "../lib/ai/openrouter";
import multer from "multer";
const pdfParse = require("pdf-parse");
import mammoth from "mammoth";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { StreakService } from "../services/streak.service";

// ─── File Upload Middleware ────────────────────────────────────────────

const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const uploadChatFile = uploadMemory.single("file");

async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  const mimeType = file.mimetype;
  if (mimeType === "application/pdf") {
    const parsed = await pdfParse(file.buffer);
    return parsed.text;
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    return parsed.value;
  } else if (mimeType.startsWith("text/")) {
    return file.buffer.toString("utf-8");
  }
  throw httpError(400, "Unsupported file format. Upload PDF, DOCX, or text.");
}

// ─── Helpers ───────────────────────────────────────────────────────────

function buildChatHistory(messages: { role: string; content: string }[]) {
  return messages.map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
}

// ─── 1. List Sessions ──────────────────────────────────────────────────

export async function listSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const userPrisma = await getUserPrismaFromRequest(req);
    const sessions = await userPrisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, model: true, createdAt: true, updatedAt: true },
    });

    res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
}

// ─── 2. Create Session ─────────────────────────────────────────────────

export async function createSession(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const { title, model } = req.body;

    const userPrisma = await getUserPrismaFromRequest(req);
    const session = await userPrisma.chatSession.create({
      data: {
        userId,
        title: title || "New Chat",
        model: model || "openai/gpt-4o-mini",
      },
    });

    res.status(201).json({ success: true, session });
  } catch (error) {
    next(error);
  }
}

// ─── 3. Get Session Messages ───────────────────────────────────────────

export async function getSession(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");
    const id = req.params.id as string;

    const userPrisma = await getUserPrismaFromRequest(req);
    const session = await userPrisma.chatSession.findFirst({
      where: { id, userId },
    });
    if (!session) throw httpError(404, "Session not found");

    const messages = await userPrisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "asc" },
    });

    res.json({ success: true, session, messages });
  } catch (error) {
    next(error);
  }
}

// ─── 4. Delete Session ─────────────────────────────────────────────────

export async function deleteSession(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");
    const id = req.params.id as string;

    const userPrisma = await getUserPrismaFromRequest(req);
    const session = await userPrisma.chatSession.findFirst({
      where: { id, userId },
    });
    if (!session) throw httpError(404, "Session not found");

    await userPrisma.chatSession.delete({ where: { id: session.id } });
    res.json({ success: true, message: "Session deleted" });
  } catch (error) {
    next(error);
  }
}

// ─── 5. Update Session Title ───────────────────────────────────────────

export async function updateSession(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");
    const id = req.params.id as string;

    const { title, model } = req.body;
    const userPrisma = await getUserPrismaFromRequest(req);
    const session = await userPrisma.chatSession.findFirst({
      where: { id, userId },
    });
    if (!session) throw httpError(404, "Session not found");

    const updated = await userPrisma.chatSession.update({
      where: { id: session.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(model !== undefined ? { model } : {}),
      },
    });

    res.json({ success: true, session: updated });
  } catch (error) {
    next(error);
  }
}

// ─── 6. Send Message (Streaming) ───────────────────────────────────────

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const { sessionId, message, model } = req.body;
    if (!sessionId || !message) throw httpError(400, "sessionId and message are required");

    const userPrisma = await getUserPrismaFromRequest(req);
    const session = await userPrisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!session) throw httpError(404, "Session not found");

    const selectedModel = model || session.model;

    // Save user message
    await userPrisma.chatMessage.create({
      data: { sessionId: session.id, role: "user", content: message },
    });

    // Track Streak Activity
    const tz = (req.headers["x-timezone"] as string) || "UTC";
    StreakService.trackActivity(
      userId,
      "AI_CHAT_SESSION",
      "ady_chat",
      null,
      10, // 10 points
      tz,
      userPrisma
    ).catch(err => console.error("Streak tracking error:", err));

    // Update session title from first message if still default
    if (session.title === "New Chat" && session.messages.length === 0) {
      await userPrisma.chatSession.update({
        where: { id: session.id },
        data: { title: message.slice(0, 80) + (message.length > 80 ? "..." : ""), model: selectedModel },
      });
    }

    // Set up SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    // Build message history
    const allMessages = [
      { role: "system" as const, content: "You are Ady, an AI assistant. Help the user with their questions. Be concise, accurate, and friendly." },
      ...buildChatHistory(session.messages),
      { role: "user" as const, content: message },
    ];

    let fullResponse = "";

    await streamChat(allMessages, selectedModel as ChatModelId, {
      onChunk(text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ type: "chunk", text })}\n\n`);
      },
      onDone() {
        // Save assistant message
        userPrisma.chatMessage.create({
          data: { sessionId: session.id, role: "assistant", content: fullResponse },
        }).catch(err => console.error("Failed to save chat message:", err));

        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        res.end();
      },
      onError(error) {
        console.error("Chat stream error:", error);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: error.message });
        } else {
          res.write(`data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`);
          res.end();
        }
      },
    });
  } catch (error) {
    if (!res.headersSent) {
      next(error);
    } else {
      res.write(`data: ${JSON.stringify({ type: "error", message: "Internal error" })}\n\n`);
      res.end();
    }
  }
}

// ─── 7. Upload File for Context ────────────────────────────────────────

export async function uploadFile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    if (!req.file) throw httpError(400, "No file uploaded");

    const text = await extractTextFromFile(req.file);

    res.json({
      success: true,
      filename: req.file.originalname,
      text: text.slice(0, 10000), // limit context
      mimeType: req.file.mimetype,
    });
  } catch (error) {
    next(error);
  }
}
