import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generateEnhancedMindMap } from "../lib/ai/gemini";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { StreakService } from "../services/streak.service";

export const mindMapRouter = Router();

mindMapRouter.use(requireAuth);

mindMapRouter.post("/generate", async (req, res) => {
  try {
    const { topic, mode } = req.body;
    const result = await generateEnhancedMindMap(topic, mode || "intermediate");
    const userPrisma = await getUserPrismaFromRequest(req);
    
    const mindmap = await userPrisma.mindMap.create({
      data: {
        userId: req.user!.userId,
        topic,
        nodes: result.mindmap.nodes as any,
        edges: result.mindmap.edges as any,
      },
    });

    // Track Streak Activity
    StreakService.trackActivity(
      req.user!.userId,
      "CREATE_MIND_MAP",
      "mindmap_generator",
      mindmap.id,
      15, // 15 points
      (req.headers["x-timezone"] as string) || "UTC",
      userPrisma
    ).catch(err => console.error("Streak tracking error:", err));

    res.json({ success: true, mindmap: result.mindmap, id: mindmap.id });
  } catch (error) {
    res.status(500).json({ error: "Mind map generation failed" });
  }
});

mindMapRouter.post("/expand", async (req, res) => {
  try {
    const { topic, mode, nodeLabel } = req.body;
    const result = await generateEnhancedMindMap(`${topic} - ${nodeLabel} (sub-topics)`, mode || "intermediate");
    const userPrisma = await getUserPrismaFromRequest(req);

    // Track Streak Activity
    StreakService.trackActivity(
      req.user!.userId,
      "CREATE_MIND_MAP",
      "mindmap_generator",
      null,
      10, // 10 points
      (req.headers["x-timezone"] as string) || "UTC",
      userPrisma
    ).catch(err => console.error("Streak tracking error:", err));

    res.json({ success: true, expansion: result.mindmap });
  } catch (error) {
    res.status(500).json({ error: "Expansion failed" });
  }
});

mindMapRouter.get("/history", async (req, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const mindmaps = await userPrisma.mindMap.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, mindmaps });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});
