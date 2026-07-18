

export type ResumeHubViewType =
  | "dashboard"
  | "profile"
  | "settings"
  | "resume-hub"
  | "resume-builder"
  | "resume-upload"
  | "ats-checker"
  | "resume-improvements"
  | "cover-letter"
  | "linkedin-optimizer"
  | "lesson-view"
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
  | "notifications"
  | "ady-chat"
  | "interview-hub"
  | "interview-hr"
  | "interview-technical"
  | "interview-mock"
  | "flashcards"
  | "internship-hub"
  | "internship-finder"
  | "internship-recommendations"
  | "internship-tracker"
  | "job-hub"
  | "job-matching"
  | "job-jd-match"
  | "job-referrals"
  | "job-challenges"
  | "placement-hub"
  | "placement-aptitude"
  | "placement-reasoning"
  | "placement-mcqs"
  | "placement-mocks"
  | "placement-readiness"
  | "productivity-hub"
  | "prod-email"
  | "prod-sop"
  | "prod-linkedin"
  | "prod-content"
  | "analytics-hub"
  | "analytics-learning"
  | "analytics-interview"
  | "analytics-resume"
  | "analytics-skills"
  | "profile"
  | "settings"
  | "profile-learning"
  | "billing"
  | "community-profile"
  | "research-hub"
  | "research-paper-ai"
  | "research-plagiarism"
  | "progress-hub"
  | "study-planner";

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

