import type { NextFunction, Request, Response } from "express";
import { optimizeLinkedInProfile, generateResumeSummary } from "../lib/ai/gemini";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { requireUserId } from "../utils/request";

const genAI = new GoogleGenerativeAI(env.geminiApiKey);

/**
 * 1. Analyze profile details and return optimization suggestions & scores
 */
export async function analyzeLinkedIn(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);

    const { headline, about, experience, skills, targetRole } = req.body;

    const reportData = await optimizeLinkedInProfile({
      headline: headline || "",
      about: about || "",
      experience: experience || "",
      skills: skills || "",
      targetRole: targetRole || "Software Engineer",
    });

    const userPrisma = await getUserPrismaFromRequest(req);
    const report = await userPrisma.linkedInReport.create({
      data: {
        userId,
        headline: reportData.headline,
        aboutSection: reportData.aboutSection,
        skills: reportData.skills,
        recommendations: reportData.recommendations,
        score: reportData.score,
      },
    });

    res.status(201).json({ success: true, report });
  } catch (error) {
    next(error);
  }
}

/**
 * 2. Generate optimized headline only
 */
export async function generateHeadline(req: Request, res: Response, next: NextFunction) {
  try {
    const { targetRole, skills } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      Write a compelling LinkedIn Headline for a professional seeking a "${targetRole || "Software Developer"}" role.
      Skills / Keywords: ${skills || "Web Development, TypeScript, React"}
      
      Requirements:
      - Max 180 characters.
      - Align with industry standards, e.g., using pipes to separate tech stack.
      - Return ONLY the headline text, nothing else.
    `;

    const result = await model.generateContent(prompt);
    res.json({ success: true, headline: result.response.text().trim() });
  } catch (error) {
    next(error);
  }
}

/**
 * 3. Generate About section only
 */
export async function generateAbout(req: Request, res: Response, next: NextFunction) {
  try {
    const { targetRole, experience, skills } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      Write a professional and engaging "About" section for a LinkedIn profile.
      Target Role: ${targetRole || "Software Developer"}
      Experience details: ${experience || "Student / Entry-level"}
      Skills / Keywords: ${skills || "React, Node.js, JavaScript"}
      
      Requirements:
      - Word count: 150-200 words.
      - Written in the first-person ("I am", "My passion is").
      - Structured with a hook, key expertise areas, and a call-to-action (e.g. "Looking for full-time opportunities...").
      - Return ONLY the summary text, nothing else.
    `;

    const result = await model.generateContent(prompt);
    res.json({ success: true, about: result.response.text().trim() });
  } catch (error) {
    next(error);
  }
}

/**
 * 4. Get User Optimizer History
 */
export async function listLinkedInReports(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);

    const userPrisma = await getUserPrismaFromRequest(req);
    const reports = await userPrisma.linkedInReport.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, reports });
  } catch (error) {
    next(error);
  }
}
