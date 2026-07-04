import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generatePPTContent } from "../lib/ai/gemini";
import { prisma } from "../config/prisma";
export const pptRouter = Router();

pptRouter.use(requireAuth);

pptRouter.post("/generate", async (req, res) => {
  try {
    const { topic, slideCount, audience, style } = req.body;
    const slides = await generatePPTContent(topic, parseInt(slideCount));
    
    const ppt = await prisma.presentation.create({
      data: {
        userId: req.user!.userId,
        topic,
        slideCount: parseInt(slideCount),
        audience,
        style,
        slides: slides as any,
      },
    });
    res.json({ success: true, presentation: ppt });
  } catch (error) {
    res.status(500).json({ error: "PPT generation failed" });
  }
});

pptRouter.get("/history", async (req, res) => {
  try {
    const ppts = await prisma.presentation.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, presentations: ppts });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});
