import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { analyzeGithubProfile, generateReadme, generatePortfolio } from "../lib/ai/github";
import { prisma } from "../config/prisma";

const router = Router();
router.use(requireAuth);

router.post("/analyze", async (req: any, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username is required" });
    
    const analysis = await analyzeGithubProfile(username);
    
    const profile = await prisma.githubProfile.create({
      data: {
        userId: req.user.id,
        username,
        repos: analysis.keyProjects,
        languages: analysis.topLanguages,
        stars: analysis.estimatedStars,
        commits: analysis.estimatedCommits
      }
    });

    res.json({ analysis, profile });
  } catch (error) {
    res.status(500).json({ error: "Failed to analyze profile" });
  }
});

router.post("/readme", async (req: any, res) => {
  try {
    const { projectName, extraContext } = req.body;
    if (!projectName) return res.status(400).json({ error: "Project name is required" });
    
    const result = await generateReadme(projectName, extraContext);

    await prisma.generatedReadme.create({
      data: {
        userId: req.user.id,
        projectName,
        content: result.readmeContent
      }
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate README" });
  }
});

router.post("/portfolio", async (req: any, res) => {
  try {
    const { profileData } = req.body;
    const result = await generatePortfolio(profileData);

    const portfolio = await prisma.portfolio.create({
      data: {
        userId: req.user.id,
        content: result,
      }
    });

    res.json({ portfolio, ...result });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate portfolio" });
  }
});

export const githubRouter = router;
