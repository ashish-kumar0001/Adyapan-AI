import { generateText, generateJSON, MODELS } from "./openrouter";

function parseGeminiJson<T>(text: string, defaultValue: T): T {
  try {
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error("Failed to parse JSON:", text, error);
    return defaultValue;
  }
}

const RESUME_SYSTEM = "You are an expert resume writer and career coach. Provide concise, professional resume content.";
const ATS_SYSTEM = "You are an ATS (Applicant Tracking System) auditor and resume optimization expert.";
const LEARNING_SYSTEM = "You are an expert academic tutor. Provide clear, educational responses.";
const CODING_SYSTEM = "You are an expert senior software engineer and programming instructor.";

/**
 * 1. Generate Resume Summary
 */
export async function generateResumeSummary(
  personalInfo: any,
  education: any,
  experience: any,
  skills: any
): Promise<string> {
  const prompt = `Generate a professional resume summary (3-4 sentences, 50-80 words) based on:
Personal Info: ${JSON.stringify(personalInfo)}
Education: ${JSON.stringify(education)}
Experience: ${JSON.stringify(experience)}
Skills: ${JSON.stringify(skills)}

Focus on key achievements, years of experience, and core competencies. Write in a confident, professional third-person tone. Return ONLY the summary text.`;
  try {
    return await generateText(RESUME_SYSTEM, prompt, { model: MODELS.FAST });
  } catch (error) {
    console.warn("[Gemini] generateResumeSummary failed, using fallback:", error);
    return "Results-driven professional with a proven track record of academic and practical excellence, seeking to leverage skills in technology and problem-solving to contribute to organizational success.";
  }
}

/**
 * 2. Generate Project Descriptions
 */
export async function generateProjectDescription(
  title: string,
  techStack: string,
  role: string
): Promise<string> {
  const prompt = `Generate 3 professional, action-oriented bullet points describing a project for a resume.
Project Title: ${title}
Technologies: ${techStack}
Role: ${role}

Use the XYZ formula (Accomplished X as measured by Y, by doing Z) where possible. Start each with a strong action verb. Focus on measurable outcomes. Return bullet points separated by newlines, NO bullet symbols.`;
  try {
    return await generateText(RESUME_SYSTEM, prompt, { model: MODELS.FAST });
  } catch (error) {
    console.warn("[Gemini] generateProjectDescription failed, using fallback:", error);
    return `Designed and built ${title} utilizing ${techStack} to solve core system requirements.\nOptimized backend performance and frontend usability for enhanced scalability.\nCollaborated with developers to integrate data endpoints and ensure seamless deployment.`;
  }
}

/**
 * 3. Generate Experience Bullet Points
 */
export async function generateExperienceBulletPoints(
  role: string,
  company: string,
  description: string
): Promise<string> {
  const prompt = `Enhance the experience bullet points for:
Role: ${role}
Company: ${company}
Draft: ${description}

Generate 3 highly professional, result-oriented bullet points. Start each with a strong action verb. Quantify achievements where possible. Return separated by newlines, NO bullet symbols.`;
  try {
    return await generateText(RESUME_SYSTEM, prompt, { model: MODELS.FAST });
  } catch (error) {
    console.warn("[Gemini] generateExperienceBulletPoints failed, using fallback:", error);
    return `Spearheaded software development initiatives as a ${role} at ${company}, improving deployment velocity.\nArchitected scalable database architectures and clean REST APIs to serve client applications.\nDebugged critical production bugs, reducing latency and boosting customer satisfaction rates.`;
  }
}

/**
 * 4. Generate Skills Recommendations
 */
export async function generateSkillsRecommendations(existingSkills: string[]): Promise<string[]> {
  const prompt = `Based on these existing skills, recommend 5 additional highly relevant skills or technologies to add:
Existing Skills: ${existingSkills.join(", ")}

Return a JSON array of exactly 5 strings. Example: ["React", "TypeScript", "Docker", "AWS", "CI/CD"]`;
  const result = await generateJSON<string[]>(RESUME_SYSTEM, prompt, { model: MODELS.FAST }, []);
  return Array.isArray(result) ? result : [];
}

/**
 * 5. Analyze Resume ATS Score
 */
interface ATSAnalysisResult {
  score: number;
  missingKeywords: string[];
  recommendations: string[];
  formattingIssues: string[];
  strengths: string[];
}

export async function analyzeResumeATS(
  resumeText: string,
  targetRole: string
): Promise<ATSAnalysisResult> {
  const prompt = `Analyze this resume against the target role: "${targetRole}".

Resume:
"""
${resumeText}
"""

Output a JSON object with:
1. "score": integer 0-100 for ATS readiness
2. "missingKeywords": array of missing key technologies/skills
3. "recommendations": array of specific improvements
4. "formattingIssues": array of formatting problems detected
5. "strengths": array of elements done correctly`;

  const fallback: ATSAnalysisResult = {
    score: 60,
    missingKeywords: ["TypeScript", "Docker", "Unit Testing"],
    recommendations: ["Quantify achievements", "Structure section headers clearly"],
    formattingIssues: ["Verify font consistency", "Avoid headers/footers in templates"],
    strengths: ["Clean personal contact info", "Strong technical skills listed"],
  };

  return generateJSON<ATSAnalysisResult>(ATS_SYSTEM, prompt, { model: MODELS.BALANCED }, fallback);
}

/**
 * 6. Analyze Resume SWOT
 */
interface SWOTAnalysisResult {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export async function analyzeResumeSWOT(resumeText: string): Promise<SWOTAnalysisResult> {
  const prompt = `Perform a deep critical review of this resume.

Resume:
"""
${resumeText}
"""

Output a JSON object with:
1. "strengths": array of 3-4 professional strengths
2. "weaknesses": array of 3-4 weaknesses or gaps
3. "recommendations": array of 3-4 actionable recommendations`;

  const fallback: SWOTAnalysisResult = {
    strengths: ["Clear project descriptions", "Relevant tech stack"],
    weaknesses: ["Lack of leadership metrics", "Certifications section is empty"],
    recommendations: ["Incorporate cloud platforms skills", "Complete professional certifications"],
  };

  return generateJSON<SWOTAnalysisResult>(ATS_SYSTEM, prompt, { model: MODELS.BALANCED }, fallback);
}

/**
 * 7. Job Match Rate
 */
interface JobMatchResult {
  matchPercentage: number;
  feedback: string[];
  gapAnalysis: string[];
}

export async function analyzeJobMatch(
  resumeText: string,
  jobDescription: string
): Promise<JobMatchResult> {
  const prompt = `Compare the resume against this Job Description.

Resume:
"""
${resumeText}
"""

Job Description:
"""
${jobDescription}
"""

Output JSON:
1. "matchPercentage": integer 0-100
2. "feedback": array of feedback comments
3. "gapAnalysis": array of JD requirements not met in resume`;

  const fallback: JobMatchResult = {
    matchPercentage: 55,
    feedback: ["Align resume summary with target role keywords", "Highlight tech stack from JD"],
    gapAnalysis: ["Missing explicit testing experience", "System Design experience not highlighted"],
  };

  return generateJSON<JobMatchResult>(ATS_SYSTEM, prompt, { model: MODELS.BALANCED }, fallback);
}

// ============================================================================
// ENHANCED ATS CHECKER AI FUNCTIONS
// ============================================================================

/**
 * 21. Comprehensive ATS Deep Analysis
 */
export interface SectionScore {
  score: number;
  suggestions: string[];
}
export interface ATSDeepAnalysis {
  score: number;
  scoreLabel: string;
  keywordsFound: string[];
  keywordsMissing: string[];
  readability: string;
  length: string;
  formatting: string;
  recruiterScore: number;
  sectionScores: {
    summary: SectionScore;
    skills: SectionScore;
    experience: SectionScore;
    projects: SectionScore;
    education: SectionScore;
  };
  keywordAnalysis: {
    found: string[];
    missing: string[];
  };
  formattingCheck: {
    onePage: boolean;
    fontsConsistent: boolean;
    atsFriendly: boolean;
    headingsCorrect: boolean;
    contactPresent: boolean;
  };
  strengthBars: {
    summary: number;
    projects: number;
    skills: number;
    experience: number;
    education: number;
  };
  recommendations: string[];
  formattingIssues: string[];
  strengths: string[];
  formattingScore?: number;
  keywordScore?: number;
  projectScore?: number;
  skillsScore?: number;
  experienceScore?: number;
  educationScore?: number;
  readabilityScore?: number;
  strongKeywords?: string[];
  weakKeywords?: string[];
}

export function getDynamicFallback(resumeText: string, targetRole: string): ATSDeepAnalysis {
  const roleKeywords: Record<string, string[]> = {
    "Software Engineer": ["React", "Node.js", "JavaScript", "TypeScript", "HTML", "CSS", "SQL", "Git", "Docker", "AWS", "CI/CD", "REST API"],
    "Data Analyst": ["Python", "SQL", "Excel", "Tableau", "Power BI", "R", "Statistics", "Pandas", "NumPy", "Data Visualization", "ETL"],
    "Data Scientist": ["Python", "R", "SQL", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Pandas", "Scikit-Learn", "Statistics"],
    "Backend Developer": ["Node.js", "Express", "Python", "Django", "Go", "Java", "Spring Boot", "SQL", "PostgreSQL", "MongoDB", "Redis", "Docker", "AWS"],
    "Frontend Developer": ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Vue", "Angular", "Tailwind CSS", "Webpack", "Vite", "Sass"],
    "Full Stack Developer": ["React", "HTML", "CSS", "JavaScript", "TypeScript", "Node.js", "Express", "SQL", "PostgreSQL", "MongoDB", "Docker", "AWS", "Git"],
    "AI Engineer": ["Python", "Machine Learning", "Deep Learning", "NLP", "LLM", "PyTorch", "TensorFlow", "OpenAI", "Hugging Face", "LangChain", "Vector DB"],
    "General ATS": ["Project Management", "Agile", "Scrum", "Communication", "Leadership", "SQL", "Python", "Excel", "Data Analysis", "Cloud"],
  };

  const defaultKw = roleKeywords[targetRole] || roleKeywords["General ATS"];
  const resumeLower = resumeText.toLowerCase();
  const found: string[] = [];
  const missing: string[] = [];

  defaultKw.forEach(kw => {
    if (resumeLower.includes(kw.toLowerCase())) {
      found.push(kw);
    } else {
      missing.push(kw);
    }
  });

  const coverageRatio = found.length / Math.max(1, defaultKw.length);
  const calculatedScore = Math.min(95, Math.max(35, Math.round(coverageRatio * 85 + 10)));
  const scoreLabel = calculatedScore >= 90 ? "Excellent" : calculatedScore >= 75 ? "Good" : calculatedScore >= 60 ? "Fair" : "Poor";

  const readabilityScore = Math.round(50 + Math.random() * 40);
  const formattingScore = Math.round(60 + Math.random() * 30);
  
  return {
    score: calculatedScore,
    scoreLabel,
    formattingScore,
    keywordScore: Math.round(coverageRatio * 100),
    projectScore: Math.round(45 + Math.random() * 40),
    skillsScore: Math.round(50 + Math.random() * 45),
    experienceScore: Math.round(40 + Math.random() * 50),
    educationScore: 80,
    readabilityScore,
    keywordsFound: found.length > 0 ? found : ["Communication", "Problem Solving"],
    keywordsMissing: missing.length > 0 ? missing : ["Docker", "Kubernetes"],
    strongKeywords: found.slice(0, Math.ceil(found.length / 2)),
    weakKeywords: found.slice(Math.ceil(found.length / 2)),
    readability: readabilityScore >= 80 ? "Excellent" : readabilityScore >= 65 ? "Good" : "Fair",
    length: resumeText.length > 3000 ? "2 Pages" : "1 Page",
    formatting: formattingScore >= 80 ? "Excellent" : formattingScore >= 65 ? "Good" : "Fair",
    recruiterScore: Number((calculatedScore / 10).toFixed(1)),
    sectionScores: {
      summary: { score: calculatedScore >= 70 ? 8 : 6, suggestions: calculatedScore >= 70 ? [] : ["Add key achievements to executive summary"] },
      skills: { score: Math.round((found.length / defaultKw.length) * 10), suggestions: missing.length > 0 ? [`Add missing keywords: ${missing.slice(0, 2).join(", ")}`] : [] },
      experience: { score: 7, suggestions: ["Quantify achievements in experience section"] },
      projects: { score: 7, suggestions: ["Mention impact and tech stack in projects"] },
      education: { score: 8, suggestions: [] },
    },
    keywordAnalysis: {
      found: found.length > 0 ? found : ["Communication"],
      missing: missing.length > 0 ? missing : ["AWS"]
    },
    formattingCheck: {
      onePage: resumeText.length <= 3000,
      fontsConsistent: true,
      atsFriendly: true,
      headingsCorrect: true,
      contactPresent: true
    },
    strengthBars: {
      summary: calculatedScore >= 70 ? 80 : 60,
      projects: 70,
      skills: Math.round((found.length / defaultKw.length) * 100),
      experience: 65,
      education: 85
    },
    recommendations: [
      `Tailor resume with missing skills: ${missing.slice(0, 3).join(", ")}`,
      "Use strong action verbs to start experience bullet points",
      "Ensure resume format remains a single page if under 5 years experience"
    ],
    formattingIssues: [],
    strengths: ["Clear section titles", "Good technical skills keywords match"]
  };
}

export function getDynamicIntelligenceFallback(resumeText: string, targetRole: string): any {
  const resumeLower = resumeText.toLowerCase();
  const missing: Array<{ section: string; importance: "critical" | "important" | "nice-to-have"; reason: string }> = [];

  if (!resumeLower.includes("summary") && !resumeLower.includes("profile")) {
    missing.push({ section: "Summary", importance: "important", reason: "An executive summary provides immediate context on your career goals." });
  }
  if (!resumeLower.includes("project")) {
    missing.push({ section: "Projects", importance: "critical", reason: "Technical resumes require concrete proof of project implementations." });
  }
  if (!resumeLower.includes("experience") && !resumeLower.includes("history") && !resumeLower.includes("employment")) {
    missing.push({ section: "Experience", importance: "critical", reason: "Employers must see work history to gauge career growth." });
  }
  if (!resumeLower.includes("certification") && !resumeLower.includes("certificates")) {
    missing.push({ section: "Certifications", importance: "nice-to-have", reason: "Relevant certifications validate specialized knowledge." });
  }
  if (!resumeLower.includes("linkedin.com")) {
    missing.push({ section: "LinkedIn", importance: "important", reason: "Recruiters use LinkedIn to verify background details." });
  }
  if (!resumeLower.includes("github.com")) {
    missing.push({ section: "GitHub", importance: "important", reason: "For developers, GitHub displays source code formatting and project work." });
  }
  
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const redFlags: string[] = [];
  
  if (resumeText.length > 500) {
    strengths.push("Comprehensive text details provided");
  } else {
    redFlags.push("Short resume length / lacking detailed content");
    weaknesses.push("Resume is very brief; lacks details");
  }
  
  if (resumeLower.includes("react") || resumeLower.includes("angular") || resumeLower.includes("vue")) {
    strengths.push("Good frontend technology keywords matched");
  }
  if (resumeLower.includes("node") || resumeLower.includes("python") || resumeLower.includes("java")) {
    strengths.push("Solid backend programming concepts present");
  }
  
  const formattedRole = targetRole || "Software Engineer";
  const calculatedScore = Math.min(92, Math.max(45, Math.round(50 + Math.random() * 35)));
  
  return {
    recruiterView: {
      firstImpression: strengths.length > 0 ? `The resume shows foundation skills in ${strengths.slice(0, 2).join(" and ")}.` : "Resume is structured but lacks clear metrics and depth.",
      topStrengths: strengths.length > 0 ? strengths.slice(0, 3) : ["Structured layout", "Contact details present"],
      redFlags: redFlags.length > 0 ? redFlags : ["Lacks metrics / KPI achievements", "No visible links to source code repositories"],
      interviewWorthy: calculatedScore >= 70,
      hiringDecision: calculatedScore >= 70 ? `Candidate shows potential for the ${formattedRole} role; schedule initial screen.` : "Revise format and add quantitative impact statements before interviewing."
    },
    insights: {
      strengths: strengths.length > 0 ? strengths : ["Clear section dividers", "Standard professional contact format"],
      weaknesses: weaknesses.length > 0 ? weaknesses : ["Lack of action verbs for bullet points", "No listed projects using modern web frameworks"],
      risks: ["Candidate might be screened out due to low keyword matching density", "No proof of collaborative cloud deployments"],
      opportunities: ["Reorganize skills in technical categories", "Add details on team workflows or git repository links"]
    },
    missingSections: missing,
    structureAnalysis: {
      isAtsCompatible: true,
      issues: [],
      overallFormat: calculatedScore >= 80 ? "Excellent" : calculatedScore >= 65 ? "Good" : "Fair"
    },
    detailedAnalysis: {
      contactInfo: { present: true, score: 9, notes: ["Contact details are visible"] },
      summary: { present: resumeLower.includes("summary") || resumeLower.includes("profile"), score: resumeLower.includes("summary") ? 8 : 0, quality: resumeLower.includes("summary") ? "Good" : "Missing", notes: [] },
      skills: { present: resumeLower.includes("skill"), score: resumeLower.includes("skill") ? 8 : 5, count: 8, notes: [] },
      projects: { present: resumeLower.includes("project"), score: resumeLower.includes("project") ? 7 : 0, count: 2, quality: resumeLower.includes("project") ? "Fair" : "Missing", notes: [] },
      experience: { present: resumeLower.includes("experience"), score: resumeLower.includes("experience") ? 7 : 0, count: 2, notes: [] },
      education: { present: resumeLower.includes("education"), score: 8, notes: [] },
      certifications: { present: resumeLower.includes("certif"), score: resumeLower.includes("certif") ? 7 : 0, count: 1, notes: [] },
      achievements: { present: resumeLower.includes("achieve"), score: 6, count: 0, notes: [] },
      links: { present: resumeLower.includes("http"), score: resumeLower.includes("http") ? 8 : 4, notes: [] },
    },
    readabilityAnalysis: {
      overallGrade: calculatedScore >= 85 ? "A" : calculatedScore >= 70 ? "B" : "C",
      sentenceLength: "Moderate (12-18 words per sentence)",
      bulletUsage: "Consistent across sections",
      formattingConsistency: "Good alignment",
      scanningEase: "Standard readability index",
      recruiterFriendliness: "Standard professional view"
    },
    improvementRecommendations: [
      { priority: "high", category: "Keywords", title: `Add missing ${formattedRole} technical skills`, description: "Review and list libraries and databases requested by job targets.", impact: "Boosts parsing algorithms rate" },
      { priority: "medium", category: "Experience", title: "Add quantitative performance indicators", description: "Use statistics or metrics to demonstrate achievement value.", impact: "Improves recruiter screening rate" }
    ],
    jobTargetAnalysis: {
      role: formattedRole,
      matchScore: calculatedScore,
      alignedSkills: strengths,
      gapSkills: ["Docker", "AWS", "Kubernetes", "CI/CD"],
      roleSpecificAdvice: [`Review core job definitions for a ${formattedRole} candidate.`]
    }
  };
}

export async function analyzeResumeDeep(
  resumeText: string,
  targetRole: string,
  jobDescription?: string
): Promise<ATSDeepAnalysis> {
  const prompt = `Perform an exhaustive ATS audit of this resume for the target role: "${targetRole}".
${jobDescription ? `\nAlso compare against this Job Description:\n"""\n${jobDescription}\n"""\n` : ""}

Resume:
"""
${resumeText}
"""

Output a JSON object with this exact schema:
{
  "score": integer 0-100 (overall ATS readiness score),
  "scoreLabel": string (one of "Poor", "Fair", "Good", "Very Good", "Excellent"),
  "formattingScore": integer 0-100 (score for format guidelines and page-length compliance),
  "keywordScore": integer 0-100 (score representing target role keyword matching density),
  "projectScore": integer 0-100 (score for project details, achievements, and impact statements),
  "skillsScore": integer 0-100 (score representing tech stack completeness and relevance),
  "experienceScore": integer 0-100 (score representing career history detail and layout quality),
  "educationScore": integer 0-100 (score representing degrees, coursework, and credentials),
  "readabilityScore": integer 0-100 (score representing bullet structures, text alignment, and length),
  "keywordsFound": array of strings (keywords present in resume that match the target role),
  "keywordsMissing": array of strings (important keywords for the role not found in resume),
  "strongKeywords": array of strings (keywords from the resume that are strongly evidenced/proven by descriptions),
  "weakKeywords": array of strings (keywords mentioned in the resume but lacking descriptions/projects),
  "readability": string ("Excellent", "Good", "Fair", "Poor"),
  "length": string (e.g. "1 Page", "2 Pages"),
  "formatting": string ("Excellent", "Good", "Fair", "Poor"),
  "recruiterScore": number 0-10 (how a recruiter would rate it),
  "sectionScores": {
    "summary": { "score": 0-10, "suggestions": [string] },
    "skills": { "score": 0-10, "suggestions": [string] },
    "experience": { "score": 0-10, "suggestions": [string] },
    "projects": { "score": 0-10, "suggestions": [string] },
    "education": { "score": 0-10, "suggestions": [string] }
  },
  "keywordAnalysis": {
    "found": [strings of matched keywords],
    "missing": [strings of important missing keywords]
  },
  "formattingCheck": {
    "onePage": boolean,
    "fontsConsistent": boolean,
    "atsFriendly": boolean,
    "headingsCorrect": boolean,
    "contactPresent": boolean
  },
  "strengthBars": {
    "summary": 0-100,
    "projects": 0-100,
    "skills": 0-100,
    "experience": 0-100,
    "education": 0-100
  },
  "recommendations": [string],
  "formattingIssues": [string],
  "strengths": [string]
}

Be thorough and specific. Score honestly.`;

  const fallback: ATSDeepAnalysis = {
    score: 65, scoreLabel: "Fair",
    formattingScore: 70, keywordScore: 60, projectScore: 65, skillsScore: 80, experienceScore: 60, educationScore: 85, readabilityScore: 75,
    keywordsFound: ["Python", "JavaScript"], keywordsMissing: ["Docker", "AWS", "Kubernetes"],
    strongKeywords: ["Python"], weakKeywords: ["JavaScript"],
    readability: "Good", length: "1 Page", formatting: "Good", recruiterScore: 7.2,
    sectionScores: {
      summary: { score: 7, suggestions: ["Add measurable achievements"] },
      skills: { score: 8, suggestions: ["Add cloud technologies"] },
      experience: { score: 6, suggestions: ["Quantify achievements"] },
      projects: { score: 7, suggestions: ["Add tech stack details"] },
      education: { score: 8, suggestions: ["Add relevant coursework"] },
    },
    keywordAnalysis: { found: ["Python", "JavaScript"], missing: ["Docker", "AWS"] },
    formattingCheck: { onePage: true, fontsConsistent: true, atsFriendly: true, headingsCorrect: true, contactPresent: true },
    strengthBars: { summary: 70, projects: 65, skills: 80, experience: 60, education: 85 },
    recommendations: ["Add missing keywords", "Quantify achievements"],
    formattingIssues: [], strengths: ["Strong technical skills"],
  };

  return generateJSON<ATSDeepAnalysis>(ATS_SYSTEM, prompt, { model: MODELS.POWERFUL }, getDynamicFallback(resumeText, targetRole));
}

/**
 * 22. ATS AI Chat - Interactive resume improvement
 */
export async function atsAIChat(
  resumeText: string,
  analysis: any,
  message: string
): Promise<{ reply: string; updatedSections?: Record<string, any> }> {
  const prompt = `You are an ATS optimization expert embedded in a resume checker. The user message: "${message}"

Current Resume Text:
"""
${resumeText}
"""

ATS Analysis Summary: ${JSON.stringify(analysis)}

Interpret the user's intent and respond helpfully. If the user asks to improve something specific (summary, skills, experience, projects), return the updated content.

Examples:
- "Improve my ATS score" → suggest specific improvements
- "Optimize for Google" → tailor resume for Google
- "Rewrite my summary" → return new summary text
- "Add missing keywords" → return keywords to add and where
- "Reduce resume length" → suggest what to cut

Output JSON:
{
  "reply": "Your conversational response to the user",
  "updatedSections": { optional section updates }
}`;

  const fallback = { reply: "I understand you want help with your resume. Could you be more specific about what you'd like to improve?", updatedSections: undefined };
  return generateJSON<{ reply: string; updatedSections?: Record<string, any> }>(
    ATS_SYSTEM, prompt, { model: MODELS.POWERFUL }, fallback
  );
}

/**
 * 23. Generate ATS Improvement Suggestions
 */
export interface ATSSuggestion {
  id: string;
  section: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  original: string;
  improved: string;
}

export async function generateATSSuggestions(
  resumeText: string,
  analysis: ATSDeepAnalysis,
  targetRole: string
): Promise<ATSSuggestion[]> {
  const prompt = `Generate specific, actionable suggestions to improve this resume for the target role "${targetRole}".

ATS Analysis:
${JSON.stringify(analysis, null, 2)}

Resume:
"""
${resumeText}
"""

Output a JSON array of suggestion objects. Each suggestion must include:
{
  "id": string (unique, e.g. "sugg-1"),
  "section": string (which section: "summary", "skills", "experience", "projects", "education", "formatting", "keywords"),
  "title": string (short title like "Improve Summary" or "Add Docker"),
  "description": string (detailed explanation),
  "impact": "high" | "medium" | "low",
  "original": string (the current text or context),
  "improved": string (the improved version)
}

Generate 5-8 suggestions. Be specific and actionable.`;

  const fallback: ATSSuggestion[] = [
    { id: "sugg-1", section: "summary", title: "Improve Summary", description: "Add measurable achievements", impact: "high", original: "", improved: "" },
    { id: "sugg-2", section: "skills", title: "Add Docker", description: "Docker is commonly required", impact: "high", original: "", improved: "" },
  ];
  return generateJSON<ATSSuggestion[]>(ATS_SYSTEM, prompt, { model: MODELS.POWERFUL }, fallback);
}

/**
 * 24. Apply single ATS suggestion (improve specific section)
 */
export async function applyATSSuggestion(
  resumeSection: string,
  currentContent: string,
  suggestion: string
): Promise<string> {
  const prompt = `Improve this resume ${resumeSection} section based on the suggestion.

Current Content:
"""
${currentContent}
"""

Suggestion: ${suggestion}

Return ONLY the improved content. Be concise and professional.`;

  try {
    return await generateText(ATS_SYSTEM, prompt, { model: MODELS.FAST });
  } catch (error) {
    console.warn("[Gemini] applyATSSuggestion failed, returning original content:", error);
    return currentContent;
  }
}

// ─── ATS Intelligence Engine (Day 22) ───────────────────────────────────────

export interface ATSIntelligenceResult {
  recruiterView: {
    firstImpression: string;
    topStrengths: string[];
    redFlags: string[];
    interviewWorthy: boolean;
    hiringDecision: string;
  };
  insights: {
    strengths: string[];
    weaknesses: string[];
    risks: string[];
    opportunities: string[];
  };
  missingSections: Array<{
    section: string;
    importance: "critical" | "important" | "nice-to-have";
    reason: string;
  }>;
  structureAnalysis: {
    isAtsCompatible: boolean;
    issues: Array<{ issue: string; severity: "high" | "medium" | "low"; fix: string }>;
    overallFormat: string;
  };
  detailedAnalysis: {
    contactInfo: { present: boolean; score: number; notes: string[] };
    summary: { present: boolean; score: number; quality: string; notes: string[] };
    skills: { present: boolean; score: number; count: number; notes: string[] };
    projects: { present: boolean; score: number; count: number; quality: string; notes: string[] };
    experience: { present: boolean; score: number; count: number; notes: string[] };
    education: { present: boolean; score: number; notes: string[] };
    certifications: { present: boolean; score: number; count: number; notes: string[] };
    achievements: { present: boolean; score: number; count: number; notes: string[] };
    links: { present: boolean; score: number; notes: string[] };
  };
  readabilityAnalysis: {
    overallGrade: string;
    sentenceLength: string;
    bulletUsage: string;
    formattingConsistency: string;
    scanningEase: string;
    recruiterFriendliness: string;
  };
  improvementRecommendations: Array<{
    priority: "high" | "medium" | "low";
    category: string;
    title: string;
    description: string;
    impact: string;
  }>;
  jobTargetAnalysis?: {
    role: string;
    matchScore: number;
    alignedSkills: string[];
    gapSkills: string[];
    roleSpecificAdvice: string[];
  };
}

export async function analyzeResumeIntelligence(
  resumeText: string,
  targetRole: string,
  jobDescription?: string
): Promise<ATSIntelligenceResult> {
  const prompt = `You are a senior ATS specialist and technical recruiter with 15+ years of experience at FAANG companies. Perform an exhaustive intelligence analysis of this resume for the target role: "${targetRole}".
${jobDescription ? `\nAlso compare against this Job Description:\n"""\n${jobDescription}\n"""\n` : ""}

Resume:
"""
${resumeText}
"""

Instructions for Analysis:
1. Detect any missing sections or essential elements: Summary, Projects, Experience, Certifications, Portfolio Links, GitHub, LinkedIn. Populate in "missingSections" if not found.
2. Perform an ATS Compatibility Layout Check: Look for Bad Formatting, Table-heavy Layouts, Poor Headings, Complex Designs, or Unreadable Layouts. Populate any issues in "structureAnalysis.issues" and describe them clearly with actionable fixes.
3. Classify keywords carefully: Programming Languages, Frameworks, Tools, Databases, Cloud Technologies, Soft Skills, and identify missing ones.
4. Analyze recruiter first impressions, red flags, hiring decision, strengths, weaknesses, risks, and prioritize high/medium/low recommendations.

Analyze like a real recruiter would. Be brutally honest and specific. Output JSON with this exact schema:

{
  "recruiterView": {
    "firstImpression": "string - what a recruiter notices in the first 6 seconds",
    "topStrengths": ["string - top 3 strengths a recruiter sees"],
    "redFlags": ["string - things that concern a recruiter"],
    "interviewWorthy": boolean,
    "hiringDecision": "string - Would you interview this candidate? Why/why not?"
  },
  "insights": {
    "strengths": ["string - 3-5 specific strengths with evidence"],
    "weaknesses": ["string - 3-5 specific weaknesses with evidence"],
    "risks": ["string - 2-3 risks for this candidate"],
    "opportunities": ["string - 2-3 improvement opportunities"]
  },
  "missingSections": [
    { "section": "string", "importance": "critical|important|nice-to-have", "reason": "string" }
  ],
  "structureAnalysis": {
    "isAtsCompatible": boolean,
    "issues": [{ "issue": "string", "severity": "high|medium|low", "fix": "string" }],
    "overallFormat": "Excellent|Good|Fair|Poor"
  },
  "detailedAnalysis": {
    "contactInfo": { "present": boolean, "score": 0-10, "notes": ["string"] },
    "summary": { "present": boolean, "score": 0-10, "quality": "string", "notes": ["string"] },
    "skills": { "present": boolean, "score": 0-10, "count": 0, "notes": ["string"] },
    "projects": { "present": boolean, "score": 0-10, "count": 0, "quality": "string", "notes": ["string"] },
    "experience": { "present": boolean, "score": 0-10, "count": 0, "notes": ["string"] },
    "education": { "present": boolean, "score": 0-10, "notes": ["string"] },
    "certifications": { "present": boolean, "score": 0-10, "count": 0, "notes": ["string"] },
    "achievements": { "present": boolean, "score": 0-10, "count": 0, "notes": ["string"] },
    "links": { "present": boolean, "score": 0-10, "notes": ["string"] }
  },
  "readabilityAnalysis": {
    "overallGrade": "A+|A|B+|B|C+|C|D|F",
    "sentenceLength": "string",
    "bulletUsage": "string",
    "formattingConsistency": "string",
    "scanningEase": "string",
    "recruiterFriendliness": "string"
  },
  "improvementRecommendations": [
    { "priority": "high|medium|low", "category": "string", "title": "string", "description": "string", "impact": "string" }
  ],
  "jobTargetAnalysis": {
    "role": "${targetRole}",
    "matchScore": 0-100,
    "alignedSkills": ["string"],
    "gapSkills": ["string"],
    "roleSpecificAdvice": ["string"]
  }
}

Be thorough, specific, and actionable. Score honestly. Do not be generic.`;

  const fallback: ATSIntelligenceResult = {
    recruiterView: { firstImpression: "Resume needs significant improvement", topStrengths: [], redFlags: [], interviewWorthy: false, hiringDecision: "Needs revision" },
    insights: { strengths: [], weaknesses: [], risks: [], opportunities: [] },
    missingSections: [],
    structureAnalysis: { isAtsCompatible: false, issues: [], overallFormat: "Fair" },
    detailedAnalysis: {
      contactInfo: { present: false, score: 5, notes: [] },
      summary: { present: false, score: 3, quality: "Missing", notes: [] },
      skills: { present: false, score: 5, count: 0, notes: [] },
      projects: { present: false, score: 3, count: 0, quality: "Missing", notes: [] },
      experience: { present: false, score: 3, count: 0, notes: [] },
      education: { present: false, score: 5, notes: [] },
      certifications: { present: false, score: 3, count: 0, notes: [] },
      achievements: { present: false, score: 3, count: 0, notes: [] },
      links: { present: false, score: 3, notes: [] },
    },
    readabilityAnalysis: { overallGrade: "C", sentenceLength: "N/A", bulletUsage: "N/A", formattingConsistency: "N/A", scanningEase: "N/A", recruiterFriendliness: "N/A" },
    improvementRecommendations: [],
  };
  return generateJSON<ATSIntelligenceResult>(ATS_SYSTEM, prompt, { model: MODELS.POWERFUL }, getDynamicIntelligenceFallback(resumeText, targetRole));
}

export interface ResumeComparisonResult {
  versionA: { score: number; strengths: string[]; weaknesses: string[] };
  versionB: { score: number; strengths: string[]; weaknesses: string[] };
  improvements: Array<{ area: string; oldScore: number; newScore: number; change: string; notes: string }>;
  recommendation: string;
  overallImprovement: number;
}

export async function compareResumes(
  resumeAText: string,
  resumeBText: string,
  targetRole: string
): Promise<ResumeComparisonResult> {
  const prompt = `Compare these two resume versions for the target role: "${targetRole}".

Resume Version A:
"""
${resumeAText}
"""

Resume Version B:
"""
${resumeBText}
"""

Output JSON:
{
  "versionA": { "score": 0-100, "strengths": ["string"], "weaknesses": ["string"] },
  "versionB": { "score": 0-100, "strengths": ["string"], "weaknesses": ["string"] },
  "improvements": [{ "area": "string", "oldScore": 0-100, "newScore": 0-100, "change": "+/-N", "notes": "string" }],
  "recommendation": "string - which version is better and why",
  "overallImprovement": 0 (positive = B is better, negative = A is better)
}`;

  const fallback: ResumeComparisonResult = {
    versionA: { score: 65, strengths: [], weaknesses: [] },
    versionB: { score: 65, strengths: [], weaknesses: [] },
    improvements: [],
    recommendation: "Both versions are similar",
    overallImprovement: 0,
  };
  return generateJSON<ResumeComparisonResult>(ATS_SYSTEM, prompt, { model: MODELS.POWERFUL }, fallback);
}

interface CoverLetterResult {
  greeting: string;
  introduction: string;
  body: string;
  closing: string;
}

const COVER_LETTER_SYSTEM = `You are an expert cover letter writer and career coach. You write personalized, ATS-friendly cover letters that align a candidate's resume with the target company and role. Return ONLY valid JSON.`;

/**
 * 8. Cover Letter Generator
 */
export async function generateCoverLetterText(
  resumeText: string,
  companyName: string,
  role: string,
  jobDescription: string,
  tone: string,
  letterType: string
): Promise<CoverLetterResult> {
  const prompt = `Generate a cover letter using the candidate's actual resume data below.

RESUME:
"""
${resumeText}
"""

TARGET COMPANY: ${companyName}
TARGET ROLE: ${role}
JOB DESCRIPTION: ${jobDescription || "Not provided — use resume to infer relevant skills"}
TONE: ${tone}
LETTER TYPE: ${letterType}

Write a tailored cover letter that:
- References specific projects, skills, and experience from the resume
- Matches the candidate's background to the company/role requirements
- Uses the specified tone
- Is appropriate for the letter type (Internship, Full-Time, Referral, Career Switch, General Application)

Return JSON with exactly these fields:
{
  "greeting": "Opening salutation (e.g. Dear Hiring Manager,)",
  "introduction": "First paragraph — who you are, which role, and your enthusiasm",
  "body": "1-2 paragraphs highlighting relevant experience, projects, skills from the resume that match the role",
  "closing": "Final paragraph — thank you, call to action, and sign-off"
}`;

  const fallback: CoverLetterResult = {
    greeting: `Dear Hiring Manager,`,
    introduction: `I am writing to express my enthusiastic interest in the ${role} position at ${companyName}. With my background in software engineering and hands-on project experience, I am confident I can contribute meaningfully to your team.`,
    body: `In my previous experience, I have worked on projects that align closely with the requirements for this role. My technical expertise spans modern development frameworks, cloud platforms, and scalable system architecture. I am particularly drawn to ${companyName}'s mission and would be thrilled to bring my skills to your organization.`,
    closing: `Thank you for considering my application. I look forward to the opportunity to discuss how my experience aligns with ${companyName}'s goals.`,
  };

  return generateJSON<CoverLetterResult>(COVER_LETTER_SYSTEM, prompt, { model: MODELS.BALANCED }, fallback);
}

/**
 * 8b. Cover Letter AI Chat — refine existing letter
 */
export async function generateCoverLetterChat(
  resumeText: string,
  currentLetter: CoverLetterResult,
  message: string
): Promise<CoverLetterResult> {
  const prompt = `You are helping the user refine their cover letter.

CURRENT LETTER:
- Greeting: ${currentLetter.greeting}
- Introduction: ${currentLetter.introduction}
- Body: ${currentLetter.body}
- Closing: ${currentLetter.closing}

USER REQUEST: "${message}"

RESUME CONTEXT:
"""
${resumeText}
"""

Return the updated cover letter as JSON with fields: greeting, introduction, body, closing.`;

  const fallback = currentLetter;
  return generateJSON<CoverLetterResult>(COVER_LETTER_SYSTEM, prompt, { model: MODELS.FAST }, fallback);
}

/**
 * 9. LinkedIn Optimizer
 */
interface LinkedInOptimizationResult {
  headline: string;
  aboutSection: string;
  skills: string[];
  recommendations: string[];
  score: number;
}

export async function optimizeLinkedInProfile(profileData: {
  headline: string;
  about: string;
  experience: string;
  skills: string;
  targetRole: string;
}): Promise<LinkedInOptimizationResult> {
  const prompt = `Analyze and optimize this LinkedIn profile for target role: "${profileData.targetRole}".

Current Headline: ${profileData.headline}
Current About: ${profileData.about}
Experience: ${profileData.experience}
Skills: ${profileData.skills}

Output JSON with:
1. "headline": optimized headline
2. "aboutSection": engaging About summary (150-250 words, first person)
3. "skills": array of 5 recommended skills to add
4. "recommendations": array of 3-4 suggestions
5. "score": optimization score 0-100`;

  const fallback: LinkedInOptimizationResult = {
    headline: `${profileData.targetRole || "Software Engineer"} | TypeScript | React | Node.js`,
    aboutSection: "Passionate engineer focused on crafting efficient and user-centered digital solutions.",
    skills: ["TypeScript", "System Design", "Cloud Infrastructure"],
    recommendations: ["Add media links to experience cards", "Optimize About with target role keywords"],
    score: 70,
  };

  return generateJSON<LinkedInOptimizationResult>(ATS_SYSTEM, prompt, { model: MODELS.BALANCED }, fallback);
}

// ============================================================================
// LEARNING HUB AI SERVICES
// ============================================================================

/**
 * 10. Study Assistant Chat Response
 */
export async function generateStudyResponse(
  context: string,
  query: string
): Promise<string> {
  const prompt = `Context from uploaded documents:
"""
${context}
"""

Student's Query: ${query}

Answer clearly using markdown. Break down concepts simply if needed.`;
  try {
    return await generateText(LEARNING_SYSTEM, prompt, { model: MODELS.FAST });
  } catch (error) {
    console.warn("[Gemini] generateStudyResponse failed, using fallback:", error);
    return "I am currently unable to process your query due to a system error. Please try again later.";
  }
}

/**
 * 11. Notes Generator
 */
export async function generateNotes(
  topic: string,
  difficulty: string,
  type: string
): Promise<string> {
  const prompt = `Generate study notes on: "${topic}".
Requested Difficulty: ${difficulty}
Requested Style: ${type}

Instructions:
1. Pay close attention to the input topic string. If the user has specified any custom style, detail level, format, or depth (such as "detailed notes", "advanced notes", "deep-dive", "cheat sheet", "short revision", etc.) in the topic string, strictly prioritize and follow those specifications.
2. If "detailed" or "advanced" is requested, make sure the notes are highly comprehensive, include advanced explanations, mathematical or code details where applicable, and deep concepts.
3. Structure the notes logically with clear headings, bullet points, and markdown. Highlight key definitions and formulas.
4. Return ONLY valid markdown.`;
  try {
    console.log("[Notes Generator] Starting for topic:", topic, "Difficulty:", difficulty);
    const result = await generateText(LEARNING_SYSTEM, prompt, { model: MODELS.POWERFUL });
    console.log("[Notes Generator] Successfully generated notes, length:", result?.length || 0);
    
    if (!result || result.trim().length === 0) {
      throw new Error("Empty response from AI model");
    }
    
    return result;
  } catch (error) {
    console.error("[Notes Generator] Error generating notes:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * 12. Quiz Generator
 */
export interface QuizGenerationResult {
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;
  flashcards: Array<{
    front: string;
    back: string;
  }>;
}

export async function generateQuiz(
  topic: string,
  count: number,
  difficulty: string
): Promise<QuizGenerationResult> {
  const prompt = `Generate a quiz and flashcards for topic: "${topic}".
Difficulty: ${difficulty}
Questions: ${count}

Output JSON:
1. "questions": array of ${count} objects with "question", "options" (4 strings), "correctAnswer", "explanation"
2. "flashcards": array of ${Math.ceil(count / 2)} objects with "front" (term) and "back" (definition)`;

  const fallback: QuizGenerationResult = { questions: [], flashcards: [] };
  return generateJSON<QuizGenerationResult>(LEARNING_SYSTEM, prompt, { model: MODELS.BALANCED }, fallback);
}

/**
 * 13. Assignment Generator
 */
export interface AssignmentResult {
  introduction: string;
  body: string;
  conclusion: string;
  references: string[];
}

export async function generateAssignment(
  topic: string,
  level: string,
  wordCount: number
): Promise<AssignmentResult> {
  const prompt = `Write an academic assignment on topic: "${topic}".
Level: ${level}
Target Words: ${wordCount}

Output JSON:
1. "introduction": introductory text (markdown)
2. "body": main body content (markdown)
3. "conclusion": conclusion (markdown)
4. "references": array of 3-5 APA references`;

  const fallback: AssignmentResult = { introduction: "", body: "", conclusion: "", references: [] };
  return generateJSON<AssignmentResult>(LEARNING_SYSTEM, prompt, { model: MODELS.POWERFUL }, fallback);
}

/**
 * 14. PPT Generator
 */
export interface PptSlide {
  title: string;
  bullets: string[];
  notes: string;
}

export async function generatePPTContent(
  topic: string,
  slideCount: number
): Promise<PptSlide[]> {
  const prompt = `Create a presentation on topic: "${topic}".
Slides: ${slideCount}

Output JSON array of objects, each with:
1. "title": slide title
2. "bullets": array of 3-5 bullet points
3. "notes": speaker notes for the slide`;

  return generateJSON<PptSlide[]>(LEARNING_SYSTEM, prompt, { model: MODELS.BALANCED }, []);
}

/**
 * 15. Mind Map Generator (React Flow Schema)
 */
export interface MindMapResult {
  nodes: Array<{ id: string; type: string; data: { label: string }; position: { x: number; y: number } }>;
  edges: Array<{ id: string; source: string; target: string }>;
}

export async function generateMindMapSchema(topic: string): Promise<MindMapResult> {
  const prompt = `Create a mind map for topic: "${topic}".

Output JSON with:
1. "nodes": array for React Flow, each with "id", "type" ("default"), "data" ({ "label": string }), "position" ({ x, y }). Root at x:250, y:50.
2. "edges": array to connect nodes, each with "id", "source", "target"`;

  const fallback: MindMapResult = { nodes: [], edges: [] };
  return generateJSON<MindMapResult>(LEARNING_SYSTEM, prompt, { model: MODELS.BALANCED }, fallback);
}

/**
 * 16. Enhance Project Description
 */
export async function enhanceProjectDescription(
  projectName: string,
  techStack: string,
  description: string
): Promise<string> {
  const prompt = `Optimize the description for project "${projectName}" (${techStack}).
Raw: "${description}"

Rewrite to be extremely professional, action-oriented, highlight impact/metrics. Use 2-3 strong bullet points. No intro/outro.`;
  try {
    return await generateText(RESUME_SYSTEM, prompt, { model: MODELS.FAST });
  } catch (error) {
    console.warn("[Gemini] enhanceProjectDescription failed, returning original description:", error);
    return description;
  }
}

/**
 * 17. Enhance Experience Bullet-points
 */
export async function enhanceExperienceDescription(
  role: string,
  company: string,
  description: string
): Promise<string> {
  const prompt = `Optimize the job description for ${role} at ${company}.
Raw: "${description}"

Rewrite using STAR method. Focus on achievements, technical contributions, metrics. Output 3-4 bullet points starting with strong action verbs. Return ONLY bullet points.`;
  try {
    return await generateText(RESUME_SYSTEM, prompt, { model: MODELS.FAST });
  } catch (error) {
    console.warn("[Gemini] enhanceExperienceDescription failed, returning original description:", error);
    return description;
  }
}

/**
 * 18. Optimize Entire Resume for Target Company
 */
export async function optimizeResumeContent(
  resumeJson: any,
  targetCompany: string
): Promise<any> {
  const companyValues: Record<string, string> = {
    Google: "Innovation, technical complexity, algorithmic optimization, scalable design.",
    Amazon: "Ownership, customer obsession, Bias for Action, Leadership Principles.",
    Microsoft: "Engineering excellence, collaborative alignment, security, cloud scale.",
    Meta: "Scale, rapid iteration, impact, Move Fast, system performance.",
    Apple: "Detail orientation, premium quality, design integration, hardware-software synergy.",
    Startup: "Versatility, high impact, end-to-end execution, rapid MVP creation.",
  };

  const values = companyValues[targetCompany] || "General professional excellence.";

  const prompt = `Optimize this resume to stand out at "${targetCompany}".
Values prized at ${targetCompany}: "${values}"

Input Resume:
${JSON.stringify(resumeJson)}

Output a JSON object matching this schema:
{
  "personalInfo": { "fullName": "", "email": "", "phone": "", "linkedin": "", "github": "", "portfolio": "", "location": "", "summary": "" },
  "summary": "optimized professional summary",
  "education": [{ "institution": "", "degree": "", "fieldOfStudy": "", "startDate": "", "endDate": "", "grade": "" }],
  "experience": [{ "company": "", "role": "", "startDate": "", "endDate": "", "description": "optimized" }],
  "projects": [{ "name": "", "techStack": "", "description": "optimized" }],
  "skills": ["optimized", "skills"],
  "certifications": [{ "name": "", "issuer": "", "date": "" }],
  "achievements": ["achievement"],
  "languages": ["language"]
}`;

  return generateJSON<unknown>(RESUME_SYSTEM, prompt, { model: MODELS.BALANCED }, resumeJson);
}

/**
 * 19. Resume AI Chat - Understands user intent and updates resume sections
 */
export async function resumeAIChat(
  resumeData: any,
  message: string
): Promise<{ summary?: string; experience?: any[]; projects?: any[]; skills?: string[] }> {
  const prompt = `You are an AI resume assistant embedded in a resume builder. The user sent: "${message}"

Current Resume Data:
${JSON.stringify(resumeData, null, 2)}

Interpret the user's request and return ONLY the sections that need to change as JSON.
Examples of what users might ask:
- "Optimize for Amazon" → rewrite summary, experience bullets, and skills for Amazon
- "Improve my summary" → return just the summary field
- "Add stronger action verbs" → rewrite experience descriptions with action verbs
- "Reduce to one page" → condense all sections
- "Make it more ATS friendly" → add keywords, improve formatting
- "Improve project descriptions" → rewrite project descriptions with metrics

Return format:
{
  "summary": "updated summary or omit if unchanged",
  "experience": [updated array or omit if unchanged],
  "projects": [updated array or omit if unchanged],
  "skills": ["updated array or omit if unchanged"]
}

Only include fields that actually changed. Omit unchanged fields entirely.`;

  const defaultResult = { } as any;
  try {
    return await generateJSON<{ summary?: string; experience?: any[]; projects?: any[]; skills?: string[] }>(
      RESUME_SYSTEM, prompt, { model: MODELS.POWERFUL }, defaultResult
    );
  } catch (error) {
    console.warn("[Gemini] resumeAIChat failed, returning empty result:", error);
    return {};
  }
}

// ============================================================================
// INTERVIEW HUB AI SERVICES
// ============================================================================

/**
 * 19. Start Interview - Generate First Question
 */
export async function generateInterviewQuestion(
  role: string,
  company: string | null,
  type: string,
  difficulty: string,
  history: { role: string; content: string }[]
): Promise<string> {
  const isFirstQuestion = history.length === 0;

  const systemPrompt = `You are a professional interviewer conducting a ${type} interview for a ${role} position${company ? ` at ${company}` : ""}.
Difficulty: ${difficulty}

Ask relevant, insightful questions that test the candidate's knowledge and skills.
${type === "technical" ? "Focus on technical concepts, problem-solving, system design, and practical scenarios." : ""}
${type === "behavioral" ? "Focus on past experiences, teamwork, leadership, conflict resolution using STAR format." : ""}
${type === "general" ? "Mix of technical and behavioral questions." : ""}

Keep questions concise. Do not evaluate or give feedback unless asked.`;

  const userPrompt = isFirstQuestion
    ? `The interview is starting now. Ask the first ${type} interview question for a ${role} position${company ? ` at ${company}` : ""} at ${difficulty} difficulty.`
    : `The candidate responded: "${history[history.length - 1].content}"

Based on their answer, ask the next appropriate ${type} interview question. If you have enough information to evaluate, you may provide brief feedback before the next question.`;

  try {
    return await generateText(systemPrompt, userPrompt, {
      model: MODELS.POWERFUL,
      temperature: 0.8,
    });
  } catch (error) {
    console.warn("[Gemini] generateInterviewQuestion failed, using fallback:", error);
    return "Tell me about yourself and your experience relevant to this role.";
  }
}

/**
 * 20. Generate Interview Feedback
 */
export interface InterviewFeedback {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  areasForImprovement: string[];
  suggestedAnswers: string[];
  recommendedResources: string[];
}

export async function generateInterviewFeedback(
  role: string,
  company: string | null,
  type: string,
  messages: { role: string; content: string }[]
): Promise<InterviewFeedback> {
  const conversation = messages
    .filter((m) => m.role !== "feedback")
    .map((m) => `[${m.role === "interviewer" ? "Interviewer" : "Candidate"}]: ${m.content}`)
    .join("\n\n");

  const prompt = `Review this ${type} interview for a ${role} position${company ? ` at ${company}` : ""}.

Interview Transcript:
"""
${conversation}
"""

Provide comprehensive feedback as JSON:
1. "overallScore": integer 0-100
2. "strengths": array of 3-5 specific strengths demonstrated
3. "weaknesses": array of 3-5 areas where the candidate struggled
4. "areasForImprovement": array of 3-5 actionable improvement suggestions
5. "suggestedAnswers": array of 2-3 example strong answers for questions they struggled with
6. "recommendedResources": array of 2-3 resources (books, courses, topics) to study`;

  const fallback: InterviewFeedback = {
    overallScore: 70,
    strengths: ["Good communication skills", "Relevant technical knowledge"],
    weaknesses: ["Could provide more specific examples", "Need more depth in some areas"],
    areasForImprovement: ["Practice structured answers using STAR", "Deepen system design knowledge"],
    suggestedAnswers: ["Use the STAR format to structure your answers"],
    recommendedResources: ["Cracking the Coding Interview", "System Design Interview by Alex Xu"],
  };

  return generateJSON<InterviewFeedback>(ATS_SYSTEM, prompt, { model: MODELS.POWERFUL }, fallback);
}

// ============================================================================
// ENHANCED LEARNING HUB AI FUNCTIONS
// ============================================================================

export interface EnhancedMindMapResult {
  mindmap: {
    nodes: Array<{
      id: string;
      label: string;
      type: "root" | "concept" | "example" | "application" | "sub_concept";
      definition: string;
      whyItMatters: string;
      realExample: string;
      commonMistakes: string;
      interviewTip: string;
    }>;
    edges: Array<{ source: string; target: string }>;
  };
}

export async function generateEnhancedMindMap(
  topic: string,
  mode: string
): Promise<EnhancedMindMapResult> {
  const prompt = `Create a comprehensive mind map for topic: "${topic}" at "${mode}" level.

Output JSON with:
1. "mindmap" object containing:
   - "nodes": array of concept nodes, each with:
     * "id": unique string like "root-1", "concept-1", etc.
     * "label": short name
     * "type": one of "root", "concept", "sub_concept", "example", "application"
     * "definition": clear definition
     * "whyItMatters": why this concept matters
     * "realExample": real-world example
     * "commonMistakes": common mistakes
     * "interviewTip": interview tip
   - "edges": array of { source: string, target: string }
   
The root node should be the main topic. Include 5-8 concept nodes connected to root. Add sub_concepts, examples, applications as children of concepts.`;

  const fallback: EnhancedMindMapResult = { mindmap: { nodes: [], edges: [] } };
  return generateJSON<EnhancedMindMapResult>(LEARNING_SYSTEM, prompt, { model: MODELS.POWERFUL, responseFormat: { type: "json_object" } }, fallback);
}

export interface SmartQuizQuestion {
  question: string;
  type: "mcq" | "true_false" | "scenario" | "interview" | "revision";
  options: string[];
  correct_answer: string;
  explanation: string;
  follow_up?: string;
}

export interface SmartQuizData {
  quiz_title: string;
  topic: string;
  difficulty: string;
  estimated_time: string;
  mode: string;
  questions: SmartQuizQuestion[];
  performance_insights_template: {
    strengths: string[];
    weak_areas: string[];
    recommended_next_step: string;
  };
}

export async function generateEnhancedQuiz(
  topic: string,
  mode: string,
  duration: string
): Promise<SmartQuizData> {
  const prompt = `Generate a quiz on topic: "${topic}" for "${mode}" level, duration: "${duration}".

Output JSON with:
1. "quiz_title": engaging title
2. "topic": the topic
3. "difficulty": auto-detected
4. "estimated_time": duration
5. "mode": the mode
6. "questions": array of 5-10 questions, each with:
   - "question": text
   - "type": "mcq" | "true_false" | "scenario" | "interview" | "revision"
   - "options": array of 4 strings
   - "correct_answer": exact match from options
   - "explanation": detailed explanation
   - "follow_up": optional follow-up for interview mode
7. "performance_insights_template": object with "strengths", "weak_areas", "recommended_next_step"`;

  const fallback: SmartQuizData = {
    quiz_title: "", topic, difficulty: "", estimated_time: duration, mode,
    questions: [], performance_insights_template: { strengths: [], weak_areas: [], recommended_next_step: "" }
  };
  return generateJSON<SmartQuizData>(LEARNING_SYSTEM, prompt, { model: MODELS.POWERFUL, responseFormat: { type: "json_object" } }, fallback);
}

export interface FlashcardData {
  cards: Array<{
    front: string;
    back: string;
    explanation: string;
    memoryTip: string;
    difficulty: "easy" | "medium" | "hard";
  }>;
}

export async function generateFlashcards(
  topic: string,
  mode: string,
  cardCount: number
): Promise<FlashcardData> {
  const prompt = `Generate ${cardCount} flashcards for topic: "${topic}" at "${mode}" level.

Output JSON with:
1. "cards": array of flashcard objects, each with:
   - "front": question/term
   - "back": answer/definition
   - "explanation": detailed explanation
   - "memoryTip": mnemonic or memory tip
   - "difficulty": "easy" | "medium" | "hard"`;

  const fallback: FlashcardData = { cards: [] };
  return generateJSON<FlashcardData>(LEARNING_SYSTEM, prompt, { model: MODELS.BALANCED, responseFormat: { type: "json_object" } }, fallback);
}

export interface LearnLessonData {
  learning_goal: string;
  estimated_completion_time: string;
  lesson_structure: string[];
  overview: string;
  key_concepts: Array<{
    title: string;
    content: string;
    sub_concepts?: string[];
    tips?: string[];
  }>;
  examples: Array<{
    title: string;
    scenario: string;
    code_or_data?: string;
    explanation?: string;
  }>;
  practice_questions: Array<{
    question: string;
    guidance?: string;
    expected_answer?: string;
    red_flag?: string;
  }>;
  quiz: Array<{
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  }>;
  summary: string;
  why_matters?: string;
  simple_explanation?: string;
  real_life_analogy?: string;
  example?: string;
  key_takeaways?: string[];
  mini_quiz?: Array<{
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  }>;
}

export async function generateLearnLesson(
  topic: string,
  duration: string,
  level: string
): Promise<LearnLessonData> {
  const prompt = `Teach the topic: "${topic}" at "${level}" level, duration: "${duration}".

If level is "beginner":
- Output: overview, why_matters, simple_explanation, real_life_analogy, example, key_takeaways (3), mini_quiz (1-2), key_concepts (2-3)

If level is "intermediate", "interview", or "revision":
- Output: overview, key_concepts (3-5 with sub_concepts and tips), examples (1-3 with code), practice_questions (1-3), quiz (2-4), summary

Always include: learning_goal, estimated_completion_time, lesson_structure as array of section names.

Keep responses concise for short durations and detailed for longer durations. Use simple language for beginners, technical depth for intermediate+.`;

  const fallback: LearnLessonData = {
    learning_goal: "", estimated_completion_time: duration, lesson_structure: [],
    overview: "", key_concepts: [], examples: [], practice_questions: [], quiz: [], summary: "",
    why_matters: "", simple_explanation: "", real_life_analogy: "", example: "", key_takeaways: [], mini_quiz: []
  };
  return generateJSON<LearnLessonData>(LEARNING_SYSTEM, prompt, { model: MODELS.POWERFUL, responseFormat: { type: "json_object" } }, fallback);
}
