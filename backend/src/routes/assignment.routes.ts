import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generateAssignment } from "../lib/ai/gemini";
import { prisma } from "../config/prisma";
export const assignmentRouter = Router();

assignmentRouter.use(requireAuth);

assignmentRouter.post("/generate", async (req, res) => {
  try {
    const { topic, academicLevel, wordCount } = req.body;
    const result = await generateAssignment(topic, academicLevel, wordCount);
    
    const assignment = await prisma.assignment.create({
      data: {
        userId: req.user!.userId,
        topic,
        academicLevel,
        wordCount: parseInt(wordCount),
        content: result as any,
      },
    });
    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ error: "Assignment generation failed" });
  }
});

assignmentRouter.get("/history", async (req, res) => {
  try {
    const assignments = await prisma.assignment.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});
