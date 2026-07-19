import { Router } from "express";
import { getMyProfile, updateMyProfile, uploadResume, removeResume } from "../controllers/profile.controller";
import { requireAuth } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { handleRouteError } from "../utils/routeError";
import { generateJSON, MODELS } from "../lib/ai/openrouter";

export const profileRouter = Router();

profileRouter.get("/me", requireAuth, getMyProfile);
profileRouter.put("/me", requireAuth, updateMyProfile);
profileRouter.post("/upload-resume", requireAuth, upload.single("resume"), uploadResume);
profileRouter.post("/remove-resume", requireAuth, removeResume);

// ═══════════════════════════════════════════════════════════════════════════
// AI-POWERED PROFILE ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// ─── POST /ai/analyze ─ AI profile analysis with career suggestions ─────────
profileRouter.post("/ai/analyze", requireAuth, async (req: any, res) => {
  try {
    const prisma = await getUserPrismaFromRequest(req);
    const userId = req.user?.userId || req.user?.id;

    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      return res.status(404).json({ success: false, error: "Profile not found" });
    }

    const fallback = {
      summary: "Complete your profile to get AI-powered career insights.",
      strengths: [] as string[],
      improvements: [] as string[],
      careerPaths: [] as { path: string; matchScore: number; reasons: string[] }[],
      skillGaps: [] as { skill: string; importance: string; howToLearn: string }[],
    };

    const prompt = `You are an expert career advisor. Analyze this user's profile and provide comprehensive career insights.

User Profile:
- Name: ${profile.firstName || ""} ${profile.lastName || ""}
- Headline: ${profile.headline || "Not set"}
- Bio: ${profile.bio || "Not set"}
- Skills: ${(profile as any).skills || "Not set"}
- Experience: ${(profile as any).experience || "Not set"}
- Education: ${(profile as any).education || "Not set"}
- Location: ${profile.location || "Not set"}
- GitHub: ${(profile as any).github || "Not set"}
- LinkedIn: ${(profile as any).linkedin || "Not set"}
- Resume: ${profile.resumeUrl ? "Uploaded" : "Not uploaded"}

Return a JSON object with:
- summary: a 2-3 sentence professional profile summary
- strengths: array of 3-5 strengths based on the profile
- improvements: array of 3-5 specific suggestions to improve the profile
- careerPaths: array of 3 career path recommendations, each with { path, matchScore (0-100), reasons (array of strings) }
- skillGaps: array of 2-4 skills to learn, each with { skill, importance (High/Medium/Low), howToLearn (short description) }

Return ONLY the JSON object, no other text.`;

    const result = await generateJSON(
      "You are an expert career advisor who provides personalized, actionable career guidance.",
      prompt,
      { model: MODELS.FAST, temperature: 0.4 },
      fallback
    );

    const data = result && typeof result === "object" ? result : fallback;
    res.json({
      success: true,
      summary: (data as any).summary || "",
      strengths: Array.isArray((data as any).strengths) ? (data as any).strengths : [],
      improvements: Array.isArray((data as any).improvements) ? (data as any).improvements : [],
      careerPaths: Array.isArray((data as any).careerPaths) ? (data as any).careerPaths : [],
      skillGaps: Array.isArray((data as any).skillGaps) ? (data as any).skillGaps : [],
    });
  } catch (error) {
    handleRouteError(res, error, "Profile.aiAnalyze", "Failed to analyze profile");
  }
});

// ─── POST /ai/summary ─ AI-generated profile summary ───────────────────────
profileRouter.post("/ai/summary", requireAuth, async (req: any, res) => {
  try {
    const prisma = await getUserPrismaFromRequest(req);
    const userId = req.user?.userId || req.user?.id;

    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      return res.status(404).json({ success: false, error: "Profile not found" });
    }

    const { tone = "professional" } = req.body;

    const fallback = { summary: "" };

    const prompt = `You are a professional resume writer. Generate a compelling ${tone} profile summary based on this user's information.

User Profile:
- Name: ${profile.firstName || ""} ${profile.lastName || ""}
- Headline: ${profile.headline || "Not set"}
- Bio: ${profile.bio || "Not set"}
- Skills: ${(profile as any).skills || "Not set"}
- Experience: ${(profile as any).experience || "Not set"}
- Education: ${(profile as any).education || "Not set"}
- Location: ${profile.location || "Not set"}

Write a ${tone} profile summary that:
1. Highlights the user's key strengths and experience
2. Includes relevant skills and expertise areas
3. Is concise (3-5 sentences)
4. Is tailored for ${tone === "linkedin" ? "LinkedIn" : "professional"} use

Return a JSON object with:
- summary: the generated profile summary text

Return ONLY the JSON object, no other text.`;

    const result = await generateJSON(
      "You are a professional resume and profile writer who creates compelling, concise summaries.",
      prompt,
      { model: MODELS.FAST, temperature: 0.5 },
      fallback
    );

    const data = result && typeof result === "object" ? result : fallback;
    res.json({ success: true, summary: (data as any).summary || "" });
  } catch (error) {
    handleRouteError(res, error, "Profile.aiSummary", "Failed to generate summary");
  }
});
