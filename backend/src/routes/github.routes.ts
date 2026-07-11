import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { analyzeGithubProfile, generateReadme, generatePortfolio } from "../lib/ai/github";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { handleRouteError } from "../utils/routeError";

const router = Router();
router.use(requireAuth);

router.post("/analyze", async (req: any, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username is required" });
    
    const analysis = await analyzeGithubProfile(username);
    const userPrisma = await getUserPrismaFromRequest(req);
    
    const profile = await userPrisma.githubProfile.create({
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
    handleRouteError(res, error, "Github.analyze", "Failed to analyze profile");
  }
});

router.post("/readme", async (req: any, res) => {
  try {
    const { projectName, extraContext } = req.body;
    if (!projectName) return res.status(400).json({ error: "Project name is required" });
    
    const result = await generateReadme(projectName, extraContext);
    const userPrisma = await getUserPrismaFromRequest(req);

    await userPrisma.generatedReadme.create({
      data: {
        userId: req.user.id,
        projectName,
        content: result.readmeContent
      }
    });

    res.json(result);
  } catch (error) {
    handleRouteError(res, error, "Github.readme", "Failed to generate README");
  }
});

router.post("/portfolio", async (req: any, res) => {
  try {
    const { profileData } = req.body;
    const result = await generatePortfolio(profileData);
    const userPrisma = await getUserPrismaFromRequest(req);

    const portfolio = await userPrisma.portfolio.create({
      data: {
        userId: req.user.id,
        content: result,
      }
    });

    res.json({ portfolio, ...result });
  } catch (error) {
    handleRouteError(res, error, "Github.portfolio", "Failed to generate portfolio");
  }
});

export const githubRouter = router;
