import type { NextFunction, Request, Response } from "express";
import { httpError } from "../utils/httpError";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { requireUserId } from "../utils/request";
import {
  generateResumeImprovements,
  applyResumeImprovement,
  generateVersionSummary,
} from "../lib/ai/gemini";
import { extractLegacyFromRecord, legacyToJSONResume } from "../utils/resume-converter";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function serializeResumeToText(resume: any): string {
  const legacy = extractLegacyFromRecord(resume);
  const p = legacy.personalInfo || {};
  const edu = legacy.education || [];
  const exp = legacy.experience || [];
  const proj = legacy.projects || [];
  const skills = legacy.skills || [];
  const certs = legacy.certifications || [];
  const achievements = legacy.achievements || [];
  const languages = legacy.languages || [];

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
  if (resumeId) {
    const existing = await userPrisma.resume.findFirst({ where: { id: resumeId, userId } });
    if (existing) return resumeId;
    const uploaded = await userPrisma.uploadedResume.findFirst({ where: { id: resumeId, userId } });
    if (uploaded) return resumeId;
  }
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
      resumeData: { basics: {} },
    },
  });
  return placeholder.id;
}

async function resolveResumeForImprovements(userPrisma: any, userId: string, resumeId: string): Promise<{ resumeText: string; resumeData: any } | null> {
  if (!resumeId) return null;
  const builder = await userPrisma.resume.findFirst({ where: { id: resumeId, userId } });
  if (builder) return { resumeText: serializeResumeToText(builder), resumeData: builder };
  const uploaded = await userPrisma.uploadedResume.findFirst({
    where: { id: resumeId, userId },
    include: { candidateProfile: true },
  });
  if (!uploaded) return null;
  const p = uploaded.candidateProfile;
  if (p) {
    const resumeData = {
      personalInfo: { fullName: p.name, email: p.email, phone: p.phone, location: p.location, summary: p.summary },
      education: p.education || [],
      experience: p.experience || [],
      projects: p.projects || [],
      skills: p.skills || [],
      certifications: p.certifications || [],
      achievements: p.achievements || [],
      languages: p.languages || [],
      links: p.links || {},
    };
    const resumeText = serializeResumeToText(resumeData);
    return { resumeText, resumeData };
  }
  if (uploaded.extractedText) {
    return { resumeText: uploaded.extractedText, resumeData: { personalInfo: {}, education: [], experience: [], projects: [], skills: [], certifications: [] } };
  }
  return null;
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
    let resumeText = "";
    let resumeData: any = null;
    if (resumeId) {
      const resolved = await resolveResumeForImprovements(userPrisma, userId, resumeId);
      if (resolved) {
        resumeText = resolved.resumeText;
        resumeData = resolved.resumeData;
      }
    } else {
      resume = await userPrisma.resume.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } });
      if (resume) {
        resumeText = serializeResumeToText(resume);
        resumeData = resume;
      }
    }
    if (!resumeText) throw httpError(404, "No resume found. Please upload or create a resume first.");

    // Get latest ATS report if not provided
    let atsReport: any = null;
    try {
      if (atsReportId) {
        atsReport = await userPrisma.aTSReport.findFirst({ where: { id: atsReportId, userId } });
      } else if (resume || resumeId) {
        atsReport = await userPrisma.aTSReport.findFirst({
          where: { userId, resumeId },
          orderBy: { createdAt: "desc" },
        });
      }
    } catch (e) {
      console.warn("[ResumeImprovement] Could not fetch ATS report:", e);
    }

    if (!resumeText.trim()) throw httpError(400, "Resume content is empty.");

    const result = await generateResumeImprovements(
      resumeText,
      resumeData,
      atsReport?.reportJson || atsReport,
      targetRole || "Software Engineer",
      targetIndustry,
      targetCompany
    );

    // Try to persist — gracefully skip if tables don't exist yet
    let improvement: any = null;
    try {
      const associatedResumeId = await getOrCreateResumeId(userId, resumeId, userPrisma);
      improvement = await userPrisma.resumeImprovement.create({
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
            resumeData: JSON.parse(JSON.stringify(resume || resumeData)),
            atsScoreBefore: atsReport?.score || null,
            atsScoreAfter: null,
          },
        });
      }
    } catch (dbErr) {
      console.warn("[ResumeImprovement] DB persistence skipped (tables may not exist yet):", dbErr);
    }

    res.json({ success: true, improvement, result });
  } catch (error) {
    console.error("[ResumeImprovement] generateImprovements error:", error);
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

    // Update resume in DB (convert legacy → JSON Resume)
    const jrUpdate = legacyToJSONResume(updatedData);
    await userPrisma.resume.update({
      where: { id: resume.id },
      data: {
        resumeData: jrUpdate,
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

    // Update resume in DB (convert legacy → JSON Resume)
    const jrUpdate = legacyToJSONResume(updatedData);
    await userPrisma.resume.update({
      where: { id: resume.id },
      data: {
        resumeData: jrUpdate,
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

    // Restore resume data (version stores legacy format, convert to JSON Resume)
    const resumeData = version.resumeData as any;
    const jrRestore = legacyToJSONResume({
      personalInfo: resumeData.personalInfo || {},
      education: resumeData.education || [],
      experience: resumeData.experience || [],
      projects: resumeData.projects || [],
      skills: resumeData.skills || [],
      certifications: resumeData.certifications || [],
      achievements: resumeData.achievements || [],
      languages: resumeData.languages || [],
    });
    await userPrisma.resume.update({
      where: { id: version.resumeId },
      data: {
        resumeData: jrRestore,
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
