import { generateJSON, generateText, MODELS } from "./openrouter";
import type { Message } from "./engine-question.service";

export interface HRInterviewConfig {
  interviewType: string;
  targetRole: string;
  targetCompany: string;
  difficulty: string;
  experienceLevel: string;
  durationMinutes: number;
  language: string;
  resumeContext: string;
  customInstructions: string;
}

export interface HRQuestion {
  question: string;
  category: string;
  competency: string;
  difficulty: string;
  isFollowUp: boolean;
  expectedSTAR: boolean;
  followUpHint: string;
  tips: string[];
}

export interface STARAnalysis {
  hasSituation: boolean;
  hasTask: boolean;
  hasAction: boolean;
  hasResult: boolean;
  score: number;
  feedback: string;
  missingElements: string[];
}

export interface CommunicationAnalysis {
  clarity: number;
  confidence: number;
  fluency: number;
  conciseness: number;
  vocabulary: number;
  professionalism: number;
  answerStructure: number;
  fillerWordDetected: boolean;
  overallScore: number;
  feedback: string;
}

export interface HRCompetencyScore {
  competency: string;
  score: number;
  evidence: string;
  trend: "improving" | "declining" | "stable";
}

export interface HREvaluation {
  overallScore: number;
  communicationScore: number;
  leadershipScore: number;
  starScore: number;
  confidenceScore: number;
  teamworkScore: number;
  ownershipScore: number;
  adaptabilityScore: number;
  emotionalIntelligence: number;
  professionalism: number;
  culturalFit: number;
  motivation: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  summary: string;
  hiringRecommendation: "strong_recommend" | "recommend" | "maybe" | "do_not_recommend";
  competencyMatrix: HRCompetencyScore[];
  answerBreakdowns: HRAnswerBreakdown[];
  nextPracticeTopics: string[];
  recruiterPerspective: string;
  suggestedBetterAnswers: string[];
}

export interface HRAnswerBreakdown {
  question: string;
  answer: string;
  aiAnalysis: string;
  suggestedBetterAnswer: string;
  interviewerPerspective: string;
  starAnalysis: STARAnalysis;
  communicationAnalysis: CommunicationAnalysis;
  score: number;
  tags: string[];
  competency: string;
}

const BEHAVIORAL_CATEGORIES = [
  "tell_me_about_yourself",
  "strengths_weaknesses",
  "leadership",
  "conflict_resolution",
  "teamwork",
  "time_management",
  "communication",
  "failure_recovery",
  "achievements",
  "career_goals",
  "adaptability",
  "ethical_decisions",
  "pressure_handling",
  "learning_mindset",
];

const COMPANY_HR_FOCUS: Record<string, string> = {
  google: "Google values 'Googliness' — intellectual humility, bias toward action, comfort with ambiguity, and collaborative spirit. Ask about navigating ambiguity, championing ideas, and working across diverse teams.",
  microsoft: "Microsoft emphasizes growth mindset, learning from failure, and empowering others. Focus on questions about receiving feedback, adapting to change, and helping teammates succeed.",
  amazon: "Amazon evaluates against their Leadership Principles — Customer Obsession, Ownership, Bias for Action, Earn Trust. Frame behavioral questions around these principles explicitly.",
  meta: "Meta looks for 'Move Fast' mentality, impact at scale, and building for billions. Ask about rapid iteration, data-driven decisions, and working under ambiguity.",
  apple: "Apple values attention to detail, product intuition, and privacy-first thinking. Focus on questions about craft, user experience obsession, and cross-functional collaboration.",
  tcs: "TCS evaluates communication skills, aptitude, adaptability to enterprise environments, and willingness to learn. Ask about academic projects, teamwork, and process orientation.",
  infosys: "Infosys looks for foundational knowledge, communication clarity, process understanding, and growth mindset. Focus on learning agility and team collaboration.",
  accenture: "Accenture values consulting mindset, analytical thinking, client focus, and adaptability. Ask about stakeholder management and working in teams.",
  wipro: "Wipro evaluates technical fundamentals, problem-solving approach, communication skills, and client orientation.",
  capgemini: "Capgemini looks for business acumen, technical skills, delivery focus, and team collaboration.",
  deloitte: "Deloitte values analytics capability, strategic thinking, advisory mindset, and professional development.",
};

function getCompanyHRFocus(company: string): string {
  const key = company.toLowerCase().replace(/\s+/g, "");
  for (const [k, v] of Object.entries(COMPANY_HR_FOCUS)) {
    if (key.includes(k)) return v;
  }
  return "";
}

function getExperienceLevelGuidance(level: string): string {
  switch (level) {
    case "fresher":
      return "Focus on academic projects, learning potential, campus activities, internships, and raw enthusiasm. Accept less polished answers but look for self-awareness and drive.";
    case "entry":
      return "Focus on early career experiences, how they handled their first professional challenges, eagerness to learn, and initial leadership moments.";
    case "mid":
      return "Focus on demonstrated expertise, project leadership, mentoring, cross-team collaboration, and career progression narrative.";
    case "senior":
      return "Focus on strategic thinking, team scaling, technical decision-making, mentoring others, and organizational impact.";
    case "lead":
      return "Focus on executive presence, organizational leadership, vision setting, stakeholder management, and driving engineering culture.";
    default:
      return "Calibrate expectations based on the candidate's stated experience level.";
  }
}

function getInterviewPhaseGuidance(questionNumber: number, totalQuestions: number): string {
  const pct = questionNumber / totalQuestions;
  if (pct <= 0.15) return "INTRODUCTION PHASE: Start with warm-up questions. Build rapport. Ask about background, motivation, and career aspirations. Keep tone friendly and encouraging.";
  if (pct <= 0.4) return "EARLY STAGE: Begin behavioral assessment. Use STAR-oriented questions. Explore past experiences, teamwork, and problem-solving. Start probing deeper.";
  if (pct <= 0.7) return "MID INTERVIEW: Deep behavioral assessment. Ask about challenging situations, conflicts, failures, and leadership moments. Push for specific examples and measurable outcomes.";
  if (pct <= 0.9) return "LATE STAGE: Assess strategic thinking, career goals alignment, culture fit, and long-term motivation. Ask about what they're looking for in their next role.";
  return "CLOSING: Ask about questions they have, any final thoughts, and wrap up professionally. This is their chance to leave a final impression.";
}

const HR_FALLBACK_QUESTION: HRQuestion = {
  question: "Tell me about yourself and what motivated you to apply for this role.",
  category: "tell_me_about_yourself",
  competency: "communication",
  difficulty: "easy",
  isFollowUp: false,
  expectedSTAR: false,
  followUpHint: "Ask about specific career milestones that led to this application",
  tips: ["Listen for a clear narrative arc", "Note self-awareness and enthusiasm"],
};

export async function generateHRQuestion(
  config: HRInterviewConfig,
  history: Message[],
  isFollowUp: boolean = false
): Promise<HRQuestion> {
  const questionNumber = history.filter((m) => m.role === "interviewer").length + 1;
  const totalQuestions = Math.ceil((config.durationMinutes || 30) / 4);
  const companyFocus = getCompanyHRFocus(config.targetCompany);
  const experienceGuidance = getExperienceLevelGuidance(config.experienceLevel);
  const phaseGuidance = getInterviewPhaseGuidance(questionNumber, totalQuestions);

  const conversationHistory = history
    .filter((m) => m.role === "interviewer" || m.role === "candidate")
    .map((m) => `[${m.role === "interviewer" ? "Interviewer" : "Candidate"}]: ${m.content}`)
    .join("\n\n");

  const resumeSection = config.resumeContext && config.resumeContext !== "null"
    ? `\nCANDIDATE RESUME CONTEXT:\n${config.resumeContext}\n`
    : "";

  const systemPrompt = `You are an experienced HR interviewer conducting a professional behavioral interview. You behave like a seasoned campus or corporate recruiter — warm but probing, professional but human.

INTERVIEW CONTEXT:
- Type: ${config.interviewType}
- Target Role: ${config.targetRole}
- Target Company: ${config.targetCompany || "Not specified"}
- Experience Level: ${config.experienceLevel}
- Language: ${config.language}
- Difficulty: ${config.difficulty}

PHASE: ${phaseGuidance}

EXPERIENCE LEVEL GUIDANCE:
${experienceGuidance}

${companyFocus ? `COMPANY-SPECIFIC FOCUS:\n${companyFocus}\n` : ""}
${resumeSection}
BEHAVIORAL TOPICS TO COVER (choose based on phase and conversation flow):
${BEHAVIORAL_CATEGORIES.map((c) => `- ${c.replace(/_/g, " ")}`).join("\n")}

QUESTION GENERATION RULES:
1. Generate exactly ONE natural, conversational question appropriate for question ${questionNumber} of ${totalQuestions}
2. ${isFollowUp ? "This is a FOLLOW-UP question. Probe deeper into their previous answer. Ask for specific examples, outcomes, or what they would do differently." : ""}
3. Questions should feel like a real conversation, not a scripted questionnaire
4. Vary between behavioral, situational, and reflective questions
5. Reference their resume when relevant
6. ${config.targetCompany ? `Include ${config.targetCompany}-specific behavioral expectations` : ""}
7. If there is previous conversation, evaluate what they shared and ask a natural follow-up or transition to a new topic
8. The question should be specific and require a thoughtful response — avoid yes/no questions
9. For experienced candidates, ask about leadership moments, mentoring, and strategic decisions
10. For fresh graduates, ask about campus projects, learning experiences, and career aspirations
11. IMPORTANT: Begin the "question" string with 1-2 brief conversational sentences reacting to their last answer (acknowledge what was strong, note what could be deeper), then naturally transition to the next question

Return the question as JSON with this exact structure:
{
  "question": "Brief reaction to previous answer (if applicable) + The next HR interview question",
  "category": "one of: tell_me_about_yourself, strengths_weaknesses, leadership, conflict_resolution, teamwork, time_management, communication, failure_recovery, achievements, career_goals, adaptability, ethical_decisions, pressure_handling, learning_mindset",
  "competency": "one of: communication, leadership, teamwork, ownership, problem_solving, adaptability, emotional_intelligence, professionalism, cultural_fit, motivation",
  "difficulty": "easy|medium|hard",
  "isFollowUp": ${isFollowUp},
  "expectedSTAR": true or false depending on whether STAR format is appropriate,
  "followUpHint": "What to probe if the answer is surface-level",
  "tips": ["tip for evaluating this response"]
}`;

  const userPrompt = `Question ${questionNumber} of ${totalQuestions} | Role: ${config.targetRole} | Company: ${config.targetCompany || "Any"} | Type: ${config.interviewType}

${conversationHistory ? `Previous conversation:\n${conversationHistory}` : "This is the first question of the interview."}

${conversationHistory ? "First acknowledge their last response, then ask the next question." : "Generate the opening question."}`;

  try {
    const result = await generateJSON<HRQuestion>(
      systemPrompt,
      userPrompt,
      { model: MODELS.BALANCED, temperature: 0.8, maxTokens: 2048 },
      HR_FALLBACK_QUESTION
    );
    console.log(`[HR Interview] Generated question ${questionNumber} — category: ${result.category}, competency: ${result.competency}`);
    return result;
  } catch (error) {
    console.error(`[HR Interview] Question generation failed, using fallback:`, error);
    return HR_FALLBACK_QUESTION;
  }
}

export async function analyzeSTAR(
  question: string,
  answer: string,
  config: HRInterviewConfig
): Promise<STARAnalysis> {
  const systemPrompt = `You are an expert HR evaluator analyzing a candidate's answer using the STAR method (Situation, Task, Action, Result).

SCORING:
- 90-100: All four STAR elements clearly present with specific, compelling details
- 70-89: Most STAR elements present, some could be more specific
- 50-69: Some STAR elements present but gaps in structure
- 30-49: Vague answer with minimal STAR structure
- 0-29: No recognizable STAR structure

Return as JSON:
{
  "hasSituation": boolean,
  "hasTask": boolean,
  "hasAction": boolean,
  "hasResult": boolean,
  "score": number (0-100),
  "feedback": "2-3 sentences of constructive feedback on STAR usage",
  "missingElements": ["list of missing STAR elements"]
}`;

  const fallback: STARAnalysis = {
    hasSituation: answer.length > 100,
    hasTask: answer.length > 150,
    hasAction: answer.length > 200,
    hasResult: answer.toLowerCase().includes("result") || answer.toLowerCase().includes("outcome"),
    score: answer.length > 300 ? 65 : answer.length > 100 ? 45 : 25,
    feedback: answer.length > 200
      ? "The answer has some structure but could benefit from clearer STAR organization with specific outcomes."
      : "The answer is quite brief. A stronger response would include specific situations, actions taken, and measurable results.",
    missingElements: answer.length < 200 ? ["situation", "task", "action", "result"] : [],
  };

  try {
    const result = await generateJSON<STARAnalysis>(
      systemPrompt,
      `QUESTION: ${question}\n\nCANDIDATE ANSWER: ${answer}\n\nAnalyze this answer for STAR method elements. Be specific about what is present and what is missing.`,
      { model: MODELS.FAST, temperature: 0.3, maxTokens: 1024 },
      fallback
    );
    result.score = Math.max(0, Math.min(100, Math.round(result.score)));
    return result;
  } catch {
    return fallback;
  }
}

export async function analyzeCommunication(
  question: string,
  answer: string,
  config: HRInterviewConfig
): Promise<CommunicationAnalysis> {
  const systemPrompt = `You are an expert communication analyst evaluating a candidate's interview response.

EVALUATE THESE DIMENSIONS (each 0-100):
- clarity: How clear and easy to understand is the response
- confidence: How confident and assured does the candidate sound
- fluency: How smoothly the ideas flow without awkward pauses or restarts
- conciseness: How well they communicate without unnecessary rambling
- vocabulary: Professional vocabulary appropriate for the role
- professionalism: Professional tone and demeanor
- answerStructure: Logical organization of the response
- fillerWordDetected: Whether excessive filler words (um, uh, like, you know) are apparent

Return as JSON:
{
  "clarity": number,
  "confidence": number,
  "fluency": number,
  "conciseness": number,
  "vocabulary": number,
  "professionalism": number,
  "answerStructure": number,
  "fillerWordDetected": boolean,
  "overallScore": number (weighted average),
  "feedback": "2-3 sentences of constructive feedback on communication"
}`;

  const baseScore = Math.min(100, Math.max(20, Math.round(answer.length / 8)));
  const fallback: CommunicationAnalysis = {
    clarity: baseScore,
    confidence: baseScore - 5,
    fluency: baseScore,
    conciseness: answer.length > 500 ? baseScore - 15 : baseScore + 5,
    vocabulary: baseScore,
    professionalism: baseScore + 5,
    answerStructure: answer.length > 100 ? baseScore : baseScore - 10,
    fillerWordDetected: false,
    overallScore: baseScore,
    feedback: answer.length > 200
      ? "Good response length. Focus on maintaining clarity and structured delivery."
      : "Consider providing more detailed responses with clearer structure.",
  };

  try {
    const result = await generateJSON<CommunicationAnalysis>(
      systemPrompt,
      `QUESTION: ${question}\n\nCANDIDATE ANSWER: ${answer}\n\nEvaluate the communication quality of this response.`,
      { model: MODELS.FAST, temperature: 0.3, maxTokens: 1024 },
      fallback
    );
    for (const key of ["clarity", "confidence", "fluency", "conciseness", "vocabulary", "professionalism", "answerStructure", "overallScore"] as const) {
      result[key] = Math.max(0, Math.min(100, Math.round(result[key])));
    }
    return result;
  } catch {
    return fallback;
  }
}

export async function generateHRFollowUp(
  question: string,
  answer: string,
  config: HRInterviewConfig,
  starAnalysis: STARAnalysis
): Promise<string> {
  const systemPrompt = `You are an experienced HR interviewer. The candidate just answered a question but their response needs deeper exploration.

STAR ANALYSIS:
- Situation: ${starAnalysis.hasSituation ? "Present" : "Missing"}
- Task: ${starAnalysis.hasTask ? "Present" : "Missing"}
- Action: ${starAnalysis.hasAction ? "Present" : "Missing"}
- Result: ${starAnalysis.hasResult ? "Present" : "Missing"}
- STAR Score: ${starAnalysis.score}/100
- Missing: ${starAnalysis.missingElements.join(", ") || "None"}

Generate a natural, conversational follow-up question that probes deeper into their response. The follow-up should:
1. Ask for specific examples or outcomes they didn't mention
2. Fill gaps in their STAR structure
3. Challenge them to think more deeply
4. Feel natural, not interrogative

Return ONLY the follow-up question text, no JSON needed.`;

  const fallback = starAnalysis.hasResult
    ? "Can you share a specific metric or outcome that resulted from your actions?"
    : starAnalysis.hasAction
      ? "What was the measurable result of your actions?"
      : "Can you walk me through a specific example of this?";

  try {
    const result = await generateText(
      systemPrompt,
      `Original question: ${question}\nCandidate answer: ${answer}\n\nGenerate a natural follow-up question.`,
      { model: MODELS.FAST, temperature: 0.7, maxTokens: 256 }
    );
    return result.trim();
  } catch {
    return fallback;
  }
}

export async function generateHREvaluation(
  config: HRInterviewConfig,
  history: Message[]
): Promise<HREvaluation> {
  const conversationHistory = history
    .filter((m) => m.role === "interviewer" || m.role === "candidate")
    .map((m) => `[${m.role === "interviewer" ? "Interviewer" : "Candidate"}]: ${m.content}`)
    .join("\n\n");

  const candidateMessages = history.filter((m) => m.role === "candidate");
  const interviewerMessages = history.filter((m) => m.role === "interviewer");
  const totalQuestions = interviewerMessages.length;

  const resumeSection = config.resumeContext && config.resumeContext !== "null"
    ? `\nCANDIDATE RESUME:\n${config.resumeContext}\n`
    : "";

  const systemPrompt = `You are a senior HR leader providing a comprehensive assessment of a candidate's HR interview performance.

EVALUATION CONTEXT:
- Interview Type: ${config.interviewType}
- Target Role: ${config.targetRole}
- Target Company: ${config.targetCompany || "Not specified"}
- Experience Level: ${config.experienceLevel}
- Difficulty: ${config.difficulty}
${resumeSection}
COMPETENCY MATRIX (score each 0-100):
1. Communication — clarity, articulation, active listening signals
2. Leadership — initiative, influence, decision-making stories
3. Teamwork — collaboration examples, conflict resolution, supporting others
4. Ownership — accountability, proactiveness, taking initiative
5. Problem Solving — analytical thinking, creative solutions, structured approach
6. Adaptability — flexibility, learning agility, handling change
7. Emotional Intelligence — self-awareness, empathy, reading situations
8. Professionalism — composure, appropriate tone, career maturity
9. Cultural Fit — alignment with company values, work style preferences
10. Motivation — genuine interest, career goal clarity, long-term thinking

SCORING SCALE:
90-100: Exceptional — would stand out among candidates
80-89: Strong — clearly hire-ready
70-79: Adequate — meets expectations with some polish needed
60-69: Below average — notable gaps to address
40-59: Weak — significant deficiencies
0-39: Poor — does not meet minimum expectations

STAR ANALYSIS:
For each answer, assess STAR structure adherence. Provide overall STAR score as weighted average.

COMMUNICATION ANALYSIS:
Assess overall communication quality: clarity, confidence, fluency, conciseness, professionalism.

RULES:
1. Score honestly — never inflate to be polite
2. Reference SPECIFIC answers from the transcript
3. Provide the answerBreakdowns array with one entry for EVERY question-answer pair (${totalQuestions} pairs expected)
4. Each breakdown MUST include STAR analysis and communication analysis
5. Be candid in the recruiterPerspective field
6. suggestedBetterAnswer must be genuinely helpful and specific

Return as JSON:
{
  "overallScore": number (0-100),
  "communicationScore": number (0-100),
  "leadershipScore": number (0-100),
  "starScore": number (0-100),
  "confidenceScore": number (0-100),
  "teamworkScore": number (0-100),
  "ownershipScore": number (0-100),
  "adaptabilityScore": number (0-100),
  "emotionalIntelligence": number (0-100),
  "professionalism": number (0-100),
  "culturalFit": number (0-100),
  "motivation": number (0-100),
  "strengths": ["specific strength with evidence", ...],
  "weaknesses": ["specific weakness with evidence", ...],
  "improvements": ["actionable improvement suggestion", ...],
  "summary": "2-3 sentence executive summary",
  "hiringRecommendation": "strong_recommend" | "recommend" | "maybe" | "do_not_recommend",
  "competencyMatrix": [
    { "competency": "Communication", "score": number, "evidence": "specific reference to transcript", "trend": "improving|declining|stable" },
    ... (all 10 competencies)
  ],
  "answerBreakdowns": [
    {
      "question": "exact question asked",
      "answer": "candidate's answer",
      "aiAnalysis": "detailed analysis",
      "suggestedBetterAnswer": "improved version using STAR",
      "interviewerPerspective": "what a real recruiter would think",
      "starAnalysis": { "hasSituation": bool, "hasTask": bool, "hasAction": bool, "hasResult": bool, "score": number, "feedback": "string", "missingElements": ["list"] },
      "communicationAnalysis": { "clarity": number, "confidence": number, "fluency": number, "conciseness": number, "vocabulary": number, "professionalism": number, "answerStructure": number, "fillerWordDetected": bool, "overallScore": number, "feedback": "string" },
      "score": number (0-100),
      "tags": ["specific-tag"],
      "competency": "primary competency assessed"
    }
  ],
  "nextPracticeTopics": ["topic1", "topic2", "topic3"],
  "recruiterPerspective": "Overall what a senior recruiter would say after this interview"
}`;

  const buildDefaultBreakdown = (q: Message, a: Message, idx: number): HRAnswerBreakdown => ({
    question: q.content,
    answer: a.content,
    aiAnalysis: `Answer ${idx + 1} analysis based on ${a.content.length} character response.`,
    suggestedBetterAnswer: `A stronger STAR-based answer would clearly describe the Situation, outline the Task, detail the specific Actions taken, and quantify the Results achieved.`,
    interviewerPerspective: a.content.length > 200
      ? "The candidate provided a substantive response. Would want to verify specific claims."
      : "The answer lacked depth. Would expect more detail before advancing.",
    starAnalysis: {
      hasSituation: a.content.length > 100,
      hasTask: a.content.length > 150,
      hasAction: a.content.length > 200,
      hasResult: a.content.toLowerCase().includes("result") || a.content.toLowerCase().includes("outcome"),
      score: Math.min(100, Math.round(a.content.length / 5)),
      feedback: "Assessment based on response structure and length.",
      missingElements: a.content.length < 200 ? ["situation", "task", "action", "result"] : [],
    },
    communicationAnalysis: {
      clarity: Math.min(100, Math.round(a.content.length / 6)),
      confidence: Math.min(100, Math.round(a.content.length / 7)),
      fluency: Math.min(100, Math.round(a.content.length / 6)),
      conciseness: a.content.length > 500 ? 60 : 75,
      vocabulary: Math.min(100, Math.round(a.content.length / 6)),
      professionalism: Math.min(100, Math.round(a.content.length / 5)),
      answerStructure: a.content.length > 100 ? 65 : 40,
      fillerWordDetected: false,
      overallScore: Math.min(100, Math.round(a.content.length / 6)),
      feedback: "Communication assessment based on response characteristics.",
    },
    score: Math.min(100, Math.max(20, Math.round(a.content.length / 6))),
    tags: a.content.length > 200 ? ["adequate-length"] : ["vague"],
    competency: "communication",
  });

  const avgAnswerLength = candidateMessages.length > 0
    ? candidateMessages.reduce((s, m) => s + m.content.length, 0) / candidateMessages.length
    : 0;

  const fallbackBreakdowns: HRAnswerBreakdown[] = interviewerMessages.map((q, i) =>
    buildDefaultBreakdown(q, candidateMessages[i] || { role: "candidate", content: "No answer" }, i)
  );

  const baseScore = Math.min(100, Math.max(20, Math.round(avgAnswerLength / 5)));

  const fallback: HREvaluation = {
    overallScore: baseScore,
    communicationScore: Math.min(100, baseScore + 5),
    leadershipScore: Math.round(baseScore * 0.7),
    starScore: Math.round(baseScore * 0.8),
    confidenceScore: Math.min(100, Math.max(20, baseScore - 3)),
    teamworkScore: Math.round(baseScore * 0.75),
    ownershipScore: Math.round(baseScore * 0.7),
    adaptabilityScore: Math.round(baseScore * 0.72),
    emotionalIntelligence: Math.round(baseScore * 0.68),
    professionalism: Math.min(100, baseScore + 8),
    culturalFit: Math.min(100, baseScore + 5),
    motivation: Math.min(100, baseScore + 10),
    strengths: [
      `Completed ${totalQuestions} questions`,
      baseScore >= 60 ? "Demonstrated adequate response depth" : "Showed willingness to engage",
    ],
    weaknesses: [
      baseScore < 60 ? "Answers lacked sufficient depth and STAR structure" : "Could improve answer structure with clearer outcomes",
      "Some answers could benefit from more specific examples and metrics",
    ],
    improvements: [
      "Practice structuring answers using the STAR method consistently",
      "Include quantified results and measurable outcomes in responses",
      "Prepare 3-5 strong behavioral stories that cover leadership, teamwork, and conflict",
    ],
    summary: `Candidate completed a ${config.interviewType} interview for a ${config.targetRole} role${config.targetCompany ? ` at ${config.targetCompany}` : ""} with an overall score of ${baseScore}/100.`,
    hiringRecommendation:
      baseScore >= 80 ? "strong_recommend" :
      baseScore >= 60 ? "recommend" :
      baseScore >= 40 ? "maybe" : "do_not_recommend",
    competencyMatrix: [
      { competency: "Communication", score: Math.min(100, baseScore + 5), evidence: "Based on response analysis", trend: "stable" },
      { competency: "Leadership", score: Math.round(baseScore * 0.7), evidence: "Limited leadership examples in responses", trend: "stable" },
      { competency: "Teamwork", score: Math.round(baseScore * 0.75), evidence: "Some collaboration examples shared", trend: "stable" },
      { competency: "Ownership", score: Math.round(baseScore * 0.7), evidence: "Accountability indicators present", trend: "stable" },
      { competency: "Problem Solving", score: Math.round(baseScore * 0.72), evidence: "Analytical approach demonstrated", trend: "stable" },
      { competency: "Adaptability", score: Math.round(baseScore * 0.72), evidence: "Flexibility indicators present", trend: "stable" },
      { competency: "Emotional Intelligence", score: Math.round(baseScore * 0.68), evidence: "Self-awareness signals noted", trend: "stable" },
      { competency: "Professionalism", score: Math.min(100, baseScore + 8), evidence: "Professional demeanor maintained", trend: "stable" },
      { competency: "Cultural Fit", score: Math.min(100, baseScore + 5), evidence: "Values alignment indicators", trend: "stable" },
      { competency: "Motivation", score: Math.min(100, baseScore + 10), evidence: "Career interest demonstrated", trend: "stable" },
    ],
    answerBreakdowns: fallbackBreakdowns,
    nextPracticeTopics: [
      "STAR method behavioral questions",
      "Leadership scenario responses",
      "Conflict resolution stories",
    ],
    recruiterPerspective: `Based on this ${totalQuestions}-question interview, the candidate ${baseScore >= 70 ? "shows solid potential" : "needs improvement"} for the ${config.targetRole} role.`,
    suggestedBetterAnswers: fallbackBreakdowns.map((b) => b.suggestedBetterAnswer),
  };

  try {
    const result = await generateJSON<HREvaluation>(
      systemPrompt,
      `Evaluate this ${config.interviewType} interview for a ${config.targetRole} position${config.targetCompany ? ` at ${config.targetCompany}` : ""}.

INTERVIEW TRANSCRIPT:
${conversationHistory}

CANDIDATE ANSWERED ${totalQuestions} QUESTIONS.

Provide a comprehensive HR evaluation with STAR analysis, communication analysis, and competency scoring for ALL ${totalQuestions} question-answer pairs.`,
      { model: MODELS.BALANCED, temperature: 0.4, maxTokens: 16000 },
      fallback
    );

    if (!result.answerBreakdowns || result.answerBreakdowns.length < totalQuestions) {
      const existing = result.answerBreakdowns || [];
      while (existing.length < totalQuestions) {
        const idx = existing.length;
        existing.push(buildDefaultBreakdown(
          interviewerMessages[idx] || { role: "interviewer", content: `Question ${idx + 1}` },
          candidateMessages[idx] || { role: "candidate", content: "No answer" },
          idx
        ));
      }
      result.answerBreakdowns = existing;
    }

    for (const key of ["overallScore", "communicationScore", "leadershipScore", "starScore", "confidenceScore", "teamworkScore", "ownershipScore", "adaptabilityScore", "emotionalIntelligence", "professionalism", "culturalFit", "motivation"] as const) {
      (result as any)[key] = Math.max(0, Math.min(100, Math.round((result as any)[key] || 0)));
    }

    for (const bd of result.answerBreakdowns) {
      bd.score = Math.max(0, Math.min(100, Math.round(bd.score)));
      if (bd.starAnalysis) bd.starAnalysis.score = Math.max(0, Math.min(100, Math.round(bd.starAnalysis.score)));
      if (bd.communicationAnalysis) {
        for (const k of ["clarity", "confidence", "fluency", "conciseness", "vocabulary", "professionalism", "answerStructure", "overallScore"] as const) {
          (bd.communicationAnalysis as any)[k] = Math.max(0, Math.min(100, Math.round((bd.communicationAnalysis as any)[k] || 0)));
        }
      }
      if (!Array.isArray(bd.tags)) bd.tags = ["unclassified"];
    }

    if (result.competencyMatrix) {
      for (const c of result.competencyMatrix) {
        c.score = Math.max(0, Math.min(100, Math.round(c.score)));
      }
    }

    console.log(`[HR Interview] Evaluation complete — Score: ${result.overallScore}/100 | ${result.answerBreakdowns.length} breakdowns`);
    return result;
  } catch (error) {
    console.error(`[HR Interview] Evaluation generation failed, using fallback:`, error);
    return fallback;
  }
}
