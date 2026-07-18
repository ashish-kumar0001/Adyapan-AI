import type { NextFunction, Request, Response } from "express";
import { httpError } from "../utils/httpError";
import {
  analyzeResumeATS,
  analyzeResumeDeep,
  analyzeJobMatch,
  generateATSSuggestions,
  applyATSSuggestion,
  atsAIChat,
  analyzeResumeIntelligence,
  compareResumes,
} from "../lib/ai/gemini";
import mammoth from "mammoth";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { requireUserId } from "../utils/request";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function parsePdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = require("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return typeof result === "string" ? result : result.text || "";
}

async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  if (!file.buffer || file.buffer.length === 0) {
    throw httpError(400, "File buffer is empty. Please try uploading again.");
  }

  const mimeType = file.mimetype;
  let rawText: string;
  
  try {
    if (mimeType === "application/pdf") {
      rawText = await parsePdf(file.buffer);
    } else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      const parsed = await mammoth.extractRawText({ buffer: file.buffer });
      rawText = parsed.value;
    } else {
      throw httpError(400, "Unsupported file format. Please upload a PDF or DOCX file.");
    }
  } catch (parseErr: any) {
    if (parseErr.statusCode === 400) throw parseErr;
    console.error("[ATS upload] Document parsing error:", parseErr?.message || parseErr);
    throw httpError(400, "Failed to parse document. Ensure the file is not corrupted or password-protected.");
  }

  if (!rawText || rawText.trim().length === 0) {
    throw httpError(400, "The document appears to be empty. Scanned image layers with no readable text are not supported.");
  }

  return rawText;
}

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

async function getOrCreateResumeId(userId: string, resumeId?: string, userPrisma?: any): Promise<string> {
  if (resumeId) return resumeId;
  const latestResume = await userPrisma.resume.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  if (latestResume) return latestResume.id;
  const placeholder = await userPrisma.resume.create({
    data: {
      userId,
      title: `Imported Resume (${new Date().toLocaleDateString()})`,
      template: "Modern",
      personalInfo: {},
      education: [],
      experience: [],
      projects: [],
      skills: [],
      certifications: [],
    },
  });
  return placeholder.id;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/**
 * 1. Analyze Uploaded Resume File or Saved Resume for ATS
 */
export async function analyzeATSReport(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);

    const targetRole = req.body.targetRole || "Software Engineer";
    const resumeId = req.body.resumeId || "";
    const jobDescription = req.body.jobDescription || "";

    const userPrisma = await getUserPrismaFromRequest(req);
    let resumeText = "";

    if (req.file) {
      resumeText = await extractTextFromFile(req.file);
    } else if (resumeId) {
      const resume = await userPrisma.resume.findFirst({ where: { id: resumeId, userId } });
      if (!resume) throw httpError(404, "Resume not found");
      resumeText = serializeResumeToText(resume);
    } else {
      // Try to find saved resume
      const latestResume = await userPrisma.resume.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });
      if (latestResume) {
        resumeText = serializeResumeToText(latestResume);
      } else {
        throw httpError(400, "No resume found. Please upload a file or create a resume first.");
      }
    }

    if (!resumeText.trim()) {
      throw httpError(400, "Could not extract text from the resume.");
    }

    // Deep ATS Analysis
    const analysis = await analyzeResumeDeep(resumeText, targetRole, jobDescription);

    const associatedResumeId = await getOrCreateResumeId(userId, resumeId, userPrisma);

    // Save ATS report to DB
    const report = await userPrisma.aTSReport.create({
      data: {
        userId,
        resumeId: associatedResumeId,
        score: analysis.score,
        missingKeywords: analysis.keywordsMissing,
        recommendations: JSON.parse(JSON.stringify({
          recommendations: analysis.recommendations,
          formattingIssues: analysis.formattingIssues,
          strengths: analysis.strengths,
          sectionScores: analysis.sectionScores,
          keywordAnalysis: analysis.keywordAnalysis,
          formattingCheck: analysis.formattingCheck,
          strengthBars: analysis.strengthBars,
          readability: analysis.readability,
          resumeLength: analysis.length,
          formatting: analysis.formatting,
          recruiterScore: analysis.recruiterScore,
          scoreLabel: analysis.scoreLabel,
          keywordsFound: analysis.keywordsFound,
        })),
      },
    });

    res.json({ success: true, report, analysis });
  } catch (error) {
    next(error);
  }
}

/**
 * 2. Compare Resume with Job Description
 */
export async function analyzeJDMatch(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);

    const { resumeId, jobDescription } = req.body;
    if (!jobDescription) throw httpError(400, "jobDescription is required");

    const userPrisma = await getUserPrismaFromRequest(req);
    let resumeText = "";

    if (req.file) {
      resumeText = await extractTextFromFile(req.file);
    } else if (resumeId) {
      const resume = await userPrisma.resume.findFirst({ where: { id: resumeId, userId } });
      if (!resume) throw httpError(404, "Resume not found");
      resumeText = serializeResumeToText(resume);
    } else {
      const latestResume = await userPrisma.resume.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });
      if (latestResume) {
        resumeText = serializeResumeToText(latestResume);
      } else {
        throw httpError(400, "No resume found.");
      }
    }

    const matchResult = await analyzeJobMatch(resumeText, jobDescription);

    res.json({ success: true, matchResult });
  } catch (error) {
    next(error);
  }
}

/**
 * 3. Get ATS Suggestions for Improvement
 */
export async function getATSSuggestions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);

    const { targetRole } = req.body;
    const userPrisma = await getUserPrismaFromRequest(req);
    let resumeText = "";
    let analysis: any = null;

    if (req.body.resumeId) {
      const resume = await userPrisma.resume.findFirst({ where: { id: req.body.resumeId, userId } });
      if (!resume) throw httpError(404, "Resume not found");
      resumeText = serializeResumeToText(resume);
    } else {
      const latestResume = await userPrisma.resume.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });
      if (latestResume) resumeText = serializeResumeToText(latestResume);
    }

    if (req.body.analysis) {
      analysis = req.body.analysis;
    }

    if (!resumeText) throw httpError(400, "No resume content found");

    // If we don't have analysis yet, do a quick one
    if (!analysis) {
      const atsResult = await analyzeResumeATS(resumeText, targetRole || "Software Engineer");
      analysis = atsResult;
    }

    const suggestions = await generateATSSuggestions(resumeText, analysis, targetRole || "Software Engineer");

    res.json({ success: true, suggestions });
  } catch (error) {
    next(error);
  }
}

/**
 * 4. Apply a single ATS improvement
 */
export async function applyImprovement(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);

    const { section, originalContent, suggestionText } = req.body;
    if (!section || !originalContent || !suggestionText) {
      throw httpError(400, "section, originalContent, and suggestionText are required");
    }

    const improved = await applyATSSuggestion(section, originalContent, suggestionText);

    res.json({ success: true, improved });
  } catch (error) {
    next(error);
  }
}

/**
 * 5. ATS AI Chat
 */
export async function atsChatHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);

    const { message, resumeText, analysis } = req.body;
    if (!message) throw httpError(400, "message is required");

    const userPrisma = await getUserPrismaFromRequest(req);
    let text = resumeText || "";
    if (!text && req.body.resumeId) {
      const resume = await userPrisma.resume.findFirst({
        where: { id: req.body.resumeId, userId },
      });
      if (resume) text = serializeResumeToText(resume);
    }

    const result = await atsAIChat(text, analysis || {}, message);

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

/**
 * 6. Get User ATS Auditing History
 */
export async function listATSReports(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);

    const userPrisma = await getUserPrismaFromRequest(req);
    const reports = await userPrisma.aTSReport.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        resume: {
          select: { title: true },
        },
      },
    });

    res.json({ success: true, reports });
  } catch (error) {
    next(error);
  }
}

/**
 * 7. Get Specific ATS Report
 */
export async function getATSReport(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);

    const userPrisma = await getUserPrismaFromRequest(req);
    const report = await userPrisma.aTSReport.findFirst({
      where: { id: req.params.id as string, userId },
      include: {
        resume: {
          select: { title: true },
        },
      },
    });

    if (!report) {
      throw httpError(404, "ATS Report not found");
    }

    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
}

/**
 * 8. ATS Intelligence Analysis (Day 22)
 */
export async function analyzeATSIntelligence(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);

    const targetRole = req.body.targetRole || "Software Engineer";
    const resumeId = req.body.resumeId || "";
    const jobDescription = req.body.jobDescription || "";

    const userPrisma = await getUserPrismaFromRequest(req);
    let resumeText = "";

    if (req.file) {
      resumeText = await extractTextFromFile(req.file);
    } else if (resumeId) {
      const resume = await userPrisma.resume.findFirst({ where: { id: resumeId, userId } });
      if (!resume) throw httpError(404, "Resume not found");
      resumeText = serializeResumeToText(resume);
    } else {
      const latestResume = await userPrisma.resume.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });
      if (latestResume) {
        resumeText = serializeResumeToText(latestResume);
      } else {
        throw httpError(400, "No resume found. Please upload a file or create a resume first.");
      }
    }

    if (!resumeText.trim()) {
      throw httpError(400, "Could not extract text from the resume.");
    }

    const intelligence = await analyzeResumeIntelligence(resumeText, targetRole, jobDescription);

    res.json({ success: true, intelligence });
  } catch (error) {
    next(error);
  }
}

/**
 * 9. Compare Two Resume Versions (Day 22)
 */
export async function compareResumeVersions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);

    const { resumeIdA, resumeIdB, targetRole } = req.body;
    if (!resumeIdA || !resumeIdB) {
      throw httpError(400, "Both resumeIdA and resumeIdB are required");
    }

    const userPrisma = await getUserPrismaFromRequest(req);

    const resumeA = await userPrisma.resume.findFirst({ where: { id: resumeIdA, userId } });
    if (!resumeA) throw httpError(404, "Resume A not found");

    const resumeB = await userPrisma.resume.findFirst({ where: { id: resumeIdB, userId } });
    if (!resumeB) throw httpError(404, "Resume B not found");

    const textA = serializeResumeToText(resumeA);
    const textB = serializeResumeToText(resumeB);

    const comparison = await compareResumes(textA, textB, targetRole || "Software Engineer");

    res.json({ success: true, comparison });
  } catch (error) {
    next(error);
  }
}

/**
 * 10. Get Latest ATS Report (Day 22)
 */
export async function getLatestATSReport(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);

    const userPrisma = await getUserPrismaFromRequest(req);
    const report = await userPrisma.aTSReport.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        resume: {
          select: { title: true },
        },
      },
    });

    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
}
