

export type ResumeHubViewType =
  | "dashboard"
  | "profile"
  | "resume-hub"
  | "resume-builder"
  | "ats-checker"
  | "cover-letter"
  | "linkedin-optimizer"
  | "study-assistant"
  | "notes-generator"
  | "quiz-generator"
  | "assignment-generator"
  | "ppt-generator"
  | "mind-maps"
  | "coding-assistant"
  | "dsa-practice"
  | "coding-challenges"
  | "github-portfolio"
  | "notifications";

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
}

export interface EducationItem {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  grade: string;
}

export interface ExperienceItem {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ProjectItem {
  name?: string;
  title?: string;
  techStack: string;
  description: string;
}

export interface CertificationItem {
  name: string;
  issuer: string;
  date: string;
}
