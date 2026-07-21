/**
 * JSON Resume Schema Types
 * Based on https://github.com/jsonresume/jsonresume.org/blob/master/packages/schema/schema.json
 * Schema version: v1.0.0
 */

export interface JSONResume {
  $schema?: string;
  basics: JSONResumeBasics;
  work?: JSONResumeWork[];
  volunteer?: JSONResumeVolunteer[];
  education?: JSONResumeEducation[];
  awards?: JSONResumeAward[];
  certificates?: JSONResumeCertificate[];
  publications?: JSONResumePublication[];
  skills?: JSONResumeSkill[];
  languages?: JSONResumeLanguage[];
  interests?: JSONResumeInterest[];
  references?: JSONResumeReference[];
  projects?: JSONResumeProject[];
  meta?: JSONResumeMeta;
}

export interface JSONResumeBasics {
  name?: string;
  label?: string;
  image?: string;
  email?: string;
  phone?: string;
  url?: string;
  summary?: string;
  location?: JSONResumeLocation;
  profiles?: JSONResumeProfile[];
  [key: string]: unknown;
}

export interface JSONResumeLocation {
  address?: string;
  postalCode?: string;
  city?: string;
  countryCode?: string;
  region?: string;
  [key: string]: unknown;
}

export interface JSONResumeProfile {
  network?: string;
  username?: string;
  url?: string;
  [key: string]: unknown;
}

export interface JSONResumeWork {
  name?: string;
  location?: string;
  description?: string;
  position?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
  [key: string]: unknown;
}

export interface JSONResumeVolunteer {
  organization?: string;
  position?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
  [key: string]: unknown;
}

export interface JSONResumeEducation {
  institution?: string;
  url?: string;
  area?: string;
  studyType?: string;
  startDate?: string;
  endDate?: string;
  score?: string;
  courses?: string[];
  [key: string]: unknown;
}

export interface JSONResumeAward {
  title?: string;
  date?: string;
  awarder?: string;
  summary?: string;
  [key: string]: unknown;
}

export interface JSONResumeCertificate {
  name?: string;
  date?: string;
  url?: string;
  issuer?: string;
  [key: string]: unknown;
}

export interface JSONResumePublication {
  name?: string;
  publisher?: string;
  releaseDate?: string;
  url?: string;
  summary?: string;
  [key: string]: unknown;
}

export interface JSONResumeSkill {
  name?: string;
  level?: string;
  keywords?: string[];
  [key: string]: unknown;
}

export interface JSONResumeLanguage {
  language?: string;
  fluency?: string;
  [key: string]: unknown;
}

export interface JSONResumeInterest {
  name?: string;
  keywords?: string[];
  [key: string]: unknown;
}

export interface JSONResumeReference {
  name?: string;
  reference?: string;
  [key: string]: unknown;
}

export interface JSONResumeProject {
  name?: string;
  description?: string;
  highlights?: string[];
  keywords?: string[];
  startDate?: string;
  endDate?: string;
  url?: string;
  roles?: string[];
  entity?: string;
  type?: string;
  [key: string]: unknown;
}

export interface JSONResumeMeta {
  canonical?: string;
  version?: string;
  lastModified?: string;
  [key: string]: unknown;
}

/**
 * Resume model stored in DB (Prisma)
 * The `resumeData` field holds the full JSON Resume object.
 * Metadata fields are kept separate for query/display purposes.
 */
export interface ResumeRecord {
  id: string;
  userId: string;
  title: string;
  template: string;
  resumeData: JSONResume;
  targetCompany?: string | null;
  pdfUrl?: string | null;
  docxUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
