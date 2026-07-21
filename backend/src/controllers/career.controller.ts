import type { NextFunction, Request, Response } from "express";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { requireUserId } from "../utils/request";
import { generateCareerRoadmap } from "../lib/ai/career-ai";

export async function generateRoadmap(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const userPrisma = await getUserPrismaFromRequest(req);
    const { targetRole, timeline } = req.body;

    // Gather all user data for AI
    const profile = await userPrisma.profile.findUnique({ where: { userId } });
    const resumes = await userPrisma.resume.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 });
    const atsReports = await userPrisma.aTSReport.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 });
    const linkedinReports = await userPrisma.linkedInReport.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 3 });
    const studySessions = await userPrisma.studySession.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 });
    const dsaProgress = await userPrisma.dSAProgress.findUnique({ where: { userId } });
    const weakTopics = await userPrisma.weakTopic.findMany({ where: { userId } });
    const codingSessions = await userPrisma.codingSession.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 });
    const quizes = await userPrisma.quizAttempt.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 10 });
    const learningAnalytics = await userPrisma.learningAnalytics.findUnique({ where: { userId } });
    const progressTracking = await userPrisma.progressTracking.findUnique({ where: { userId } });
    const coverLetters = await userPrisma.coverLetter.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 });
    const submissions = await userPrisma.submission.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30 });

    const avgAtsScore = atsReports.length
      ? Math.round(atsReports.reduce((s: number, r: any) => s + (r.score || 0), 0) / atsReports.length)
      : 0;

    const avgLinkedinScore = linkedinReports.length
      ? Math.round(linkedinReports.reduce((s: number, r: any) => s + (r.score || 0), 0) / linkedinReports.length)
      : 0;

    const profileData = {
      profile: {
        name: profile?.user?.name || "",
        targetRole: targetRole || profile?.targetRole || profile?.careerGoal || "",
        skills: profile?.skills || [],
        interestedDomains: profile?.interestedDomains || [],
        college: profile?.college || "",
        degree: profile?.degree || "",
        graduationYear: profile?.graduationYear || "",
        careerObjective: profile?.careerObjective || "",
        github: profile?.github || "",
        linkedin: profile?.linkedin || "",
      },
      targetRole: targetRole || profile?.targetRole || "Software Engineer",
      timeline: timeline || "90 Days",
      codingAnalytics: {
        dsaSolved: dsaProgress?.solved || 0,
        dsaAccuracy: dsaProgress?.accuracy || 0,
        dsaStreak: dsaProgress?.streak || 0,
        totalSubmissions: submissions.length,
        solvedProblems: submissions.filter((s: any) => s.status === "Accepted" || s.status === "solved").length,
        codingSessions: codingSessions.length,
        weakTopics: weakTopics.map((w: any) => ({ name: w.topicName, score: w.strengthScore, risk: w.riskLevel })),
      },
      learningAnalytics: {
        studySessions: studySessions.length,
        conceptsLearned: learningAnalytics?.conceptsLearned || 0,
        learningScore: learningAnalytics?.learningScore || 0,
        currentStreak: learningAnalytics?.currentStreak || 0,
        documentsCount: learningAnalytics?.documentsCount || 0,
        overallProgress: progressTracking?.overallProgress || 0,
        quizAttempts: quizes.length,
        avgQuizScore: quizes.length > 0 ? Math.round(quizes.reduce((s: number, q: any) => s + (q.accuracy || 0) * 100, 0) / quizes.length) : 0,
      },
      atsReports: atsReports.map((r: any) => ({ score: r.score, keywords: r.missingKeywords })),
      resumeData: resumes.length > 0 ? {
        hasResume: true,
        skills: resumes[0].skills,
        experience: resumes[0].experience,
        projects: resumes[0].projects,
        education: resumes[0].education,
        certifications: resumes[0].certifications,
      } : { hasResume: false },
      linkedinData: linkedinReports.length > 0 ? {
        score: avgLinkedinScore,
        headline: linkedinReports[0].headline,
        skills: linkedinReports[0].skills,
      } : { score: 0, headline: "", skills: [] },
      coverLettersCount: coverLetters.length,
    };

    const roadmapData = await generateCareerRoadmap(profileData);

    // Save to database
    const roadmap = await userPrisma.careerRoadmap.create({
      data: {
        userId,
        targetRole: profileData.targetRole,
        timeline: profileData.timeline,
        readinessScore: roadmapData.readinessScores.overall,
        technicalScore: roadmapData.readinessScores.technical,
        resumeScore: roadmapData.readinessScores.resume,
        interviewScore: roadmapData.readinessScores.interview,
        placementScore: roadmapData.readinessScores.placement,
        recruiterScore: roadmapData.readinessScores.recruiter,
        roadmapJson: roadmapData.roadmap as any,
        weeklyPlanJson: roadmapData.weeklyPlan as any,
        gapAnalysisJson: roadmapData.gapAnalysis as any,
        skillMapJson: roadmapData.skillMap as any,
        projectRecsJson: roadmapData.projectRecommendations as any,
        certRecsJson: roadmapData.certRecommendations as any,
        marketInsightsJson: roadmapData.marketInsights as any,
        coachFeedbackJson: roadmapData.coachFeedback as any,
        milestonesJson: roadmapData.milestones as any,
      },
    });

    // Create task records
    if (roadmapData.weeklyPlan?.tasks?.length) {
      await userPrisma.careerTask.createMany({
        data: roadmapData.weeklyPlan.tasks.map((t: any) => ({
          roadmapId: roadmap.id,
          userId,
          title: t.title,
          description: t.description || "",
          category: t.category || "learning",
          priority: t.priority || "Medium",
          status: t.status || "not_started",
          estimatedHours: t.estimatedHours || 1,
          impactScore: t.impactScore || 50,
        })),
      });
    }

    res.json({ success: true, roadmap, roadmapData });
  } catch (error) {
    next(error);
  }
}

export async function getLatestRoadmap(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const userPrisma = await getUserPrismaFromRequest(req);

    const roadmap = await userPrisma.careerRoadmap.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { tasks: true },
    });

    if (!roadmap) {
      res.json({ success: true, roadmap: null });
      return;
    }

    const roadmapData = {
      readinessScores: {
        overall: roadmap.readinessScore,
        technical: roadmap.technicalScore,
        resume: roadmap.resumeScore,
        interview: roadmap.interviewScore,
        placement: roadmap.placementScore,
        recruiter: roadmap.recruiterScore,
      },
      roadmap: roadmap.roadmapJson,
      weeklyPlan: roadmap.weeklyPlanJson,
      gapAnalysis: roadmap.gapAnalysisJson,
      skillMap: roadmap.skillMapJson,
      projectRecommendations: roadmap.projectRecsJson,
      certRecommendations: roadmap.certRecsJson,
      marketInsights: roadmap.marketInsightsJson,
      coachFeedback: roadmap.coachFeedbackJson,
      milestones: roadmap.milestonesJson,
    };

    res.json({ success: true, roadmap, roadmapData, tasks: roadmap.tasks });
  } catch (error) {
    next(error);
  }
}

export async function listRoadmaps(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const userPrisma = await getUserPrismaFromRequest(req);

    const roadmaps = await userPrisma.careerRoadmap.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, targetRole: true, timeline: true, readinessScore: true, createdAt: true, versionNumber: true },
    });

    res.json({ success: true, roadmaps });
  } catch (error) {
    next(error);
  }
}

export async function getRoadmapById(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const userPrisma = await getUserPrismaFromRequest(req);
    const { id } = req.params;

    const roadmap = await userPrisma.careerRoadmap.findFirst({
      where: { id, userId },
      include: { tasks: true },
    });

    if (!roadmap) {
      res.status(404).json({ success: false, error: "Roadmap not found" });
      return;
    }

    const roadmapData = {
      readinessScores: {
        overall: roadmap.readinessScore,
        technical: roadmap.technicalScore,
        resume: roadmap.resumeScore,
        interview: roadmap.interviewScore,
        placement: roadmap.placementScore,
        recruiter: roadmap.recruiterScore,
      },
      roadmap: roadmap.roadmapJson,
      weeklyPlan: roadmap.weeklyPlanJson,
      gapAnalysis: roadmap.gapAnalysisJson,
      skillMap: roadmap.skillMapJson,
      projectRecommendations: roadmap.projectRecsJson,
      certRecommendations: roadmap.certRecsJson,
      marketInsights: roadmap.marketInsightsJson,
      coachFeedback: roadmap.coachFeedbackJson,
      milestones: roadmap.milestonesJson,
    };

    res.json({ success: true, roadmap, roadmapData, tasks: roadmap.tasks });
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const userPrisma = await getUserPrismaFromRequest(req);
    const { taskId, status } = req.body;

    if (!taskId || !status) {
      res.status(400).json({ success: false, error: "taskId and status are required" });
      return;
    }

    const validStatuses = ["not_started", "in_progress", "completed", "skipped"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
      return;
    }

    const task = await userPrisma.careerTask.findFirst({ where: { id: taskId, userId } });
    if (!task) {
      res.status(404).json({ success: false, error: "Task not found" });
      return;
    }

    const updated = await userPrisma.careerTask.update({
      where: { id: taskId },
      data: {
        status,
        completedAt: status === "completed" ? new Date() : null,
      },
    });

    // Update roadmap completion percentage
    const allTasks = await userPrisma.careerTask.findMany({ where: { roadmapId: task.roadmapId } });
    const completed = allTasks.filter(t => t.status === "completed").length;
    const completionPct = Math.round((completed / allTasks.length) * 100);

    await userPrisma.careerRoadmap.update({
      where: { id: task.roadmapId },
      data: { readinessScore: Math.min(100, completionPct) },
    });

    res.json({ success: true, task: updated, completionPercentage: completionPct });
  } catch (error) {
    next(error);
  }
}

export async function deleteRoadmap(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = requireUserId(req);
    const userPrisma = await getUserPrismaFromRequest(req);
    const { id } = req.params;

    const roadmap = await userPrisma.careerRoadmap.findFirst({ where: { id, userId } });
    if (!roadmap) {
      res.status(404).json({ success: false, error: "Roadmap not found" });
      return;
    }

    await userPrisma.careerTask.deleteMany({ where: { roadmapId: id } });
    await userPrisma.careerRoadmap.delete({ where: { id } });

    res.json({ success: true, message: "Roadmap deleted" });
  } catch (error) {
    next(error);
  }
}
