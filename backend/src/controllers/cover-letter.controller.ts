import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { httpError } from "../utils/httpError";
import {
  generateCoverLetterText,
  generateCoverLetterChat,
} from "../lib/ai/gemini";

function serializeResumeToText(resume: any): string {
  const p = resume.personalInfo || {};
  const edu = (resume.education as any[]) || [];
  const exp = (resume.experience as any[]) || [];
  const proj = (resume.projects as any[]) || [];
  const skills = (resume.skills as string[]) || [];
  const certs = (resume.certifications as any[]) || [];
  const achievements = (resume.achievements as string[]) || [];
  const languages = (resume.languages as string[]) || [];

  return `
Candidate Name: ${p.fullName || p.name || "N/A"}
Email: ${p.email || "N/A"}
Phone: ${p.phone || "N/A"}
Location: ${p.location || "N/A"}
Summary: ${p.summary || "N/A"}
LinkedIn: ${p.linkedin || "N/A"}
GitHub: ${p.github || "N/A"}
Portfolio: ${p.portfolio || "N/A"}

EDUCATION:
${edu.map((e: any) => `• ${e.degree || "Degree"} in ${e.fieldOfStudy || "Specialization"} from ${e.institution || "Institution"} (${e.startDate || ""} - ${e.endDate || ""})${e.grade ? ` — GPA: ${e.grade}` : ""}`).join("\n")}

WORK EXPERIENCE:
${exp.map((x: any) => `• ${x.role || "Role"} at ${x.company || "Company"} (${x.startDate || ""} - ${x.endDate || ""}): ${x.description || ""}`).join("\n")}

PROJECTS:
${proj.map((pr: any) => `• ${pr.name || pr.title || "Project"} (${pr.techStack || ""}): ${pr.description || ""}`).join("\n")}

TECHNICAL SKILLS:
${skills.join(", ")}

CERTIFICATIONS:
${certs.map((c: any) => `• ${c.name || c.title || "Certification"} from ${c.issuer || ""}${c.date ? ` (${c.date})` : ""}`).join("\n")}

ACHIEVEMENTS:
${achievements.filter(Boolean).join("\n")}

LANGUAGES:
${languages.filter(Boolean).join(", ")}
  `.trim();
}

/**
 * 1. Generate Cover Letter from resume + job details
 */
export async function generateCoverLetter(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const {
      resumeId,
      companyName,
      role,
      jobDescription,
      tone,
      letterType,
    } = req.body;

    if (!companyName) throw httpError(400, "Company name is required");
    if (!role) throw httpError(400, "Role/Title is required");

    // Get resume data
    let resumeText = "";
    if (resumeId) {
      const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
      if (resume) resumeText = serializeResumeToText(resume);
    }

    const selectedTone = tone || "Professional";
    const selectedType = letterType || "Full-Time";

    const result = await generateCoverLetterText(
      resumeText,
      companyName,
      role,
      jobDescription || "",
      selectedTone,
      selectedType
    );

    const content = [result.greeting, result.introduction, result.body, result.closing]
      .filter(Boolean).join("\n\n");

    const coverLetter = await prisma.coverLetter.create({
      data: {
        userId,
        resumeId: resumeId || null,
        companyName,
        role,
        jobDescription: jobDescription || null,
        tone: selectedTone,
        letterType: selectedType,
        greeting: result.greeting,
        introduction: result.introduction,
        body: result.body,
        closing: result.closing,
        content,
      },
    });

    res.status(201).json({ success: true, coverLetter });
  } catch (error) {
    next(error);
  }
}

/**
 * 2. AI Chat — refine existing cover letter
 */
export async function chatCoverLetter(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const { coverLetterId, message } = req.body;
    if (!message) throw httpError(400, "Message is required");

    const letter = await prisma.coverLetter.findFirst({
      where: { id: coverLetterId, userId },
    });
    if (!letter) throw httpError(404, "Cover letter not found");

    // Fetch resume text for context
    let resumeText = "";
    if (letter.resumeId) {
      const resume = await prisma.resume.findFirst({ where: { id: letter.resumeId, userId } });
      if (resume) resumeText = serializeResumeToText(resume);
    }

    const result = await generateCoverLetterChat(
      resumeText,
      {
        greeting: letter.greeting || "",
        introduction: letter.introduction || "",
        body: letter.body || "",
        closing: letter.closing || "",
      },
      message
    );

    const content = [result.greeting, result.introduction, result.body, result.closing]
      .filter(Boolean).join("\n\n");

    const updated = await prisma.coverLetter.update({
      where: { id: coverLetterId },
      data: {
        greeting: result.greeting,
        introduction: result.introduction,
        body: result.body,
        closing: result.closing,
        content,
      },
    });

    res.json({ success: true, coverLetter: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * 3. Save/Update cover letter
 */
export async function saveCoverLetter(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const { coverLetterId, greeting, introduction, body, closing } = req.body;
    if (!coverLetterId) throw httpError(400, "coverLetterId is required");

    const letter = await prisma.coverLetter.findFirst({
      where: { id: coverLetterId, userId },
    });
    if (!letter) throw httpError(404, "Cover letter not found");

    const content = [greeting, introduction, body, closing]
      .filter(Boolean).join("\n\n");

    const updated = await prisma.coverLetter.update({
      where: { id: coverLetterId },
      data: {
        greeting: greeting ?? letter.greeting,
        introduction: introduction ?? letter.introduction,
        body: body ?? letter.body,
        closing: closing ?? letter.closing,
        content,
      },
    });

    res.json({ success: true, coverLetter: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * 4. List User Cover Letters
 */
export async function listCoverLetters(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const coverLetters = await prisma.coverLetter.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, coverLetters });
  } catch (error) {
    next(error);
  }
}

/**
 * 5. Get Specific Cover Letter
 */
export async function getCoverLetter(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const coverLetter = await prisma.coverLetter.findFirst({
      where: { id: req.params.id as string, userId },
    });

    if (!coverLetter) {
      throw httpError(404, "Cover letter not found");
    }

    res.json({ success: true, coverLetter });
  } catch (error) {
    next(error);
  }
}

/**
 * 6. Delete Cover Letter
 */
export async function deleteCoverLetter(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const letterId = req.params.id as string;

    const letter = await prisma.coverLetter.findFirst({
      where: { id: letterId, userId },
    });
    if (!letter) throw httpError(404, "Cover letter not found");

    await prisma.coverLetter.delete({
      where: { id: letterId },
    });

    res.json({ success: true, message: "Cover letter deleted successfully" });
  } catch (error) {
    next(error);
  }
}
