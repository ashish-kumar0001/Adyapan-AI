import { generateJSON, MODELS } from "./openrouter";

const CAREER_SYSTEM = `You are a senior career strategist, technical recruiter, hiring manager, and learning coach with 15+ years of experience at FAANG companies.

Generate personalized career roadmaps using the user's ACTUAL data from the platform — their resume, coding analytics, learning analytics, ATS reports, LinkedIn data, and target role.

CRITICAL RULES:
- Every single recommendation MUST be directly tied to the user's specific TARGET ROLE. Do NOT give generic advice.
- Reference the user's ACTUAL skills, scores, projects, and progress in your analysis. Never invent achievements.
- If the user has 0 DSA problems solved, say so explicitly and make DSA a high priority. If they have 50 solved, acknowledge that and focus on advanced topics.
- If their ATS score is 40%, make resume optimization a critical priority. If it's 85%, focus on other areas.
- If they have weak topics in system design, prioritize system design for their target role.
- Weekly tasks must be small, actionable (1-3 hours each), and directly connected to closing the gap for their target role.
- Explain WHY each recommendation matters specifically for the target role and current skill level.
- Certifications should only be recommended if they provide clear career value for the specific target role.
- Project recommendations should match the user's skill level and fill resume gaps for the target role.
- Market insights must be specific to the target role's job market.`;

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
  const prompt = `Generate a comprehensive, ROLE-SPECIFIC career roadmap. Every recommendation must be tailored to the user's target role.

TARGET ROLE: ${profileData.targetRole || "Software Engineer"}
EXPERIENCE LEVEL: ${profileData.experienceLevel || "Entry-level"}
TIMELINE: ${profileData.timeline || "90 Days"}

=== USER PROFILE ===
${JSON.stringify(profileData.profile || {}, null, 2)}

=== RESUME DATA (from Resume Builder) ===
Skills: ${JSON.stringify(profileData.resumeData?.skills || [])}
Experience: ${JSON.stringify(profileData.resumeData?.experience || [])}
Projects: ${JSON.stringify(profileData.resumeData?.projects || [])}
Education: ${JSON.stringify(profileData.resumeData?.education || [])}
Certifications: ${JSON.stringify(profileData.resumeData?.certifications || [])}

=== RESUME ANALYSES (AI resume review results) ===
${JSON.stringify(profileData.resumeAnalyses || [], null, 2)}

=== RESUME IMPROVEMENTS (applied improvements) ===
${JSON.stringify(profileData.resumeImprovements || [], null, 2)}

=== CODING ANALYTICS (from Coding Hub) ===
DSA Problems Solved: ${profileData.codingAnalytics?.dsaSolved || 0}
DSA Accuracy: ${Math.round((profileData.codingAnalytics?.dsaAccuracy || 0) * 100)}%
DSA Streak: ${profileData.codingAnalytics?.dsaStreak || 0} days
Total Submissions: ${profileData.codingAnalytics?.totalSubmissions || 0}
Accepted Solutions: ${profileData.codingAnalytics?.solvedProblems || 0}
Coding Sessions: ${profileData.codingAnalytics?.codingSessions || 0}
Weak Coding Topics: ${JSON.stringify(profileData.codingAnalytics?.weakTopics || [])}

=== LEARNING ANALYTICS (from Learning Hub) ===
Study Sessions: ${profileData.learningAnalytics?.studySessions || 0}
Concepts Learned: ${profileData.learningAnalytics?.conceptsLearned || 0}
Learning Score: ${profileData.learningAnalytics?.learningScore || 0}
Learning Streak: ${profileData.learningAnalytics?.currentStreak || 0} days
Documents Generated: ${profileData.learningAnalytics?.documentsCount || 0}
Overall Progress: ${profileData.learningAnalytics?.overallProgress || 0}%
Quiz Attempts: ${profileData.learningAnalytics?.quizAttempts || 0}
Avg Quiz Score: ${profileData.learningAnalytics?.avgQuizScore || 0}%

=== ATS REPORTS (from ATS Checker) ===
${JSON.stringify(profileData.atsReports || [], null, 2)}

=== LINKEDIN DATA (from LinkedIn Optimizer) ===
LinkedIn Score: ${profileData.linkedinData?.score || 0}%
Headline: ${profileData.linkedinData?.headline || "Not set"}
LinkedIn Skills: ${JSON.stringify(profileData.linkedinData?.skills || [])}

=== INSTRUCTIONS ===
Analyze ALL the data above and generate a roadmap that:
1. Addresses the SPECIFIC gaps between the user's current level and what ${profileData.targetRole || "Software Engineer"} roles require
2. References actual data points (e.g., "You've solved X problems, now focus on Y")
3. Prioritizes based on the user's weakest areas relative to the target role
4. Includes weekly tasks that are achievable given the user's current workload
5. Recommends projects that fill gaps in their resume for ${profileData.targetRole || "Software Engineer"} positions
6. Provides market insights specific to ${profileData.targetRole || "Software Engineer"} roles

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
