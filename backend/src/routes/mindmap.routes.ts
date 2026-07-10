import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generateEnhancedMindMap } from "../lib/ai/gemini";
import { getUserPrismaFromRequest } from "../utils/prisma";
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
    res.json({ success: true, mindmap: result.mindmap, id: mindmap.id });
  } catch (error) {
    res.status(500).json({ error: "Mind map generation failed" });
  }
});

mindMapRouter.post("/expand", async (req, res) => {
  try {
    const { topic, mode, nodeLabel } = req.body;
    const result = await generateEnhancedMindMap(`${topic} - ${nodeLabel} (sub-topics)`, mode || "intermediate");
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
