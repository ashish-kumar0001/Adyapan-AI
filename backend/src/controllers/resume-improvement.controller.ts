import type { NextFunction, Request, Response } from "express";
import { httpError } from "../utils/httpError";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { requireUserId } from "../utils/request";
import {
  generateResumeImprovements,
  applyResumeImprovement,
  generateVersionSummary,
} from "../lib/ai/gemini";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
 * 1. Generate Resume Improvements
 */
export async function generateImprovements(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const { resumeId, atsReportId, targetRole, targetIndustry, targetCompany } = req.body;

    const userPrisma = await getUserPrismaFromRequest(req);

    // Get resume
    let resume: any = null;
    if (resumeId) {
      resume = await userPrisma.resume.findFirst({ where: { id: resumeId, userId } });
    } else {
      resume = await userPrisma.resume.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } });
    }
    if (!resume) throw httpError(404, "No resume found. Please upload or create a resume first.");

    // Get latest ATS report if not provided
    let atsReport: any = null;
    if (atsReportId) {
      atsReport = await userPrisma.aTSReport.findFirst({ where: { id: atsReportId, userId } });
    } else {
      atsReport = await userPrisma.aTSReport.findFirst({
        where: { userId, resumeId: resume.id },
        orderBy: { createdAt: "desc" },
      });
    }

    const resumeText = serializeResumeToText(resume);
    if (!resumeText.trim()) throw httpError(400, "Resume content is empty.");

    const result = await generateResumeImprovements(
      resumeText,
      resume,
      atsReport?.reportJson || atsReport,
      targetRole || resume.targetCompany || "Software Engineer",
      targetIndustry,
      targetCompany
    );

    const associatedResumeId = await getOrCreateResumeId(userId, resumeId, userPrisma);

    // Save improvement record
    const improvement = await userPrisma.resumeImprovement.create({
      data: {
        userId,
        resumeId: associatedResumeId,
        atsReportId: atsReport?.id || null,
        targetRole: targetRole || "Software Engineer",
        improvementJson: JSON.parse(JSON.stringify(result)),
        scoreBefore: result.overallScoreBefore,
        scoreAfter: result.overallScoreAfter,
        appliedCount: 0,
        totalCount: result.improvements.length + result.bulletRewrites.length,
      },
    });

    // Create version 1 if this is the first version
    const existingVersions = await userPrisma.resumeVersion.count({
      where: { resumeId: associatedResumeId, userId },
    });
    if (existingVersions === 0) {
      await userPrisma.resumeVersion.create({
        data: {
          userId,
          resumeId: associatedResumeId,
          versionNumber: 1,
          changeSummary: "Original resume",
          resumeData: JSON.parse(JSON.stringify(resume)),
          atsScoreBefore: atsReport?.score || null,
          atsScoreAfter: null,
        },
      });
    }

    res.json({ success: true, improvement, result });
  } catch (error) {
    next(error);
  }
}

/**
 * 2. Apply a Single Improvement
 */
export async function applySingleImprovement(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const { resumeId, improvementId, section, currentContent, improvedContent } = req.body;

    if (!section || !improvedContent) {
      throw httpError(400, "section and improvedContent are required");
    }

    const userPrisma = await getUserPrismaFromRequest(req);

    // Get resume
    let resume: any = null;
    if (resumeId) {
      resume = await userPrisma.resume.findFirst({ where: { id: resumeId, userId } });
    } else {
      resume = await userPrisma.resume.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } });
    }
    if (!resume) throw httpError(404, "Resume not found");

    // Apply the improvement
    const updatedData = await applyResumeImprovement(resume, section, currentContent || "", improvedContent);

    // Update resume in DB
    await userPrisma.resume.update({
      where: { id: resume.id },
      data: {
        personalInfo: updatedData.personalInfo,
        education: updatedData.education,
        experience: updatedData.experience,
        projects: updatedData.projects,
        skills: updatedData.skills,
        certifications: updatedData.certifications,
        achievements: updatedData.achievements,
        languages: updatedData.languages,
      },
    });

    // Get latest version number
    const latestVersion = await userPrisma.resumeVersion.findFirst({
      where: { resumeId: resume.id, userId },
      orderBy: { versionNumber: "desc" },
    });

    // Create new version
    await userPrisma.resumeVersion.create({
      data: {
        userId,
        resumeId: resume.id,
        versionNumber: (latestVersion?.versionNumber || 0) + 1,
        changeSummary: `Applied improvement: ${section}`,
        resumeData: JSON.parse(JSON.stringify(updatedData)),
        atsScoreBefore: null,
        atsScoreAfter: null,
      },
    });

    // Update improvement applied count if improvementId provided
    if (improvementId) {
      await userPrisma.resumeImprovement.update({
        where: { id: improvementId },
        data: { appliedCount: { increment: 1 } },
      });
    }

    res.json({ success: true, updatedResume: updatedData });
  } catch (error) {
    next(error);
  }
}

/**
 * 3. Apply All Improvements
 */
export async function applyAllImprovements(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const { resumeId, improvementId, improvements } = req.body;

    if (!improvements || !Array.isArray(improvements)) {
      throw httpError(400, "improvements array is required");
    }

    const userPrisma = await getUserPrismaFromRequest(req);

    // Get resume
    let resume: any = null;
    if (resumeId) {
      resume = await userPrisma.resume.findFirst({ where: { id: resumeId, userId } });
    } else {
      resume = await userPrisma.resume.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } });
    }
    if (!resume) throw httpError(404, "Resume not found");

    let updatedData = JSON.parse(JSON.stringify(resume));

    // Apply each improvement sequentially
    for (const imp of improvements) {
      updatedData = await applyResumeImprovement(
        updatedData,
        imp.section,
        imp.currentContent || "",
        imp.improvedContent
      );
    }

    // Update resume in DB
    await userPrisma.resume.update({
      where: { id: resume.id },
      data: {
        personalInfo: updatedData.personalInfo,
        education: updatedData.education,
        experience: updatedData.experience,
        projects: updatedData.projects,
        skills: updatedData.skills,
        certifications: updatedData.certifications,
        achievements: updatedData.achievements,
        languages: updatedData.languages,
      },
    });

    // Get latest version number
    const latestVersion = await userPrisma.resumeVersion.findFirst({
      where: { resumeId: resume.id, userId },
      orderBy: { versionNumber: "desc" },
    });

    // Create new version
    const changeSummary = await generateVersionSummary(resume, updatedData, "Software Engineer");

    await userPrisma.resumeVersion.create({
      data: {
        userId,
        resumeId: resume.id,
        versionNumber: (latestVersion?.versionNumber || 0) + 1,
        changeSummary: changeSummary || `Applied ${improvements.length} improvements`,
        resumeData: JSON.parse(JSON.stringify(updatedData)),
        atsScoreBefore: null,
        atsScoreAfter: null,
      },
    });

    // Update improvement applied count
    if (improvementId) {
      await userPrisma.resumeImprovement.update({
        where: { id: improvementId },
        data: { appliedCount: { increment: improvements.length } },
      });
    }

    res.json({ success: true, updatedResume: updatedData, appliedCount: improvements.length });
  } catch (error) {
    next(error);
  }
}

/**
 * 4. Get Improvement History
 */
export async function getImprovementHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const userPrisma = await getUserPrismaFromRequest(req);

    const improvements = await userPrisma.resumeImprovement.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        resume: { select: { title: true } },
      },
    });

    res.json({ success: true, improvements });
  } catch (error) {
    next(error);
  }
}

/**
 * 5. Get Version History
 */
export async function getVersionHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const { resumeId } = req.query;

    const userPrisma = await getUserPrismaFromRequest(req);

    const where: any = { userId };
    if (resumeId) where.resumeId = resumeId as string;

    const versions = await userPrisma.resumeVersion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        resume: { select: { title: true } },
      },
    });

    res.json({ success: true, versions });
  } catch (error) {
    next(error);
  }
}

/**
 * 6. Restore Version
 */
export async function restoreVersion(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const { versionId } = req.body;

    if (!versionId) throw httpError(400, "versionId is required");

    const userPrisma = await getUserPrismaFromRequest(req);

    const version = await userPrisma.resumeVersion.findFirst({
      where: { id: versionId, userId },
    });
    if (!version) throw httpError(404, "Version not found");

    // Restore resume data
    const resumeData = version.resumeData as any;
    await userPrisma.resume.update({
      where: { id: version.resumeId },
      data: {
        personalInfo: resumeData.personalInfo || {},
        education: resumeData.education || [],
        experience: resumeData.experience || [],
        projects: resumeData.projects || [],
        skills: resumeData.skills || [],
        certifications: resumeData.certifications || [],
        achievements: resumeData.achievements || [],
        languages: resumeData.languages || [],
      },
    });

    // Get latest version number
    const latestVersion = await userPrisma.resumeVersion.findFirst({
      where: { resumeId: version.resumeId, userId },
      orderBy: { versionNumber: "desc" },
    });

    // Create restore point
    await userPrisma.resumeVersion.create({
      data: {
        userId,
        resumeId: version.resumeId,
        versionNumber: (latestVersion?.versionNumber || 0) + 1,
        changeSummary: `Restored from version ${version.versionNumber}`,
        resumeData: JSON.parse(JSON.stringify(resumeData)),
        atsScoreBefore: null,
        atsScoreAfter: null,
      },
    });

    res.json({ success: true, restoredVersion: version.versionNumber, resumeData });
  } catch (error) {
    next(error);
  }
}

/**
 * 7. Compare Two Versions
 */
export async function compareVersions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const { versionIdA, versionIdB } = req.body;

    if (!versionIdA || !versionIdB) throw httpError(400, "Both versionIdA and versionIdB are required");

    const userPrisma = await getUserPrismaFromRequest(req);

    const versionA = await userPrisma.resumeVersion.findFirst({
      where: { id: versionIdA, userId },
    });
    const versionB = await userPrisma.resumeVersion.findFirst({
      where: { id: versionIdB, userId },
    });

    if (!versionA || !versionB) throw httpError(404, "One or both versions not found");

    const dataA = versionA.resumeData as any;
    const dataB = versionB.resumeData as any;

    const differences: any[] = [];

    // Compare sections
    const sections = ["personalInfo", "education", "experience", "projects", "skills", "certifications", "achievements", "languages"];
    for (const section of sections) {
      const a = JSON.stringify(dataA[section]);
      const b = JSON.stringify(dataB[section]);
      if (a !== b) {
        differences.push({
          section,
          versionA: dataA[section],
          versionB: dataB[section],
          changed: true,
        });
      }
    }

    res.json({
      success: true,
      comparison: {
        versionA: { id: versionA.id, number: versionA.versionNumber, date: versionA.createdAt, summary: versionA.changeSummary },
        versionB: { id: versionB.id, number: versionB.versionNumber, date: versionB.createdAt, summary: versionB.changeSummary },
        differences,
        identical: differences.length === 0,
      },
    });
  } catch (error) {
    next(error);
  }
}
