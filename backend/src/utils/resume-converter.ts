/**
 * Conversion utilities between legacy resume format and JSON Resume format.
 * Used for data migration and backward compatibility.
 */

import type {
  JSONResume,
  JSONResumeBasics,
  JSONResumeEducation,
  JSONResumeWork,
  JSONResumeProject,
  JSONResumeSkill,
  JSONResumeCertificate,
  JSONResumeLanguage,
} from "../types/json-resume";

// ─── Legacy format interfaces (what the frontend used to send) ──────────────

export interface LegacyPersonalInfo {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  summary?: string;
  [key: string]: unknown;
}

export interface LegacyEducationItem {
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
  [key: string]: unknown;
}

export interface LegacyExperienceItem {
  company?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  [key: string]: unknown;
}

export interface LegacyProjectItem {
  name?: string;
  title?: string;
  techStack?: string;
  description?: string;
  [key: string]: unknown;
}

export interface LegacyCertificationItem {
  name?: string;
  issuer?: string;
  date?: string;
  [key: string]: unknown;
}

export interface LegacyResumeData {
  personalInfo?: LegacyPersonalInfo;
  summary?: string;
  education?: LegacyEducationItem[];
  experience?: LegacyExperienceItem[];
  projects?: LegacyProjectItem[];
  skills?: string[];
  certifications?: LegacyCertificationItem[];
  achievements?: string[];
  languages?: string[];
  [key: string]: unknown;
}

// ─── Helper: Extract legacy format from any resume record ───────────────────

/**
 * Given a resume record from DB (which now stores `resumeData` as JSON Resume),
 * return the legacy-shaped object that existing controllers/components expect.
 * Also handles legacy-shaped objects that already have `personalInfo` field.
 */
export function extractLegacyFromRecord(resume: { resumeData?: unknown; personalInfo?: unknown }): LegacyResumeData {
  // Already in legacy format (e.g. from uploaded resume or AI extraction)
  if (resume.personalInfo !== undefined && resume.resumeData === undefined) {
    return resume as unknown as LegacyResumeData;
  }
  // JSON Resume format (from DB)
  const jr = (resume.resumeData as JSONResume) ?? { basics: {} };
  return jsonResumeToLegacy(jr);
}

// ─── Legacy → JSON Resume ──────────────────────────────────────────────────

export function legacyToJSONResume(legacy: LegacyResumeData): JSONResume {
  const personalInfo = legacy.personalInfo ?? {};

  const basics: JSONResumeBasics = {
    name: personalInfo.fullName ?? "",
    email: personalInfo.email ?? "",
    phone: personalInfo.phone ?? "",
    url: personalInfo.website ?? personalInfo.portfolio ?? "",
    summary: legacy.summary ?? personalInfo.summary ?? "",
    location: personalInfo.location
      ? { city: personalInfo.location }
      : undefined,
    profiles: buildProfiles(personalInfo),
  };

  const education: JSONResumeEducation[] = (legacy.education ?? []).map(
    (e) => ({
      institution: e.institution ?? "",
      area: e.fieldOfStudy ?? "",
      studyType: e.degree ?? "",
      startDate: e.startDate ?? "",
      endDate: e.endDate ?? "",
      score: e.grade ?? "",
    })
  );

  const work: JSONResumeWork[] = (legacy.experience ?? []).map((e) => ({
    name: e.company ?? "",
    position: e.role ?? "",
    startDate: e.startDate ?? "",
    endDate: e.endDate ?? "",
    summary: e.description ?? "",
    highlights: e.description ? e.description.split("\n").filter(Boolean) : [],
  }));

  const projects: JSONResumeProject[] = (legacy.projects ?? []).map((p) => ({
    name: p.name ?? p.title ?? "",
    description: p.description ?? "",
    keywords: p.techStack
      ? p.techStack.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
  }));

  const skills: JSONResumeSkill[] = [];
  if (legacy.skills?.length) {
    skills.push({
      name: "Technical Skills",
      level: "Professional",
      keywords: legacy.skills,
    });
  }

  const certificates: JSONResumeCertificate[] = (legacy.certifications ?? []).map(
    (c) => ({
      name: c.name ?? "",
      issuer: c.issuer ?? "",
      date: c.date ?? "",
    })
  );

  const languages: JSONResumeLanguage[] = (legacy.languages ?? []).map(
    (l) => ({
      language: l,
      fluency: "Fluent",
    })
  );

  return {
    $schema: "https://raw.githubusercontent.com/jsonresume/jsonresume.org/master/packages/schema/schema.json",
    basics,
    work: work.length ? work : undefined,
    education: education.length ? education : undefined,
    projects: projects.length ? projects : undefined,
    skills: skills.length ? skills : undefined,
    certificates: certificates.length ? certificates : undefined,
    languages: languages.length ? languages : undefined,
  };
}

function buildProfiles(
  p: LegacyPersonalInfo
): JSONResumeBasics["profiles"] | undefined {
  const profiles: JSONResumeBasics["profiles"] = [];
  if (p.linkedin)
    profiles.push({ network: "LinkedIn", url: p.linkedin, username: extractUsername(p.linkedin) });
  if (p.github)
    profiles.push({ network: "GitHub", url: p.github, username: extractUsername(p.github) });
  return profiles.length ? profiles : undefined;
}

function extractUsername(url: string): string {
  try {
    const parts = url.replace(/\/$/, "").split("/");
    return parts[parts.length - 1] ?? "";
  } catch {
    return url;
  }
}

// ─── JSON Resume → Legacy (for backward compat with existing components) ────

export function jsonResumeToLegacy(resume: JSONResume): LegacyResumeData {
  const b = resume.basics ?? {};

  const profiles = b.profiles ?? [];
  const linkedin = profiles.find((p) => p.network === "LinkedIn")?.url ?? "";
  const github = profiles.find((p) => p.network === "GitHub")?.url ?? "";

  return {
    personalInfo: {
      fullName: b.name ?? "",
      email: b.email ?? "",
      phone: b.phone ?? "",
      location: b.location?.city ?? "",
      website: b.url ?? "",
      linkedin,
      github,
      portfolio: b.url ?? "",
      summary: b.summary ?? "",
    },
    summary: b.summary ?? "",
    education: (resume.education ?? []).map((e) => ({
      institution: e.institution ?? "",
      degree: e.studyType ?? "",
      fieldOfStudy: e.area ?? "",
      startDate: e.startDate ?? "",
      endDate: e.endDate ?? "",
      grade: e.score ?? "",
    })),
    experience: (resume.work ?? []).map((w) => ({
      company: w.name ?? "",
      role: w.position ?? "",
      startDate: w.startDate ?? "",
      endDate: w.endDate ?? "",
      description: w.summary ?? (w.highlights ?? []).join("\n"),
    })),
    projects: (resume.projects ?? []).map((p) => ({
      name: p.name ?? "",
      title: p.name ?? "",
      techStack: (p.keywords ?? []).join(", "),
      description: p.description ?? "",
    })),
    skills: (resume.skills ?? []).flatMap((s) => s.keywords ?? []),
    certifications: (resume.certificates ?? []).map((c) => ({
      name: c.name ?? "",
      issuer: c.issuer ?? "",
      date: c.date ?? "",
    })),
    languages: (resume.languages ?? []).map((l) => l.language ?? ""),
  };
}
