import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import {
  generateNotes,
  generateQuiz,
  generateAssignment,
  generatePPTContent,
  generateMindMapSchema,
} from "./ai/gemini";
import type { QuizGenerationResult, AssignmentResult, PptSlide, MindMapResult } from "./ai/gemini";

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

        let session = await prisma.studySession.findUnique({
          where: { id: sessionId },
        });

        if (!session) {
          const firstUser = await prisma.user.findFirst();
          if (firstUser) {
            session = await prisma.studySession.create({
              data: {
                id: sessionId,
                userId: firstUser.id,
                topic: "General Study",
              },
            });
          }
        }

        if (session) {
          await prisma.studyMessage.create({
            data: { sessionId, role: "user", content: query },
          });
          await prisma.studyMessage.create({
            data: { sessionId, role: "model", content: fullResponse },
          });
        }

        io.to(sessionId).emit("study:complete", { fullResponse });

      } catch (error) {
        console.error("Socket study assistant streaming error:", error);
        io.to(sessionId).emit("study:error", { error: "Failed to process query in real-time." });
      }
    });

    // Resolve userId helper (prefer socket auth, then payload, then first user)
    async function resolveUserId(payload: any): Promise<string> {
      if (payload.userId) return payload.userId;
      if (socket.data?.userId) return socket.data.userId;
      const firstUser = await prisma.user.findFirst();
      return firstUser?.id || "unknown";
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

        switch (moduleName) {
          case "notes": {
            emitProgress("Parsing topic and difficulty preferences...");
            const content = await generateNotes(payload.topic || "General", payload.difficulty || "Intermediate", payload.type || "Detailed Notes");

            emitProgress("Structuring content with headings and bullet points...");
            const note = await prisma.generatedNote.create({
              data: {
                userId,
                topic: payload.topic || "General",
                difficulty: payload.difficulty || "Intermediate",
                type: payload.type || "detailed",
                content,
              },
            });

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
            const quiz = await prisma.quiz.create({
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
            const assignment = await prisma.assignment.create({
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
            const presentation = await prisma.presentation.create({
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
            const mindMap = await prisma.mindMap.create({
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

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

export { io };
