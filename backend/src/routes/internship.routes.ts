import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { handleRouteError } from "../utils/routeError";
import { generateJSON, MODELS } from "../lib/ai/openrouter";

const internshipRouter = Router();

internshipRouter.get("/", async (req, res) => {
  try {
    const prisma = await getUserPrismaFromRequest(req);
    const {
      search,
      company,
      category,
      location,
      country,
      mode,
      internshipType,
      isPaid,
      duration,
      skills,
      sortBy = "postedDate",
      order = "desc",
      page = "1",
      limit = "20",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search && typeof search === "string") {
      const searchTerm = search.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { company: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        { skills: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    if (company && typeof company === "string") {
      where.company = { contains: company.trim(), mode: "insensitive" };
    }

    if (category && typeof category === "string") {
      where.category = { contains: category.trim(), mode: "insensitive" };
    }

    if (location && typeof location === "string") {
      where.location = { contains: location.trim(), mode: "insensitive" };
    }

    if (country && typeof country === "string") {
      where.country = { contains: country.trim(), mode: "insensitive" };
    }

    if (mode && typeof mode === "string") {
      where.mode = { equals: mode.trim(), mode: "insensitive" };
    }

    if (internshipType && typeof internshipType === "string") {
      where.internshipType = { equals: internshipType.trim(), mode: "insensitive" };
    }

    if (isPaid !== undefined && isPaid !== null) {
      where.isPaid = isPaid === "true";
    }

    if (duration && typeof duration === "string") {
      where.duration = { contains: duration.trim(), mode: "insensitive" };
    }

    if (skills && typeof skills === "string") {
      const skillsList = skills.split(",").map((s) => s.trim()).filter(Boolean);
      if (skillsList.length > 0) {
        where.AND = skillsList.map((skill) => ({
          skills: { contains: skill, mode: "insensitive" },
        }));
      }
    }

    const validSortFields: Record<string, string> = {
      postedDate: "postedDate",
      createdAt: "createdAt",
      stipend: "stipend",
    };
    const sortField = validSortFields[sortBy as string] || "createdAt";
    const sortOrder = order === "asc" ? "asc" : "desc";

    const [internships, total] = await Promise.all([
      prisma.internship.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip,
        take: limitNum,
      }),
      prisma.internship.count({ where }),
    ]);

    res.json({
      success: true,
      internships,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    handleRouteError(res, error, "Internship.list", "Failed to fetch internships");
  }
});

internshipRouter.get("/featured", async (req, res) => {
  try {
    const prisma = await getUserPrismaFromRequest(req);

    const internships = await prisma.internship.findMany({
      where: { isFeatured: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    res.json({ success: true, internships });
  } catch (error) {
    handleRouteError(res, error, "Internship.featured", "Failed to fetch featured internships");
  }
});

internshipRouter.get("/trending", async (req, res) => {
  try {
    const prisma = await getUserPrismaFromRequest(req);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trending = await prisma.internshipSaved.groupBy({
      by: ["internshipId"],
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { internshipId: true },
      orderBy: { _count: { internshipId: "desc" } },
      take: 10,
    });

    const internshipIds = trending.map((t) => t.internshipId);

    const internships = internshipIds.length > 0
      ? await prisma.internship.findMany({
          where: { id: { in: internshipIds } },
        })
      : [];

    const ordered = internshipIds.map((id) =>
      internships.find((i) => i.id === id)
    ).filter(Boolean);

    res.json({ success: true, internships: ordered });
  } catch (error) {
    handleRouteError(res, error, "Internship.trending", "Failed to fetch trending internships");
  }
});

internshipRouter.get("/companies", async (req, res) => {
  try {
    const prisma = await getUserPrismaFromRequest(req);

    const results = await prisma.internship.groupBy({
      by: ["company"],
      _count: { company: true },
      orderBy: { _count: { company: "desc" } },
    });

    const companies = results.map((r) => ({
      name: r.company,
      count: r._count.company,
    }));

    res.json({ success: true, companies });
  } catch (error) {
    handleRouteError(res, error, "Internship.companies", "Failed to fetch companies");
  }
});

internshipRouter.get("/user/saved", requireAuth, async (req, res) => {
  try {
    const prisma = await getUserPrismaFromRequest(req);
    const userId = (req as any).userId;

    const saved = await prisma.internshipSaved.findMany({
      where: { userId },
      select: { internshipId: true },
    });

    res.json({
      success: true,
      savedIds: saved.map((s) => s.internshipId),
    });
  } catch (error) {
    handleRouteError(res, error, "Internship.saved", "Failed to fetch saved internships");
  }
});

internshipRouter.get("/user/applications", requireAuth, async (req, res) => {
  try {
    const prisma = await getUserPrismaFromRequest(req);
    const userId = (req as any).userId;

    const applications = await prisma.internshipApplication.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, applications });
  } catch (error) {
    handleRouteError(res, error, "Internship.applications", "Failed to fetch applications");
  }
});

internshipRouter.get("/:id", async (req, res) => {
  try {
    const prisma = await getUserPrismaFromRequest(req);
    const { id } = req.params;

    const internship = await prisma.internship.findUnique({
      where: { id },
    });

    if (!internship) {
      res.status(404).json({ success: false, error: "Internship not found" });
      return;
    }

    res.json({ success: true, internship });
  } catch (error) {
    handleRouteError(res, error, "Internship.get", "Failed to fetch internship");
  }
});

internshipRouter.post("/saved/:internshipId", requireAuth, async (req, res) => {
  try {
    const prisma = await getUserPrismaFromRequest(req);
    const userId = (req as any).userId;
    const { internshipId } = req.params;

    const existing = await prisma.internshipSaved.findUnique({
      where: { userId_internshipId: { userId, internshipId } },
    });

    if (existing) {
      await prisma.internshipSaved.delete({
        where: { userId_internshipId: { userId, internshipId } },
      });
      res.json({ success: true, saved: false });
    } else {
      await prisma.internshipSaved.create({
        data: { userId, internshipId },
      });
      res.json({ success: true, saved: true });
    }
  } catch (error) {
    handleRouteError(res, error, "Internship.toggleSave", "Failed to toggle save");
  }
});

internshipRouter.post("/apply/:internshipId", requireAuth, async (req, res) => {
  try {
    const prisma = await getUserPrismaFromRequest(req);
    const userId = (req as any).userId;
    const { internshipId } = req.params;

    const existing = await prisma.internshipApplication.findUnique({
      where: { userId_internshipId: { userId, internshipId } },
    });

    if (existing) {
      res.json({ success: true, status: "already_applied" });
      return;
    }

    await prisma.internshipApplication.create({
      data: { userId, internshipId, status: "applied" },
    });

    res.json({ success: true, status: "applied" });
  } catch (error) {
    handleRouteError(res, error, "Internship.apply", "Failed to apply to internship");
  }
});

internshipRouter.put("/applications/:applicationId", requireAuth, async (req, res) => {
  try {
    const prisma = await getUserPrismaFromRequest(req);
    const userId = (req as any).userId;
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    const application = await prisma.internshipApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      res.status(404).json({ success: false, error: "Application not found" });
      return;
    }

    if (application.userId !== userId) {
      res.status(403).json({ success: false, error: "Forbidden" });
      return;
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.internshipApplication.update({
      where: { id: applicationId },
      data: updateData,
    });

    res.json({ success: true, application: updated });
  } catch (error) {
    handleRouteError(res, error, "Internship.updateApplication", "Failed to update application");
  }
});

internshipRouter.post("/ai/recommend", requireAuth, async (req, res) => {
  try {
    const prisma = await getUserPrismaFromRequest(req);
    const { skills = [], interests = [], location } = req.body;

    if (!Array.isArray(skills) || !Array.isArray(interests)) {
      res.status(400).json({ success: false, error: "skills and interests must be arrays" });
      return;
    }

    const internships = await prisma.internship.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    if (internships.length === 0) {
      res.json({ success: true, recommendations: [] });
      return;
    }

    const prompt = `You are an internship matching engine. Given the user profile and a list of internships, rank the top matches.

User Profile:
- Skills: ${skills.join(", ") || "None listed"}
- Interests: ${interests.join(", ") || "None listed"}
- Preferred Location: ${location || "Any"}

Internships:
${internships.map((i, idx) => `[${i.id}] ${i.title} at ${i.company} | Location: ${i.location || "N/A"} | Mode: ${i.mode || "N/A"} | Skills: ${i.skills || "N/A"} | Type: ${i.internshipType || "N/A"} | Paid: ${i.isPaid ? "Yes" : "No"}`).join("\n")}

Return a JSON array of recommendations sorted by best match first. Each object must have:
- internshipId: the internship ID string
- score: relevance score from 0-100
- reasons: array of 1-3 short reason strings explaining why it matches
- missingSkills: array of skills the user lacks for this role

Return ONLY the JSON array, no other text.`;

    const recommendations = await generateJSON(
      "You are an internship matching engine. Given the user profile and a list of internships, rank the top matches.",
      prompt,
      { model: MODELS.FAST, temperature: 0.3 },
      []
    );

    const recArray = Array.isArray(recommendations) ? recommendations : [];

    res.json({ success: true, recommendations: recArray });
  } catch (error) {
    handleRouteError(res, error, "Internship.recommendations", "Failed to generate recommendations");
  }
});

internshipRouter.post("/ai/summary", requireAuth, async (req, res) => {
  try {
    const prisma = await getUserPrismaFromRequest(req);
    const { internshipId } = req.body;

    if (!internshipId || typeof internshipId !== "string") {
      res.status(400).json({ success: false, error: "internshipId is required" });
      return;
    }

    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
    });

    if (!internship) {
      res.status(404).json({ success: false, error: "Internship not found" });
      return;
    }

    const prompt = `You are a career advisor. Analyze this internship listing and provide a concise summary.

Internship Details:
- Title: ${internship.title}
- Company: ${internship.company}
- Location: ${internship.location || "Not specified"}
- Country: ${internship.country || "Not specified"}
- Mode: ${internship.mode || "Not specified"}
- Type: ${internship.internshipType || "Not specified"}
- Duration: ${internship.duration || "Not specified"}
- Stipend: ${internship.stipend || "Not specified"}
- Paid: ${internship.isPaid ? "Yes" : "No"}
- Skills Required: ${internship.skills || "Not specified"}
- Description: ${internship.description || "Not available"}

Return a JSON object with:
- summary: a 2-3 sentence summary of the role
- keyHighlights: array of 3-5 key highlights about this internship
- companyInsights: array of 2-3 brief insights about the company or role context

Return ONLY the JSON object, no other text.`;

    const result = await generateJSON(
      "You are a career advisor. Analyze this internship listing and provide a concise summary.",
      prompt,
      { model: MODELS.FAST, temperature: 0.3 },
      {
        summary: "",
        keyHighlights: [],
        companyInsights: []
      }
    );

    const data = result && typeof result === "object" ? result : {};

    res.json({
      success: true,
      summary: (data as any).summary || "",
      keyHighlights: Array.isArray((data as any).keyHighlights) ? (data as any).keyHighlights : [],
      companyInsights: Array.isArray((data as any).companyInsights) ? (data as any).companyInsights : [],
    });
  } catch (error) {
    handleRouteError(res, error, "Internship.summary", "Failed to generate summary");
  }
});

internshipRouter.post("/ai/skill-gap", requireAuth, async (req, res) => {
  try {
    const prisma = await getUserPrismaFromRequest(req);
    const { internshipId, userSkills = [] } = req.body;

    if (!internshipId || typeof internshipId !== "string") {
      res.status(400).json({ success: false, error: "internshipId is required" });
      return;
    }

    if (!Array.isArray(userSkills)) {
      res.status(400).json({ success: false, error: "userSkills must be an array" });
      return;
    }

    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
    });

    if (!internship) {
      res.status(404).json({ success: false, error: "Internship not found" });
      return;
    }

    const prompt = `You are a skill gap analyzer. Compare the user's skills against the internship requirements and provide a detailed analysis.

Internship: ${internship.title} at ${internship.company}
Required Skills: ${internship.skills || "Not specified"}
Description: ${internship.description || "Not available"}

User's Current Skills: ${userSkills.join(", ") || "None listed"}

Return a JSON object with:
- matchScore: percentage match from 0-100
- matchingSkills: array of skills the user already has that match requirements
- missingSkills: array of skills the user lacks that are required or beneficial
- learningResources: array of objects with { skill: skill name, resource: short description of how to learn it, url: a helpful learning URL }

Return ONLY the JSON object, no other text.`;

    const result = await generateJSON(
      "You are a skill gap analyzer. Compare the user's skills against the internship requirements and provide a detailed analysis.",
      prompt,
      { model: MODELS.FAST, temperature: 0.3 },
      {
        matchScore: 0,
        matchingSkills: [],
        missingSkills: [],
        learningResources: []
      }
    );

    const data = result && typeof result === "object" ? result : {};

    res.json({
      success: true,
      matchScore: typeof (data as any).matchScore === "number" ? (data as any).matchScore : 0,
      matchingSkills: Array.isArray((data as any).matchingSkills) ? (data as any).matchingSkills : [],
      missingSkills: Array.isArray((data as any).missingSkills) ? (data as any).missingSkills : [],
      learningResources: Array.isArray((data as any).learningResources) ? (data as any).learningResources : [],
    });
  } catch (error) {
    handleRouteError(res, error, "Internship.skillGap", "Failed to analyze skill gap");
  }
});

internshipRouter.post("/ai/cover-letter", requireAuth, async (req, res) => {
  try {
    const prisma = await getUserPrismaFromRequest(req);
    const { internshipId, userName, userBackground } = req.body;

    if (!internshipId || typeof internshipId !== "string") {
      res.status(400).json({ success: false, error: "internshipId is required" });
      return;
    }

    if (!userName || typeof userName !== "string") {
      res.status(400).json({ success: false, error: "userName is required" });
      return;
    }

    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
    });

    if (!internship) {
      res.status(404).json({ success: false, error: "Internship not found" });
      return;
    }

    const prompt = `You are a professional cover letter writer. Write a compelling, personalized cover letter for the following internship application.

Applicant Name: ${userName}
Applicant Background: ${userBackground || "Not provided"}

Internship Details:
- Title: ${internship.title}
- Company: ${internship.company}
- Location: ${internship.location || "Not specified"}
- Skills Required: ${internship.skills || "Not specified"}
- Description: ${internship.description || "Not available"}

Write a professional cover letter that:
1. Opens with enthusiasm for the specific role
2. Highlights relevant experience from the background
3. Demonstrates knowledge of the company
4. Maps the applicant's skills to the role requirements
5. Closes with a strong call to action

Keep it under 400 words. Use a professional but warm tone. Do not use placeholder text like [Company Name] — use the actual details provided.

Return ONLY the cover letter text as a plain string value in JSON: { "coverLetter": "..." }`;

    const result = await generateJSON(
      "You are a professional cover letter writer. Write a compelling, personalized cover letter for the following internship application.",
      prompt,
      { model: MODELS.FAST, temperature: 0.3 },
      {
        coverLetter: ""
      }
    );

    const data = result && typeof result === "object" ? result : {};

    res.json({
      success: true,
      coverLetter: (data as any).coverLetter || "",
    });
  } catch (error) {
    handleRouteError(res, error, "Internship.coverLetter", "Failed to generate cover letter");
  }
});

export { internshipRouter };
