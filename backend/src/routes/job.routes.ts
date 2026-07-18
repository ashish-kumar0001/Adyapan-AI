import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { handleRouteError } from "../utils/routeError";
import { generateJSON, MODELS } from "../lib/ai/openrouter";

const router = Router();
router.use(requireAuth);

// Get all active jobs
router.get("/", async (req: any, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const jobs = await userPrisma.job.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, jobs });
  } catch (error) {
    handleRouteError(res, error, "Job.list", "Failed to fetch jobs");
  }
});

// Get saved job IDs
router.get("/saved", async (req: any, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const saved = await userPrisma.jobSaved.findMany({
      where: { userId: req.user.id },
      select: { jobId: true },
    });
    res.json({ success: true, savedIds: saved.map((s) => s.jobId) });
  } catch (error) {
    handleRouteError(res, error, "Job.saved", "Failed to fetch saved jobs");
  }
});

// Toggle save job
router.post("/saved/:jobId", async (req: any, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const { jobId } = req.params;
    const existing = await userPrisma.jobSaved.findUnique({
      where: { userId_jobId: { userId: req.user.id, jobId } },
    });
    if (existing) {
      await userPrisma.jobSaved.delete({ where: { id: existing.id } });
      res.json({ success: true, saved: false });
    } else {
      await userPrisma.jobSaved.create({
        data: { userId: req.user.id, jobId },
      });
      res.json({ success: true, saved: true });
    }
  } catch (error) {
    handleRouteError(res, error, "Job.toggleSave", "Failed to save job");
  }
});

// Apply to job
router.post("/apply/:jobId", async (req: any, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const { jobId } = req.params;
    const existing = await userPrisma.jobApplication.findUnique({
      where: { userId_jobId: { userId: req.user.id, jobId } },
    });
    if (existing) {
      return res.json({ success: true, status: "already_applied" });
    }
    await userPrisma.jobApplication.create({
      data: { userId: req.user.id, jobId },
    });
    res.json({ success: true, status: "applied" });
  } catch (error) {
    handleRouteError(res, error, "Job.apply", "Failed to apply");
  }
});

// JD Compatibility Analysis
router.post("/jd-analyze", async (req: any, res) => {
  try {
    const { jdText, resumeText } = req.body;
    if (!jdText) return res.status(400).json({ error: "Job description is required" });

    const result = await generateJSON(
      "You are an expert HR analyst specializing in resume-job description compatibility scoring.",
      `Analyze the compatibility between this job description and the provided resume text.

Job Description:
${jdText}

Resume Text:
${resumeText || "No resume text provided. Analyze based on the JD alone and provide general recommendations."}

Return JSON matching:
{
  "overallScore": 75,
  "skillsMatch": 80,
  "experienceMatch": 70,
  "educationMatch": 85,
  "atsCompatibility": 90,
  "keywordsFound": ["list of keywords from JD found in resume"],
  "keywordsMissing": ["important keywords from JD missing in resume"],
  "keywordsSuggested": ["additional keywords to improve match"],
  "suggestions": ["specific actionable suggestions to improve the resume"]
}`,
      { model: MODELS.FAST, temperature: 0.3 },
      {
        overallScore: 0,
        skillsMatch: 0,
        experienceMatch: 0,
        educationMatch: 0,
        atsCompatibility: 0,
        keywordsFound: [],
        keywordsMissing: [],
        keywordsSuggested: [],
        suggestions: [],
      }
    );

    res.json({ success: true, report: result });
  } catch (error) {
    handleRouteError(res, error, "Job.jdAnalyze", "Failed to analyze JD compatibility");
  }
});

// AI Career Assistant Chat
router.post("/career-chat", async (req: any, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const lastMessage = messages[messages.length - 1]?.content || "";
    const chatHistory = messages.map((m: any) => `${m.role}: ${m.content}`).join("\n");

    const result = await generateJSON(
      "You are an expert career advisor and job search assistant. Provide helpful, actionable advice about job searching, resume optimization, interview preparation, career growth, salary negotiation, and professional development. Be concise and practical.",
      `Conversation history:
${chatHistory}

User's latest message: "${lastMessage}"

Return JSON matching:
{
  "response": "Your helpful career advice response here"
}`,
      { model: MODELS.FAST, temperature: 0.7 },
      { response: "I'm here to help with your career questions. Could you please rephrase that?" }
    );

    res.json({ success: true, response: result.response });
  } catch (error) {
    handleRouteError(res, error, "Job.careerChat", "Failed to get career advice");
  }
});

// Get hiring challenges
router.get("/challenges", async (req: any, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const challenges = await userPrisma.hiringChallenge.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, challenges });
  } catch (error) {
    handleRouteError(res, error, "Job.challenges", "Failed to fetch challenges");
  }
});

// Referrals
router.get("/referrals", async (req: any, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const referrals = await userPrisma.referral.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, referrals });
  } catch (error) {
    handleRouteError(res, error, "Job.referrals", "Failed to fetch referrals");
  }
});

router.post("/referrals", async (req: any, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const { company, role, notes } = req.body;
    if (!company || !role) return res.status(400).json({ error: "Company and role are required" });

    const result = await generateJSON(
      "You are a professional networking assistant. Write a polite, concise referral request outreach message.",
      `Write a professional outreach message for a referral request:
Company: ${company}
Role: ${role}
Additional notes: ${notes || "None"}

Return JSON matching:
{
  "message": "The complete outreach message text"
}`,
      { model: MODELS.FAST, temperature: 0.5 },
      { message: `Hi, I'm interested in the ${role} position at ${company}. Would you be able to provide a referral?` }
    );

    const referral = await userPrisma.referral.create({
      data: {
        userId: req.user.id,
        company,
        role,
        notes: notes || "",
        outreachMsg: result.message,
        status: "Requested",
      },
    });

    res.json({ success: true, referral });
  } catch (error) {
    handleRouteError(res, error, "Job.createReferral", "Failed to create referral request");
  }
});

export const jobRouter = router;
