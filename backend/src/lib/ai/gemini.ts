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
  } catch {
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
  } catch {
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
  } catch {
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

/**
 * 8. Cover Letter Generator
 */
export async function generateCoverLetterText(
  companyName: string,
  role: string,
  jobDescription: string,
  tone: string
): Promise<string> {
  const prompt = `Write a highly tailored Cover Letter.
Company: ${companyName}
Role: ${role}
Job Description: ${jobDescription}
Tone: ${tone}

Write with: engaging introduction, strong body highlighting achievements matching the role, polite closing. Use clean letter layout. Return ONLY the cover letter text.`;
  try {
    return await generateText(RESUME_SYSTEM, prompt, { model: MODELS.BALANCED });
  } catch {
    return `Dear Hiring Manager,\n\nI am writing to express my enthusiastic interest in the ${role} position at ${companyName}. With a strong background in software engineering and hands-on project experience, I am confident in my ability to deliver substantial value to your team.\n\nThank you for your time and consideration.\n\nSincerely,\n[Your Name]`;
  }
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
  } catch {
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
  const prompt = `Generate comprehensive study notes on "${topic}".
Difficulty: ${difficulty}
Style: ${type}

Use clear headings, bullet points, markdown. Highlight key definitions. Structure from basics to advanced. Return ONLY valid markdown.`;
  try {
    return await generateText(LEARNING_SYSTEM, prompt, { model: MODELS.POWERFUL });
  } catch {
    return "# Notes Generation Failed\nPlease try again.";
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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
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
