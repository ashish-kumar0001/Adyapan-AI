import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generateStudyResponse } from "../lib/ai/gemini";
import { prisma } from "../config/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";

export const studyRouter = Router();

studyRouter.use(requireAuth);

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
studyRouter.post("/analyze", async (req, res) => {
  try {
    const { documentId, documentText } = req.body;
    if (!documentText) {
      return res.status(400).json({ error: "Document text is required" });
    }

    const genAI = new GoogleGenerativeAI(env.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert academic tutor. Analyze the following document text and return a structured JSON summary.

Document Text:
"""
${documentText.slice(0, 30000)}
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

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the JSON from the response
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const analysis = JSON.parse(cleaned);

    res.json({ success: true, analysis });
  } catch (error) {
    console.error("Document analysis error:", error);
    res.status(500).json({ error: "Failed to analyze document. Please try again." });
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
