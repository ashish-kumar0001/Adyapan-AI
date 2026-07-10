import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generateAssignment } from "../lib/ai/gemini";
import { getUserPrismaFromRequest } from "../utils/prisma";
export const assignmentRouter = Router();

assignmentRouter.use(requireAuth);

assignmentRouter.post("/generate", async (req, res) => {
  try {
    const { topic, academicLevel, wordCount } = req.body;
    const result = await generateAssignment(topic, academicLevel, wordCount);
    const userPrisma = await getUserPrismaFromRequest(req);
    
    const assignment = await userPrisma.assignment.create({
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
    const userPrisma = await getUserPrismaFromRequest(req);
    const assignments = await userPrisma.assignment.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});
