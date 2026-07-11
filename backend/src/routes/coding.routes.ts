import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generateCode, debugCode, explainCode, generateProject } from "../lib/ai/coding";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { handleRouteError } from "../utils/routeError";

const router = Router();
router.use(requireAuth);

router.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });
    
    const result = await generateCode(prompt);
    res.json(result);
  } catch (error) {
    handleRouteError(res, error, "Coding.generate", "Failed to generate code");
  }
});

router.post("/debug", async (req, res) => {
  try {
    const { errorMsg, codeSnippet } = req.body;
    if (!errorMsg || !codeSnippet) return res.status(400).json({ error: "Error message and code snippet are required" });
    
    const result = await debugCode(errorMsg, codeSnippet);
    res.json(result);
  } catch (error) {
    handleRouteError(res, error, "Coding.debug", "Failed to debug code");
  }
});

router.post("/explain", async (req, res) => {
  try {
    const { codeSnippet } = req.body;
    if (!codeSnippet) return res.status(400).json({ error: "Code snippet is required" });
    
    const result = await explainCode(codeSnippet);
    res.json(result);
  } catch (error) {
    handleRouteError(res, error, "Coding.explain", "Failed to explain code");
  }
});

router.post("/project", async (req, res) => {
  try {
    const { projectName } = req.body;
    if (!projectName) return res.status(400).json({ error: "Project name is required" });
    
    const result = await generateProject(projectName);
    res.json(result);
  } catch (error) {
    handleRouteError(res, error, "Coding.project", "Failed to generate project");
  }
});

router.get("/history", async (req: any, res) => {
  try {
    const userPrisma = await getUserPrismaFromRequest(req);
    const sessions = await userPrisma.codingSession.findMany({
      where: { userId: req.user!.userId },
      orderBy: { updatedAt: 'desc' },
      include: { messages: true }
    });
    res.json({ sessions });
  } catch (error) {
    handleRouteError(res, error, "Coding.history", "Failed to fetch history");
  }
});

export const codingRouter = router;
