import type { NextFunction, Request, Response } from "express";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { httpError } from "../utils/httpError";
import { analyzeResumeSWOT, analyzeJobMatch } from "../lib/ai/gemini";

/**
 * Serializes a structured draft resume to a single plain-text string
 */
function serializeResumeToText(resume: any): string {
  const p = resume.personalInfo || {};
  const edu = (resume.education as any[]) || [];
  const exp = (resume.experience as any[]) || [];
  const proj = (resume.projects as any[]) || [];
  const skills = (resume.skills as string[]) || [];
  const certs = (resume.certifications as any[]) || [];

  return `
Candidate Name: ${p.fullName || p.name || "N/A"}
Email: ${p.email || "N/A"}
Location: ${p.location || "N/A"}
Summary: ${p.summary || "N/A"}

EDUCATION:
${edu.map(e => `• ${e.degree || "Degree"} in ${e.fieldOfStudy || e.branch || "Specialization"} from ${e.institution || e.school || "Institution"} (${e.startDate || ""} - ${e.endDate || ""})`).join("\n")}

EXPERIENCE:
${exp.map(x => `• ${x.role || "Role"} at ${x.company || "Company"} (${x.startDate || ""} - ${x.endDate || ""}): ${x.description || ""}`).join("\n")}

PROJECTS:
${proj.map(pr => `• ${pr.name || pr.title || "Project"} (${pr.techStack || ""}): ${pr.description || ""}`).join("\n")}

TECHNICAL SKILLS:
${skills.join(", ")}

CERTIFICATIONS:
${certs.map(c => `• ${c.name || c.title || "Certification"} from ${c.issuer || ""} (${c.date || ""})`).join("\n")}
  `.trim();
}

/**
 * 1. Perform Resume SWOT Analysis
 */
export async function analyzeSWOT(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const { resumeId } = req.body;
    if (!resumeId) throw httpError(400, "resumeId is required");

    const userPrisma = await getUserPrismaFromRequest(req);
    const resume = await userPrisma.resume.findFirst({
      where: { id: resumeId, userId },
    });
    if (!resume) throw httpError(404, "Resume draft not found");

    const resumeText = serializeResumeToText(resume);
    const swot = await analyzeResumeSWOT(resumeText);

    // Save ResumeAnalysis to DB
    const analysis = await userPrisma.resumeAnalysis.create({
      data: {
        userId,
        resumeId,
        strengths: swot.strengths,
        weaknesses: swot.weaknesses,
        recommendations: swot.recommendations,
      },
    });

    res.json({ success: true, analysis });
  } catch (error) {
    next(error);
  }
}

/**
 * 2. Calculate Job Description Match Rate
 */
export async function matchJob(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const { resumeId, jobDescription } = req.body;
    if (!resumeId) throw httpError(400, "resumeId is required");
    if (!jobDescription) throw httpError(400, "jobDescription is required");

    const userPrisma = await getUserPrismaFromRequest(req);
    const resume = await userPrisma.resume.findFirst({
      where: { id: resumeId, userId },
    });
    if (!resume) throw httpError(404, "Resume draft not found");

    const resumeText = serializeResumeToText(resume);
    const matchResult = await analyzeJobMatch(resumeText, jobDescription);

    res.json({ success: true, matchResult });
  } catch (error) {
    next(error);
  }
}

/**
 * 3. Get Specific SWOT Analysis Report
 */
export async function getResumeAnalysis(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const userPrisma = await getUserPrismaFromRequest(req);
    const analysis = await userPrisma.resumeAnalysis.findFirst({
      where: { id: req.params.id as string, userId },
      include: {
        resume: {
          select: { title: true },
        },
      },
    });

    if (!analysis) {
      throw httpError(404, "SWOT Report not found");
    }

    res.json({ success: true, analysis });
  } catch (error) {
    next(error);
  }
}

/**
 * 4. Get User Resume Analyses History
 */
export async function listResumeAnalyses(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const userPrisma = await getUserPrismaFromRequest(req);
    const analyses = await userPrisma.resumeAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        resume: {
          select: { title: true },
        },
      },
    });

    res.json({ success: true, analyses });
  } catch (error) {
    next(error);
  }
}
