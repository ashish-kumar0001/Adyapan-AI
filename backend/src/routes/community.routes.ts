import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { handleRouteError } from "../utils/routeError";
import { generateJSON, MODELS } from "../lib/ai/openrouter";

const router = Router();
router.use(requireAuth);

// Get follow stats for a user
router.get("/stats/:userId", async (req: any, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const { userId } = req.params;
    const followers = await userPrisma.communityFollow.count({ where: { followingId: userId } });
    const following = await userPrisma.communityFollow.count({ where: { followerId: userId } });
    const isFollowing = await userPrisma.communityFollow.findUnique({
      where: { followerId_followingId: { followerId: req.user.id, followingId: userId } },
    });
    res.json({ success: true, followers, following, isFollowing: !!isFollowing });
  } catch (error) {
    handleRouteError(res, error, "Community.stats", "Failed to fetch stats");
  }
});

// Toggle follow
router.post("/follow/:userId", async (req: any, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const { userId } = req.params;
    if (userId === req.user.id) return res.status(400).json({ error: "Cannot follow yourself" });
    const existing = await userPrisma.communityFollow.findUnique({
      where: { followerId_followingId: { followerId: req.user.id, followingId: userId } },
    });
    if (existing) {
      await userPrisma.communityFollow.delete({ where: { id: existing.id } });
      res.json({ success: true, isFollowing: false });
    } else {
      await userPrisma.communityFollow.create({
        data: { followerId: req.user.id, followingId: userId },
      });
      res.json({ success: true, isFollowing: true });
    }
  } catch (error) {
    handleRouteError(res, error, "Community.follow", "Failed to toggle follow");
  }
});

// Send message
router.post("/messages", async (req: any, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const { receiverId, content } = req.body;
    if (!receiverId || !content) return res.status(400).json({ error: "Receiver and content required" });
    const message = await userPrisma.communityMessage.create({
      data: { senderId: req.user.id, receiverId, content },
    });
    res.json({ success: true, message });
  } catch (error) {
    handleRouteError(res, error, "Community.sendMessage", "Failed to send message");
  }
});

// Get conversations
router.get("/messages", async (req: any, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const messages = await userPrisma.communityMessage.findMany({
      where: { OR: [{ senderId: req.user.id }, { receiverId: req.user.id }] },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ success: true, messages });
  } catch (error) {
    handleRouteError(res, error, "Community.getMessages", "Failed to fetch messages");
  }
});

// Mark messages as read
router.put("/messages/read/:senderId", async (req: any, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    await userPrisma.communityMessage.updateMany({
      where: { senderId: req.params.senderId, receiverId: req.user.id, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (error) {
    handleRouteError(res, error, "Community.markRead", "Failed to mark messages read");
  }
});

// Get activity feed
router.get("/activity", async (req: any, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const activities = await userPrisma.communityActivity.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ success: true, activities });
  } catch (error) {
    handleRouteError(res, error, "Community.activity", "Failed to fetch activity");
  }
});

// Get achievements
router.get("/achievements", async (req: any, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const achievements = await userPrisma.communityAchievement.findMany({
      where: { userId: req.user.id },
      orderBy: { unlockedAt: "desc" },
    });
    res.json({ success: true, achievements });
  } catch (error) {
    handleRouteError(res, error, "Community.achievements", "Failed to fetch achievements");
  }
});

// Get projects
router.get("/projects", async (req: any, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const projects = await userPrisma.communityProject.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, projects });
  } catch (error) {
    handleRouteError(res, error, "Community.projects", "Failed to fetch projects");
  }
});

// Create project
router.post("/projects", async (req: any, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const { title, description, techStack, url } = req.body;
    if (!title || !description) return res.status(400).json({ error: "Title and description required" });
    const project = await userPrisma.communityProject.create({
      data: {
        userId: req.user.id,
        title,
        description,
        techStack: techStack || [],
        url: url || null,
      },
    });
    res.json({ success: true, project });
  } catch (error) {
    handleRouteError(res, error, "Community.createProject", "Failed to create project");
  }
});

// AI Recommendations
router.get("/recommendations", async (req: any, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const profile = await userPrisma.profile.findUnique({ where: { userId: req.user.id } });
    const skills = (profile?.skills as string[]) || [];
    
    const result = await generateJSON(
      "You are a career development AI. Provide personalized recommendations based on the user's skills and interests.",
      `User skills: ${skills.join(", ") || "Not specified"}
Provide 3-5 concise, actionable recommendations for skill development, projects to build, or communities to join.

Return JSON matching:
{
  "recommendations": [
    { "title": "Recommendation title", "description": "Brief description", "category": "skill|project|community" }
  ]
}`,
      { model: MODELS.FAST, temperature: 0.7 },
      { recommendations: [] }
    );

    res.json({ success: true, recommendations: result.recommendations });
  } catch (error) {
    handleRouteError(res, error, "Community.recommendations", "Failed to generate recommendations");
  }
});

export const communityRouter = router;
