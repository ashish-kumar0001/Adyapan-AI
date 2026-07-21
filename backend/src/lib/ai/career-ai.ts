import { generateJSON, MODELS } from "./openrouter";

const CAREER_SYSTEM = `You are a senior career strategist, technical recruiter, hiring manager, and learning coach with 15+ years of experience at FAANG companies.

Generate personalized career roadmaps using the user's actual resume, coding analytics, learning analytics, ATS reports, and target role.

RULES:
- Never invent achievements or experience that don't exist in the user's data.
- Provide realistic, prioritized, and actionable recommendations with clear reasoning.
- Base all scores on actual data provided — never inflate or deflate arbitrarily.
- Always explain WHY each recommendation matters for the specific target role.
- Consider the user's current skill level, weak areas, and available time.
- Make weekly tasks small and actionable (1-3 hours each).
- Certifications should only be recommended if they provide clear career value.
- Project recommendations should match the user's skill level and fill resume gaps.`;

export interface CareerRoadmapData {
  readinessScores: {
    overall: number;
    technical: number;
    resume: number;
    interview: number;
    placement: number;
    recruiter: number;
  };
  roadmap: {
    phases: {
      title: string;
      description: string;
      duration: string;
      objectives: string[];
      expectedOutcomes: string[];
      completionPercentage: number;
      dependencies: string[];
    }[];
    totalDuration: string;
  };
  weeklyPlan: {
    tasks: {
      title: string;
      description: string;
      category: string;
      priority: string;
      estimatedHours: number;
      impactScore: number;
      status: string;
    }[];
    dailyMicroTasks: string[];
    totalEstimatedHours: number;
  };
  gapAnalysis: {
    missingSkills: { skill: string; importance: string; priority: number; reason: string }[];
    missingProjects: { project: string; impact: string; effort: string }[];
    missingCertifications: { cert: string; why: string; difficulty: string; roi: string; studyTime: string }[];
    missingExperience: { area: string; suggestion: string }[];
    missingSoftSkills: { skill: string; importance: string }[];
  };
  skillMap: {
    skills: {
      name: string;
      currentLevel: number;
      targetLevel: number;
      status: string;
      dependencies: string[];
      category: string;
    }[];
  };
  projectRecommendations: {
    title: string;
    description: string;
    skillsGained: string[];
    resumeImpact: string;
    interviewValue: string;
    estimatedTime: string;
    difficulty: string;
    whyItMatters: string;
  }[];
  certRecommendations: {
    name: string;
    issuer: string;
    why: string;
    difficulty: string;
    roi: string;
    studyTime: string;
  }[];
  marketInsights: {
    currentDemand: string;
    averageSalary: string;
    topSkillCombinations: string[];
    resumeExpectations: string[];
    portfolioExpectations: string[];
    interviewTrends: string[];
    topHiringCompanies: string[];
    growthOutlook: string;
  };
  coachFeedback: {
    weeklyFeedback: string;
    progressSummary: string;
    motivationalGuidance: string;
    focusAreas: string[];
    risks: string[];
    nextBestAction: string;
  };
  milestones: {
    title: string;
    description: string;
    targetDate: string;
    category: string;
    status: string;
  }[];
}

const FALLBACK_DATA: CareerRoadmapData = {
  readinessScores: { overall: 35, technical: 30, resume: 40, interview: 25, placement: 30, recruiter: 35 },
  roadmap: {
    phases: [
      { title: "Foundation Building", description: "Strengthen core technical fundamentals", duration: "2 Weeks", objectives: ["Master data structures basics", "Build first project"], expectedOutcomes: ["Improved problem-solving", "Portfolio project"], completionPercentage: 0, dependencies: [] },
      { title: "Skill Development", description: "Develop role-specific technical skills", duration: "3 Weeks", objectives: ["Learn frameworks", "Practice system design"], expectedOutcomes: ["Framework proficiency", "Design thinking"], completionPercentage: 0, dependencies: ["Foundation Building"] },
      { title: "Project Building", description: "Build 2-3 impressive projects", duration: "4 Weeks", objectives: ["Full-stack project", "Open source contribution"], expectedOutcomes: ["Strong portfolio", "GitHub activity"], completionPercentage: 0, dependencies: ["Skill Development"] },
      { title: "Resume Optimization", description: "Polish resume and online presence", duration: "1 Week", objectives: ["ATS-optimized resume", "LinkedIn optimization"], expectedOutcomes: ["High ATS score", "Professional online presence"], completionPercentage: 0, dependencies: ["Project Building"] },
      { title: "Interview Preparation", description: "Master technical and behavioral interviews", duration: "3 Weeks", objectives: ["DSA practice", "Mock interviews"], expectedOutcomes: ["Interview confidence", "Strong problem-solving"], completionPercentage: 0, dependencies: ["Resume Optimization"] },
    ],
    totalDuration: "90 Days"
  },
  weeklyPlan: {
    tasks: [
      { title: "Solve 3 DSA problems", description: "Practice medium-level problems", category: "coding", priority: "High", estimatedHours: 3, impactScore: 75, status: "not_started" },
      { title: "Study one system design concept", description: "Learn about load balancers", category: "learning", priority: "Medium", estimatedHours: 2, impactScore: 60, status: "not_started" },
      { title: "Update resume project section", description: "Add latest project details", category: "resume", priority: "High", estimatedHours: 1, impactScore: 70, status: "not_started" },
    ],
    dailyMicroTasks: ["Solve 1 array problem", "Read 1 system design article", "Review 1 weak topic for 15 minutes"],
    totalEstimatedHours: 6
  },
  gapAnalysis: {
    missingSkills: [{ skill: "System Design", importance: "High", priority: 1, reason: "Essential for senior roles" }],
    missingProjects: [{ project: "Full-Stack Application", impact: "High", effort: "Medium" }],
    missingCertifications: [],
    missingExperience: [{ area: "Open Source", suggestion: "Contribute to one open source project" }],
    missingSoftSkills: [{ skill: "Communication", importance: "Medium" }]
  },
  skillMap: { skills: [{ name: "Programming", currentLevel: 50, targetLevel: 85, status: "in_progress", dependencies: [], category: "Technical" }] },
  projectRecommendations: [{ title: "Portfolio Website", description: "Build a personal portfolio", skillsGained: ["React", "CSS", "Design"], resumeImpact: "Shows frontend skills", interviewValue: "Demonstrates initiative", estimatedTime: "2 weeks", difficulty: "Beginner", whyItMatters: "First impression for recruiters" }],
  certRecommendations: [],
  marketInsights: { currentDemand: "Growing", averageSalary: " competitive", topSkillCombinations: ["Python + Cloud"], resumeExpectations: ["Projects section", "Skills list"], portfolioExpectations: ["GitHub portfolio"], interviewTrends: ["DSA + System Design"], topHiringCompanies: ["Tech companies"], growthOutlook: "Positive" },
  coachFeedback: { weeklyFeedback: "Start building momentum", progressSummary: "Getting started", motivationalGuidance: "Every expert was once a beginner", focusAreas: ["DSA basics", "Resume"], risks: ["Inconsistency"], nextBestAction: "Solve your first DSA problem" },
  milestones: [{ title: "Complete first project", description: "Build and deploy a project", targetDate: "Week 2", category: "project", status: "pending" }]
};

export async function generateCareerRoadmap(profileData: any): Promise<CareerRoadmapData> {
  const prompt = `Generate a comprehensive career roadmap based on the following user data:

USER PROFILE:
${JSON.stringify(profileData.profile || {}, null, 2)}

TARGET ROLE: ${profileData.targetRole || "Software Engineer"}
TIMELINE: ${profileData.timeline || "90 Days"}

CODING ANALYTICS:
${JSON.stringify(profileData.codingAnalytics || {}, null, 2)}

LEARNING ANALYTICS:
${JSON.stringify(profileData.learningAnalytics || {}, null, 2)}

ATS REPORTS:
${JSON.stringify(profileData.atsReports || [], null, 2)}

RESUME DATA:
${JSON.stringify(profileData.resumeData || {}, null, 2)}

LINKEDIN DATA:
${JSON.stringify(profileData.linkedinData || {}, null, 2)}

Generate a personalized, data-driven career roadmap. Be specific about skills to learn, projects to build, and timeline based on the user's current level.

Return the data as a JSON object with this exact structure:
{
  "readinessScores": { "overall": number, "technical": number, "resume": number, "interview": number, "placement": number, "recruiter": number },
  "roadmap": { "phases": [{ "title": string, "description": string, "duration": string, "objectives": [string], "expectedOutcomes": [string], "completionPercentage": number, "dependencies": [string] }], "totalDuration": string },
  "weeklyPlan": { "tasks": [{ "title": string, "description": string, "category": string, "priority": string, "estimatedHours": number, "impactScore": number, "status": "not_started" }], "dailyMicroTasks": [string], "totalEstimatedHours": number },
  "gapAnalysis": { "missingSkills": [{ "skill": string, "importance": string, "priority": number, "reason": string }], "missingProjects": [{ "project": string, "impact": string, "effort": string }], "missingCertifications": [{ "cert": string, "why": string, "difficulty": string, "roi": string, "studyTime": string }], "missingExperience": [{ "area": string, "suggestion": string }], "missingSoftSkills": [{ "skill": string, "importance": string }] },
  "skillMap": { "skills": [{ "name": string, "currentLevel": number, "targetLevel": number, "status": string, "dependencies": [string], "category": string }] },
  "projectRecommendations": [{ "title": string, "description": string, "skillsGained": [string], "resumeImpact": string, "interviewValue": string, "estimatedTime": string, "difficulty": string, "whyItMatters": string }],
  "certRecommendations": [{ "name": string, "issuer": string, "why": string, "difficulty": string, "roi": string, "studyTime": string }],
  "marketInsights": { "currentDemand": string, "averageSalary": string, "topSkillCombinations": [string], "resumeExpectations": [string], "portfolioExpectations": [string], "interviewTrends": [string], "topHiringCompanies": [string], "growthOutlook": string },
  "coachFeedback": { "weeklyFeedback": string, "progressSummary": string, "motivationalGuidance": string, "focusAreas": [string], "risks": [string], "nextBestAction": string },
  "milestones": [{ "title": string, "description": string, "targetDate": string, "category": string, "status": "pending" }]
}`;

  try {
    const result = await generateJSON<CareerRoadmapData>(CAREER_SYSTEM, prompt, { model: MODELS.FAST }, FALLBACK_DATA);
    return result;
  } catch (error) {
    console.warn("[Career AI] Generation failed, using fallback:", error);
    return FALLBACK_DATA;
  }
}
