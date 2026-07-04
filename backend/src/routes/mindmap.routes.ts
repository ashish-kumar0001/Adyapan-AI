import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generateMindMapSchema } from "../lib/ai/gemini";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const mindMapRouter = Router();

mindMapRouter.use(requireAuth);

mindMapRouter.post("/generate", async (req, res) => {
  try {
    const { topic } = req.body;
    const result = await generateMindMapSchema(topic);
    
    const mindmap = await prisma.mindMap.create({
      data: {
        userId: req.user!.userId,
        topic,
        nodes: result.nodes as any,
        edges: result.edges as any,
      },
    });
    res.json({ success: true, mindmap });
  } catch (error) {
    res.status(500).json({ error: "Mind map generation failed" });
  }
});

mindMapRouter.get("/history", async (req, res) => {
  try {
    const mindmaps = await prisma.mindMap.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, mindmaps });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});
