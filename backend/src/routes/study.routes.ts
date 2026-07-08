import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generateStudyResponse, generateLearnLesson } from "../lib/ai/gemini";
import { prisma } from "../config/prisma";
import { generateJSON } from "../lib/ai/openrouter";
import { env } from "../config/env";
import multer from "multer";
const { PDFParse } = require("pdf-parse");
import mammoth from "mammoth";

const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const studyRouter = Router();

studyRouter.use(requireAuth);

async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  const mimeType = file.mimetype;
  if (mimeType === "application/pdf") {
    const pdf = new PDFParse({ data: file.buffer });
    const result = await pdf.getText();
    return result.text;
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    return parsed.value;
  } else {
    return file.buffer.toString("utf-8");
  }
}

studyRouter.post("/upload", async (req, res) => {
  try {
    const { fileName, fileType, fileUrl, content } = req.body;
    const doc = await prisma.uploadedDocument.create({
      data: {
        userId: req.user!.userId,
        fileName,
        fileType,
        fileUrl,
      },
    });
    res.json({ success: true, doc });
  } catch (error) {
    res.status(500).json({ error: "Failed to upload document" });
  }
});

studyRouter.post("/chat", async (req, res) => {
  try {
    const { query, context } = req.body;
    const responseText = await generateStudyResponse(context || "", query);
    res.json({ success: true, response: responseText });
  } catch (error) {
    res.status(500).json({ error: "Chat processing failed" });
  }
});

// Analyze uploaded document using Gemini - returns structured summary
studyRouter.post("/analyze", uploadMemory.single("file"), async (req, res) => {
  try {
    let documentText = req.body.documentText as string | undefined;

    // If a file was uploaded, extract text from it
    if (!documentText && req.file) {
      documentText = await extractTextFromFile(req.file);
    }

    if (!documentText) {
      return res.status(400).json({ error: "Document text or file is required" });
    }

    const prompt = `You are an expert academic tutor. Analyze the following document text and return a structured JSON summary.

Document Text:
"""
${documentText.slice(0, 100000)}
"""

Return a JSON object with this exact structure:
{
  "title": "Document title or subject",
  "stats": { "pages": number, "words": number, "topicsFound": number, "readingTime": string, "summaryLength": string },
  "insights": { "mainSubject": string, "difficultyLevel": string, "estimatedStudyTime": string, "importantChapters": [string], "repeatedTopics": [string] },
  "topics": [
    {
      "name": string,
      "overview": string,
      "keyConcepts": [string],
      "importantPoints": [string],
      "quickRevision": string,
      "keywords": [string]
    }
  ]
}

Extract 3-6 major topics from the document. Be thorough and educational. Return ONLY valid JSON.`;

    const analysis = await generateJSON(
      "You are an expert academic tutor. Analyze the document and return a structured JSON summary.",
      prompt,
      { model: "google/gemini-2.5-flash", maxTokens: 8192 },
      null
    );

    if (!analysis) {
      return res.status(500).json({ error: "Failed to generate study document summary." });
    }

    res.json({ success: true, analysis });
  } catch (error) {
    console.error("Document analysis error:", error);
    res.status(500).json({ error: "Failed to analyze document. Please try again." });
  }
});

// Generate AI lesson on a topic (migrated from learn module)
studyRouter.post("/generate-lesson", async (req, res) => {
  try {
    const { topic, duration, level } = req.body;
    const result = await generateLearnLesson(topic, duration || "10m", level || "intermediate");
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: "Lesson generation failed" });
  }
});

// Get study sessions with messages
studyRouter.get("/sessions", async (req, res) => {
  try {
    const sessions = await prisma.studySession.findMany({
      where: { userId: req.user!.userId },
      include: { messages: true, documents: true },
      orderBy: { updatedAt: "desc" },
    });
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

studyRouter.get("/history", async (req, res) => {
  try {
    const sessions = await prisma.studySession.findMany({
      where: { userId: req.user!.userId },
      include: { messages: true },
    });
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});
