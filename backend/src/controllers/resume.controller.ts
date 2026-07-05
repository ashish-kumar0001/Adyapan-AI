import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { httpError } from "../utils/httpError";
import { generateResumeSummary, enhanceProjectDescription, enhanceExperienceDescription, optimizeResumeContent, resumeAIChat } from "../lib/ai/gemini";
import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

/**
 * Helper to ensure a resume belongs to the logged-in user
 */
async function getResumeForUser(resumeId: string, userId: string) {
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
  });
  if (!resume) {
    throw httpError(404, "Resume not found or access denied");
  }
  return resume;
}

/**
 * 1. Create Resume Draft
 */
export async function createResume(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const { title, template, personalInfo, education, experience, projects, skills, certifications } = req.body;

    if (!title) throw httpError(400, "Resume title is required");

    const resume = await prisma.resume.create({
      data: {
        userId,
        title,
        template: template ?? "Modern",
        personalInfo: personalInfo ?? {},
        education: education ?? [],
        experience: experience ?? [],
        projects: projects ?? [],
        skills: skills ?? [],
        certifications: certifications ?? [],
      },
    });

    res.status(201).json({ success: true, resume });
  } catch (error) {
    next(error);
  }
}

/**
 * 2. Get User Resumes List
 */
export async function listResumes(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const resumes = await prisma.resume.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    res.json({ success: true, resumes });
  } catch (error) {
    next(error);
  }
}

/**
 * 3. Get Resume Details
 */
export async function getResume(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const resume = await getResumeForUser(req.params.id as string, userId);
    res.json({ success: true, resume });
  } catch (error) {
    next(error);
  }
}

/**
 * 4. Update Resume Draft
 */
export async function updateResume(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const resumeId = req.params.id as string;
    await getResumeForUser(resumeId, userId);

    const { title, template, personalInfo, education, experience, projects, skills, certifications } = req.body;

    const updated = await prisma.resume.update({
      where: { id: resumeId },
      data: {
        ...(title && { title }),
        ...(template && { template }),
        ...(personalInfo !== undefined && { personalInfo }),
        ...(education !== undefined && { education }),
        ...(experience !== undefined && { experience }),
        ...(projects !== undefined && { projects }),
        ...(skills !== undefined && { skills }),
        ...(certifications !== undefined && { certifications }),
      },
    });

    res.json({ success: true, resume: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * 5. Delete Resume
 */
export async function deleteResume(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const resumeId = req.params.id as string;
    await getResumeForUser(resumeId, userId);

    await prisma.resume.delete({
      where: { id: resumeId },
    });

    res.json({ success: true, message: "Resume deleted successfully" });
  } catch (error) {
    next(error);
  }
}

/**
 * 6. Generate AI Summary
 */
export async function generateSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const { personalInfo, education, experience, skills } = req.body;

    const summary = await generateResumeSummary(
      personalInfo ?? {},
      education ?? [],
      experience ?? [],
      skills ?? []
    );

    res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
}

/**
 * Enhance Project Description
 */
export async function enhanceProject(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, techStack, description } = req.body;
    const result = await enhanceProjectDescription(name ?? "", techStack ?? "", description ?? "");
    res.json({ success: true, description: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Enhance Experience Description
 */
export async function enhanceExperience(req: Request, res: Response, next: NextFunction) {
  try {
    const { role, company, description } = req.body;
    const result = await enhanceExperienceDescription(role ?? "", company ?? "", description ?? "");
    res.json({ success: true, description: result });
  } catch (error) {
    next(error);
  }
}

/**
 * Optimize Entire Resume for Target Company
 */
export async function optimizeResume(req: Request, res: Response, next: NextFunction) {
  try {
    const { resumeJson, targetCompany } = req.body;
    const result = await optimizeResumeContent(resumeJson, targetCompany || "Startup");
    res.json({ success: true, resume: result });
  } catch (error) {
    next(error);
  }
}

/**
 * 7. Resume AI Chat - Understands user intent and updates resume sections
 */
export async function resumeChat(req: Request, res: Response, next: NextFunction) {
  try {
    const { resumeData, message } = req.body;
    const result = await resumeAIChat(resumeData, message);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

/**
 * 8. Export Resume as PDF
 */
export async function exportResumePdf(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const resume = await getResumeForUser(req.body.resumeId, userId);

    const p = resume.personalInfo as any;
    const edu = (resume.education as any[]) || [];
    const exp = (resume.experience as any[]) || [];
    const proj = (resume.projects as any[]) || [];
    const skills = (resume.skills as string[]) || [];
    const certs = (resume.certifications as any[]) || [];

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${resume.title.replace(/\s+/g, "_")}.pdf"`);

    doc.pipe(res);

    // Title / Header
    const fullName = p.fullName || p.name || "Candidate Name";
    doc.fontSize(22).font("Helvetica-Bold").text(fullName, { align: "center" });
    
    // Sub-header (contact info)
    const contacts = [];
    if (p.email) contacts.push(p.email);
    if (p.phone) contacts.push(p.phone);
    if (p.location) contacts.push(p.location);
    if (p.website || p.portfolio) contacts.push(p.website || p.portfolio);
    
    doc.fontSize(10).font("Helvetica").text(contacts.join("  |  "), { align: "center" });
    doc.moveDown(1.5);

    // Draw Line helper
    const drawLine = () => {
      doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor("#dddddd").stroke();
      doc.moveDown(0.8);
    };

    // Summary
    if (p.summary) {
      doc.fontSize(12).font("Helvetica-Bold").text("PROFESSIONAL SUMMARY");
      drawLine();
      doc.fontSize(10).font("Helvetica").text(p.summary, { align: "justify" });
      doc.moveDown(1.5);
    }

    // Experience
    if (exp.length > 0) {
      doc.fontSize(12).font("Helvetica-Bold").text("WORK EXPERIENCE");
      drawLine();
      exp.forEach((item) => {
        doc.fontSize(10).font("Helvetica-Bold").text(`${item.role} - ${item.company}`, { continued: true });
        const dateStr = item.startDate && item.endDate ? ` (${item.startDate} - ${item.endDate})` : "";
        doc.font("Helvetica-Oblique").text(dateStr, { align: "right" });
        
        if (item.description) {
          doc.fontSize(9.5).font("Helvetica").text(item.description, { align: "left" });
        }
        doc.moveDown(0.8);
      });
      doc.moveDown(0.7);
    }

    // Projects
    if (proj.length > 0) {
      doc.fontSize(12).font("Helvetica-Bold").text("PROJECTS");
      drawLine();
      proj.forEach((item) => {
        doc.fontSize(10).font("Helvetica-Bold").text(item.name || item.title);
        if (item.techStack) {
          doc.fontSize(9).font("Helvetica-Oblique").text(`Technologies: ${item.techStack}`);
        }
        if (item.description) {
          doc.fontSize(9.5).font("Helvetica").text(item.description);
        }
        doc.moveDown(0.8);
      });
      doc.moveDown(0.7);
    }

    // Education
    if (edu.length > 0) {
      doc.fontSize(12).font("Helvetica-Bold").text("EDUCATION");
      drawLine();
      edu.forEach((item) => {
        doc.fontSize(10).font("Helvetica-Bold").text(`${item.degree} in ${item.fieldOfStudy || item.branch}`, { continued: true });
        const dateStr = item.startDate && item.endDate ? ` (${item.startDate} - ${item.endDate})` : "";
        doc.font("Helvetica").text(dateStr, { align: "right" });
        doc.fontSize(9.5).text(`${item.institution || item.school || item.college}`);
        if (item.grade || item.gpa) {
          doc.fontSize(9).text(`Grade / GPA: ${item.grade || item.gpa}`);
        }
        doc.moveDown(0.8);
      });
      doc.moveDown(0.7);
    }

    // Skills
    if (skills.length > 0) {
      doc.fontSize(12).font("Helvetica-Bold").text("TECHNICAL SKILLS");
      drawLine();
      doc.fontSize(10).font("Helvetica").text(skills.join(", "));
      doc.moveDown(1.5);
    }

    // Certifications
    if (certs.length > 0) {
      doc.fontSize(12).font("Helvetica-Bold").text("CERTIFICATIONS");
      drawLine();
      certs.forEach((c) => {
        const title = c.name || c.title || "Certification";
        const issuerStr = c.issuer ? ` - ${c.issuer}` : "";
        const dateStr = c.date ? ` (${c.date})` : "";
        doc.fontSize(10).font("Helvetica").text(`• ${title}${issuerStr}${dateStr}`);
      });
    }

    doc.end();
  } catch (error) {
    next(error);
  }
}

/**
 * 8. Export Resume as DOCX
 */
export async function exportResumeDocx(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw httpError(401, "Unauthorized");

    const resume = await getResumeForUser(req.body.resumeId, userId);

    const p = resume.personalInfo as any;
    const edu = (resume.education as any[]) || [];
    const exp = (resume.experience as any[]) || [];
    const proj = (resume.projects as any[]) || [];
    const skills = (resume.skills as string[]) || [];
    const certs = (resume.certifications as any[]) || [];

    const children: Paragraph[] = [];

    // Title Header
    const fullName = p.fullName || p.name || "Candidate Name";
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: fullName,
            bold: true,
            size: 32, // 16pt
          }),
        ],
      })
    );

    // Contact info
    const contacts = [];
    if (p.email) contacts.push(p.email);
    if (p.phone) contacts.push(p.phone);
    if (p.location) contacts.push(p.location);
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: contacts.join("  |  "),
            size: 20, // 10pt
          }),
        ],
      })
    );
    children.push(new Paragraph({ text: "" })); // blank spacer

    // Section Header Helper
    const addSectionHeader = (titleText: string) => {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: titleText,
              bold: true,
              size: 24, // 12pt
              color: "1f2937",
            }),
          ],
        })
      );
    };

    // Summary Section
    if (p.summary) {
      addSectionHeader("PROFESSIONAL SUMMARY");
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: p.summary,
              size: 20,
            }),
          ],
        })
      );
      children.push(new Paragraph({ text: "" }));
    }

    // Work Experience
    if (exp.length > 0) {
      addSectionHeader("WORK EXPERIENCE");
      exp.forEach((item) => {
        const dateStr = item.startDate && item.endDate ? ` (${item.startDate} - ${item.endDate})` : "";
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${item.role} - ${item.company}${dateStr}`,
                bold: true,
                size: 20,
              }),
            ],
          })
        );
        if (item.description) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: item.description,
                  size: 19,
                }),
              ],
            })
          );
        }
        children.push(new Paragraph({ text: "" }));
      });
    }

    // Projects
    if (proj.length > 0) {
      addSectionHeader("PROJECTS");
      proj.forEach((item) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: item.name || item.title,
                bold: true,
                size: 20,
              }),
            ],
          })
        );
        if (item.techStack) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Technologies: ${item.techStack}`,
                  italics: true,
                  size: 18,
                }),
              ],
            })
          );
        }
        if (item.description) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: item.description,
                  size: 19,
                }),
              ],
            })
          );
        }
        children.push(new Paragraph({ text: "" }));
      });
    }

    // Education
    if (edu.length > 0) {
      addSectionHeader("EDUCATION");
      edu.forEach((item) => {
        const dateStr = item.startDate && item.endDate ? ` (${item.startDate} - ${item.endDate})` : "";
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${item.degree} in ${item.fieldOfStudy || item.branch} - ${item.institution || item.school || item.college}${dateStr}`,
                bold: true,
                size: 20,
              }),
            ],
          })
        );
        if (item.grade || item.gpa) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `GPA / Grade: ${item.grade || item.gpa}`,
                  size: 19,
                }),
              ],
            })
          );
        }
        children.push(new Paragraph({ text: "" }));
      });
    }

    // Skills
    if (skills.length > 0) {
      addSectionHeader("TECHNICAL SKILLS");
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: skills.join(", "),
              size: 20,
            }),
          ],
        })
      );
      children.push(new Paragraph({ text: "" }));
    }

    // Certifications
    if (certs.length > 0) {
      addSectionHeader("CERTIFICATIONS");
      certs.forEach((c) => {
        const title = c.name || c.title || "Certification";
        const issuerStr = c.issuer ? ` - ${c.issuer}` : "";
        const dateStr = c.date ? ` (${c.date})` : "";
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• ${title}${issuerStr}${dateStr}`,
                size: 20,
              }),
            ],
          })
        );
      });
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${resume.title.replace(/\s+/g, "_")}.docx"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}
