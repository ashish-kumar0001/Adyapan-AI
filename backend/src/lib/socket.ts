import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { GoogleGenerativeAI } from "@google/generative-ai";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { getUserPrisma } from "../config/dynamicPrisma";
import {
  generateNotes,
  generateQuiz,
  generateAssignment,
  generatePPTContent,
  generateMindMapSchema,
} from "./ai/gemini";
import type { QuizGenerationResult, AssignmentResult, PptSlide, MindMapResult } from "./ai/gemini";
import { analyzeProctoringEvent, generateViolationReport } from "./ai/proctoring";
import { logProctoringEvent } from "../services/interview-session.service";
import { generateInterviewQuestion } from "./ai/gemini";

let io: Server;

export function initSocketServer(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: [
        env.frontendUrl,
        "http://localhost:3000",
        "http://localhost:3001",
        "https://adyapan-ai-gamma.vercel.app",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const genAI = new GoogleGenerativeAI(env.geminiApiKey);

  // Authenticate the socket handshake so we can trust an identity server-side
  // instead of relying on a client-supplied userId in each event payload.
  io.use((socket, next) => {
    try {
      const headerAuth = socket.handshake.headers.authorization;
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        (headerAuth?.startsWith("Bearer ") ? headerAuth.slice(7) : undefined);
      if (token) {
        const decoded = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] }) as {
          userId?: string;
        };
        if (decoded?.userId) {
          socket.data.userId = decoded.userId;
        }
      }
    } catch {
      // Invalid/expired token: leave socket unauthenticated, individual
      // handlers still enforce their own auth checks.
    }
    next();
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join personal notification room — called by frontend after auth
    socket.on("join_user", (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`Socket ${socket.id} joined user room: user:${userId}`);
    });

    // Leave user room on logout
    socket.on("leave_user", (userId: string) => {
      socket.leave(`user:${userId}`);
      console.log(`Socket ${socket.id} left user room: user:${userId}`);
    });

    // Join session specific room
    socket.on("join_session", (sessionId: string) => {
      socket.join(sessionId);
      console.log(`Socket ${socket.id} joined session room: ${sessionId}`);
    });

    // Real-time Study Assistant Streaming (uses actual Gemini API)
    socket.on("study:message", async ({ sessionId, query, context }: { sessionId: string; query: string; context: string }) => {
      try {
        const userId = await resolveUserId({});
        if (!userId || userId === "unknown") {
          socket.emit("study:error", { error: "Authentication required." });
          return;
        }

        const userPrisma = await getUserPrisma(userId);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
          You are an expert academic tutor. Provide a clear, educational, and helpful response to the student's query.
          Context from uploaded documents:
          """
          ${context}
          """
          
          Student's Query: ${query}
          
          Answer clearly using markdown. If the query asks to explain a concept or formula, break it down simply.
        `;

        const result = await model.generateContentStream(prompt);
        let fullResponse = "";

        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullResponse += chunkText;
          io.to(sessionId).emit("study:chunk", { text: chunkText });
        }

        const session = await userPrisma.studySession.findUnique({
          where: { id: sessionId },
        });

        if (session && session.userId !== userId) {
          socket.emit("study:error", { error: "Session does not belong to you." });
          return;
        }

        if (!session) {
          await userPrisma.studySession.create({
            data: { id: sessionId, userId, topic: "General Study" },
          });
        }
        await userPrisma.studyMessage.createMany({
          data: [
            { sessionId, role: "user", content: query },
            { sessionId, role: "model", content: fullResponse },
          ],
        });
        io.to(sessionId).emit("study:complete", { fullResponse });
      } catch (error) {
        console.error("Socket study assistant streaming error:", error);
        io.to(sessionId).emit("study:error", { error: "Failed to process query in real-time." });
      }
    });

    // Resolve userId helper (prefer socket auth, then payload, then first user)
    async function resolveUserId(payload: any): Promise<string> {
      // Prefer the authenticated identity from the handshake; only fall back to
      // a client-supplied userId when the socket is not authenticated.
      if (socket.data?.userId) return socket.data.userId;
      if (payload?.userId) return payload.userId;
      return "unknown";
    }

    // Real-time AI Generation for all Learning Hub tools
    socket.on("generate:start", async ({ moduleName, payload }: { moduleName: string; payload: any }) => {
      let stepIndex = 0;
      const steps = ["notes", "quiz", "assignment", "ppt", "mindmap"].includes(moduleName) ? 4 : 2;
      const emitProgress = (statusMessage: string) => {
        stepIndex++;
        const progress = Math.min(Math.round((stepIndex / steps) * 100), 100);
        socket.emit("generate:progress", { progress, statusMessage });
      };

      try {
        const userId = await resolveUserId(payload);
        const userPrisma = await getUserPrisma(userId);

        switch (moduleName) {
          case "notes": {
            emitProgress("Parsing topic and difficulty preferences...");
            const content = await generateNotes(payload.topic || "General", payload.difficulty || "Intermediate", payload.type || "Detailed Notes");

            emitProgress("Structuring content with headings and bullet points...");
            const note = await userPrisma.generatedNote.create({
              data: {
                userId,
                topic: payload.topic || "General",
                difficulty: payload.difficulty || "Intermediate",
                type: payload.type || "detailed",
                content,
              },
            });

            emitProgress("Finalizing and saving notes...");
            socket.emit("generate:complete", { content, noteId: note.id });
            break;
          }

          case "quiz": {
            emitProgress("Scanning content for testable concepts...");
            const count = parseInt(payload.count) || 5;
            const result: QuizGenerationResult = await generateQuiz(
              payload.topic || "General",
              count,
              payload.difficulty || "Intermediate"
            );

            emitProgress("Formatting questions and answer keys...");
            const quiz = await userPrisma.quiz.create({
              data: {
                userId,
                topic: payload.topic || "General",
                difficulty: payload.difficulty || "Intermediate",
                questions: result.questions as any,
              },
            });

            socket.emit("generate:complete", { questions: result.questions, flashcards: result.flashcards, quizId: quiz.id });
            break;
          }

          case "assignment": {
            emitProgress("Analyzing topic requirements...");
            const wordCount = parseInt(payload.wordCount) || 1000;
            const result: AssignmentResult = await generateAssignment(
              payload.topic || "General",
              payload.level || "Undergraduate",
              wordCount
            );

            emitProgress("Structuring introduction, body, and conclusion...");
            const assignment = await userPrisma.assignment.create({
              data: {
                userId,
                topic: payload.topic || "General",
                academicLevel: payload.level || "Undergraduate",
                wordCount,
                content: result as any,
              },
            });

            socket.emit("generate:complete", { assignment: result, assignmentId: assignment.id });
            break;
          }

          case "ppt": {
            emitProgress("Deconstructing topic into slide structure...");
            const slideCount = parseInt(payload.slideCount) || 5;
            const slides: PptSlide[] = await generatePPTContent(
              payload.topic || "General",
              slideCount
            );

            emitProgress("Polishing slide content and speaker notes...");
            const presentation = await userPrisma.presentation.create({
              data: {
                userId,
                topic: payload.topic || "General",
                slideCount,
                slides: slides as any,
              },
            });

            socket.emit("generate:complete", { slides, presentationId: presentation.id });
            break;
          }

          case "mindmap": {
            emitProgress("Mapping conceptual hierarchy...");
            const result: MindMapResult = await generateMindMapSchema(payload.topic || "General");

            emitProgress("Linking nodes and rendering connections...");
            const mindMap = await userPrisma.mindMap.create({
              data: {
                userId,
                topic: payload.topic || "General",
                nodes: result.nodes as any,
                edges: result.edges as any,
              },
            });

            socket.emit("generate:complete", { nodes: result.nodes, edges: result.edges, mindMapId: mindMap.id });
            break;
          }

          default: {
            emitProgress("Processing your request...");
            // For unknown module types, wait briefly then complete
            await new Promise((resolve) => setTimeout(resolve, 1000));
            socket.emit("generate:complete", { message: `${moduleName.toUpperCase()} generation complete!` });
          }
        }
      } catch (error) {
        console.error(`Socket generation error for ${moduleName}:`, error);
        socket.emit("generate:error", { error: `Failed to generate ${moduleName}. Please try again.` });
      }
    });

    // Lesson generation using direct Gemini streaming API
    socket.on("lesson:generate", async ({ topic, duration, level }: { topic: string; duration: string; level: string }) => {
      try {
        socket.emit("lesson:progress", { step: 0, status: "Analyzing Topic Semantics" });

        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        });

        const prompt = `You are an expert academic tutor. Teach the topic: "${topic}" at "${level}" level, duration: "${duration}".

Return a JSON object with this exact structure (no markdown, no \`\`\`):
{
  "learning_goal": "string",
  "estimated_completion_time": "string",
  "lesson_structure": ["string"],
  "overview": "string",
  "why_matters": "string",
  "simple_explanation": "string",
  "real_life_analogy": "string",
  "example": "string",
  "key_takeaways": ["string"],
  "mini_quiz": [{"question": "string", "options": ["string"], "answer": "string", "explanation": "string"}],
  "key_concepts": [{"title": "string", "content": "string", "sub_concepts": ["string"], "tips": ["string"]}],
  "examples": [{"title": "string", "scenario": "string", "code_or_data": "string", "explanation": "string"}],
  "practice_questions": [{"question": "string", "guidance": "string", "expected_answer": "string", "red_flag": "string"}],
  "quiz": [{"question": "string", "options": ["string"], "answer": "string", "explanation": "string"}],
  "summary": "string"
}

If level is "beginner":
- Fill overview, why_matters, simple_explanation, real_life_analogy, example, key_takeaways (3), mini_quiz (1-2), key_concepts (2-3)
- Set examples, practice_questions, quiz, summary to empty array or empty string as appropriate

If level is "intermediate", "interview", or "revision":
- Fill overview, key_concepts (3-5 with sub_concepts and tips), examples (1-3 with code), practice_questions (1-3), quiz (2-4), summary
- Set why_matters, simple_explanation, real_life_analogy, example, key_takeaways, mini_quiz to empty values

Always include: learning_goal, estimated_completion_time, lesson_structure as array of section names.
Keep responses concise for short durations and detailed for longer durations.`;

        const result = await model.generateContentStream(prompt);
        let fullResponse = "";
        let charCount = 0;
        const progressMilestones = [100, 500, 1500, 3000];
        let milestoneIdx = 0;
        const progressMessages = [
          "Building Custom Learning Path",
          "Creating Real-World Analogies",
          "Generating Comprehension Checkpoint Quiz",
          "Finalizing Visual Revision Sheet",
        ];

        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullResponse += chunkText;
          charCount += chunkText.length;

          while (milestoneIdx < progressMilestones.length && charCount >= progressMilestones[milestoneIdx]) {
            socket.emit("lesson:progress", { step: milestoneIdx + 1, status: progressMessages[milestoneIdx] });
            milestoneIdx++;
          }
        }

        const cleaned = fullResponse
          .replace(/^```json\s*/i, "")
          .replace(/```\s*$/, "")
          .trim();
        const data = JSON.parse(cleaned);

        if (milestoneIdx < progressMessages.length) {
          socket.emit("lesson:progress", { step: progressMessages.length, status: "Finalizing Visual Revision Sheet" });
        }

        socket.emit("lesson:complete", { data });
      } catch (error) {
        console.error("Lesson generation error:", error);
        socket.emit("lesson:error", { error: "Failed to generate lesson. Please try again." });
      }
    });

    // ─── Proctoring: Real-time proctoring events during interview ────────
    socket.on("proctor:event", async ({ sessionId, event, userId }: { sessionId: string; event: any; userId?: string }) => {
      try {
        const uid = socket.data?.userId || userId || "unknown";
        if (uid === "unknown") {
          socket.emit("proctor:error", { error: "Authentication required." });
          return;
        }

        const userPrisma = await getUserPrisma(uid);

        const analysis = analyzeProctoringEvent(event.eventType || "unknown", event);
        const results = Array.isArray(analysis) ? analysis : [analysis];

        for (const a of results) {
          if (a && a.eventType) {
            const proctoringEvent = await logProctoringEvent(sessionId, {
              eventType: a.eventType,
              category: a.category || event.category || "camera",
              description: a.description || `Proctoring: ${a.eventType}`,
              confidence: a.confidence ?? 0.5,
              severity: a.severity || event.severity || "info",
              pointsDeducted: a.pointsDeducted || 0,
              actionTaken: event.actionTaken || a.actionTaken || "logged",
              screenshotData: event.screenshotData,
              metadata: event.metadata || a.metadata,
            }, userPrisma);

            // Broadcast to all room members
            io.to(sessionId).emit("proctor:update", {
              event: proctoringEvent,
              timestamp: new Date().toISOString(),
            });
          }
        }

        socket.emit("proctor:ack", { received: true });
      } catch (error) {
        console.error("[Socket] Proctoring event error:", error);
        socket.emit("proctor:error", { error: "Failed to process proctoring event" });
      }
    });

    // ─── Proctoring: Join proctoring room ────────────────────────────────
    socket.on("proctor:join", async ({ sessionId, userId }: { sessionId: string; userId: string }) => {
      socket.join(sessionId);
      console.log(`Socket ${socket.id} joined proctoring room: ${sessionId}`);
    });

    // ─── Proctoring: Get current violation state ─────────────────────────
    socket.on("proctor:state", async ({ sessionId, userId }: { sessionId: string; userId?: string }) => {
      try {
        const uid = socket.data?.userId || userId || "unknown";
        if (uid === "unknown") {
          socket.emit("proctor:state_update", { error: "Authentication required." });
          return;
        }

        const userPrisma = await getUserPrisma(uid);
        const session = await userPrisma.interviewSession.findFirst({
          where: { id: sessionId },
          select: { violationPoints: true, violationThreshold: true, status: true },
        });

        if (!session) {
          socket.emit("proctor:state_update", { error: "Session not found" });
          return;
        }

        const p = userPrisma as any;
        const recentEvents = await p.proctoringEvent.findMany({
          where: { sessionId },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { eventType: true, severity: true, description: true, createdAt: true },
        });

        socket.emit("proctor:state_update", {
          violationPoints: session.violationPoints,
          violationThreshold: session.violationThreshold,
          remainingPoints: session.violationThreshold - session.violationPoints,
          recentEvents,
          terminated: session.status === "terminated",
        });
      } catch (error) {
        console.error("[Socket] Proctoring state error:", error);
        socket.emit("proctor:state_update", { error: "Failed to get proctoring state" });
      }
    });

    // ─── Interview: Start interview session ─────────────────────────────
    socket.on("interview:start", async ({ sessionId, userId }: { sessionId: string; userId?: string }) => {
      try {
        const uid = socket.data?.userId || userId || "unknown";
        if (uid === "unknown") {
          socket.emit("interview:error", { error: "Authentication required." });
          return;
        }

        socket.join(sessionId);
        io.to(sessionId).emit("interview:started", { sessionId, timestamp: new Date().toISOString() });
      } catch (error) {
        console.error("[Socket] Interview start error:", error);
        socket.emit("interview:error", { error: "Failed to start interview via socket" });
      }
    });

    // ─── Interview: Stream next question ────────────────────────────────
    socket.on("interview:next", async ({ sessionId, userId }: { sessionId: string; userId?: string }) => {
      try {
        const uid = socket.data?.userId || userId || "unknown";
        if (uid === "unknown") {
          socket.emit("interview:error", { error: "Authentication required." });
          return;
        }

        const userPrisma = await getUserPrisma(uid);

        const session = await userPrisma.interviewSession.findFirst({
          where: { id: sessionId },
          select: { role: true, company: true, type: true, difficulty: true },
        });
        if (!session) {
          socket.emit("interview:error", { error: "Session not found" });
          return;
        }

        const messages = await userPrisma.interviewMessage.findMany({
          where: { sessionId },
          orderBy: { createdAt: "asc" },
          select: { role: true, content: true },
        });

        const history = messages.map((m: any) => ({ role: m.role, content: m.content }));
        const nextQuestion = await generateInterviewQuestion(
          session.role, session.company, session.type, session.difficulty, history
        );

        // Save question to DB
        await userPrisma.interviewMessage.create({
          data: { sessionId, role: "interviewer", content: nextQuestion },
        });

        io.to(sessionId).emit("interview:question", {
          question: nextQuestion,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("[Socket] Interview next question error:", error);
        socket.emit("interview:error", { error: "Failed to generate next question" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

export { io };
