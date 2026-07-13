import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generateCode, debugCode, explainCode, generateProject } from "../lib/ai/coding";
import { getUserPrismaFromRequest } from "../utils/prisma";
import { handleRouteError } from "../utils/routeError";
import { prisma as masterPrisma } from "../config/prisma";
import { CodeforcesService } from "../services/codeforces.service";
import { AICodingService } from "../services/ai-coding.service";

const router = Router();
router.use(requireAuth);

// ─── Existing AI Code Helper Routes ──────────────────────────────────────────

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

// ─── Day 11 DSA Question Bank Routes ──────────────────────────────────────────

// Sync Codeforces Problems (manual or triggered)
router.post("/sync-codeforces", async (req, res) => {
  try {
    const syncResult = await CodeforcesService.syncProblems();
    res.json(syncResult);
  } catch (error) {
    handleRouteError(res, error, "Coding.syncCodeforces", "Failed to sync Codeforces problems");
  }
});

// Get Coding Dashboard Statistics & Data
router.get("/dashboard", async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const userPrisma = await getUserPrismaFromRequest(req);

    // 1. Fetch user progress records
    const userProgress = await userPrisma.userQuestionProgress.findMany({
      where: { userId }
    });

    const progressMap = new Map(userProgress.map((p: any) => [p.questionId, p]));

    // 2. Fetch global statistics from Master DB
    const totalQuestions = await masterPrisma.codingQuestion.count();
    
    // Solved & Attempted & Bookmarks from user progress
    const solvedCount = userProgress.filter((p: any) => p.status === "solved").length;
    const attemptedCount = userProgress.filter((p: any) => p.status === "attempted" || p.status === "solved").length;
    const bookmarkedCount = userProgress.filter((p: any) => p.bookmarked).length;

    // 3. Topic Explorer metrics
    // Fetch all global questions
    const globalQuestions = await masterPrisma.codingQuestion.findMany({
      select: { id: true, topic: true, difficulty: true }
    });

    const topics = [
      "Arrays", "Strings", "Hashing", "Linked Lists", "Stacks", "Queues",
      "Trees", "Binary Trees", "BST", "Heaps", "Recursion", "Backtracking",
      "Greedy", "Dynamic Programming", "Graphs", "Tries", "Sliding Window",
      "Two Pointers", "Bit Manipulation"
    ];

    // Compute metrics per topic
    const topicExplorer = topics.map(topicName => {
      const topicQuestions = globalQuestions.filter(q => q.topic === topicName);
      const totalQ = topicQuestions.length;
      
      const solvedQ = topicQuestions.filter(q => (progressMap.get(q.id) as any)?.status === "solved").length;
      const completionPercentage = totalQ > 0 ? Math.round((solvedQ / totalQ) * 100) : 0;

      // Difficulty distribution
      const difficultyDist = { Easy: 0, Medium: 0, Hard: 0, Expert: 0 };
      topicQuestions.forEach(q => {
        const diff = q.difficulty as keyof typeof difficultyDist;
        if (diff in difficultyDist) {
          difficultyDist[diff]++;
        } else {
          difficultyDist["Easy"]++;
        }
      });

      return {
        topicName,
        questionCount: totalQ,
        solvedCount: solvedQ,
        completionPercentage,
        difficultyDistribution: difficultyDist
      };
    });

    // 4. Daily Challenge (get or resolve)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let daily = await masterPrisma.dailyChallenge.findFirst({
      where: {
        challengeDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: { question: true }
    });

    if (!daily && totalQuestions > 0) {
      const skip = Math.floor(Math.random() * totalQuestions);
      const randomQ = await masterPrisma.codingQuestion.findMany({
        take: 1,
        skip
      });
      if (randomQ.length > 0) {
        daily = await masterPrisma.dailyChallenge.create({
          data: {
            questionId: randomQ[0].id,
            challengeDate: today
          },
          include: { question: true }
        });
      }
    }

    let dailyProgress = null;
    if (daily) {
      dailyProgress = progressMap.get(daily.questionId) || null;
    }

    // 5. Recent Activity
    const recentProgress = userProgress
      .sort((a: any, b: any) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5);

    let recentActivity: any[] = [];
    if (recentProgress.length > 0) {
      const recentQuestions = await masterPrisma.codingQuestion.findMany({
        where: { id: { in: recentProgress.map((rp: any) => rp.questionId) } }
      });

      const recentQuestionsMap = new Map(recentQuestions.map(q => [q.id, q]));
      recentActivity = recentProgress.map((rp: any) => {
        const q: any = recentQuestionsMap.get(rp.questionId);
        return {
          questionId: rp.questionId,
          title: q ? q.title : "Unknown Problem",
          difficulty: q ? q.difficulty : "Easy",
          topic: q ? q.topic : "Arrays",
          status: rp.status,
          bookmarked: rp.bookmarked,
          updatedAt: rp.updatedAt
        };
      });
    }

    // 6. AI Recommendations
    let recommendedQuestions: any[] = [];
    const startedTopics = topicExplorer.filter(t => t.solvedCount > 0 && t.completionPercentage < 100);
    
    let targetTopic = "Arrays";
    let targetDifficulty = "Easy";
    let message = "Let's build your foundation in Arrays.";

    if (startedTopics.length > 0) {
      const lowest = startedTopics.sort((a, b) => a.completionPercentage - b.completionPercentage)[0];
      targetTopic = lowest.topicName;
      targetDifficulty = lowest.completionPercentage >= 50 ? "Medium" : "Easy";
      message = `You solved ${lowest.solvedCount} problems in ${lowest.topicName}. Next recommendation in this topic:`;
    } else {
      const unstarted = topicExplorer.find(t => t.questionCount > 0 && t.solvedCount === 0);
      if (unstarted) {
        targetTopic = unstarted.topicName;
        targetDifficulty = "Easy";
        message = `Start learning your next topic: ${unstarted.topicName}.`;
      }
    }

    recommendedQuestions = await masterPrisma.codingQuestion.findMany({
      where: {
        topic: targetTopic,
        difficulty: targetDifficulty,
        id: { notIn: userProgress.filter((p: any) => p.status === "solved").map((p: any) => p.questionId) }
      },
      take: 3
    });

    if (recommendedQuestions.length === 0) {
      recommendedQuestions = await masterPrisma.codingQuestion.findMany({
        take: 3
      });
    }

    const aiRecommendations = {
      message,
      topic: targetTopic,
      difficulty: targetDifficulty,
      questions: recommendedQuestions
    };

    res.json({
      stats: {
        questionsAvailable: totalQuestions,
        topicsCovered: new Set(globalQuestions.map(q => q.topic)).size,
        solved: solvedCount,
        attempted: attemptedCount,
        bookmarks: bookmarkedCount
      },
      topicExplorer,
      dailyChallenge: daily ? {
        ...daily.question,
        progress: dailyProgress
      } : null,
      recentActivity,
      aiRecommendations
    });
  } catch (error) {
    handleRouteError(res, error, "Coding.dashboard", "Failed to fetch coding dashboard data");
  }
});

// Get Paginated & Filtered DSA Questions
router.get("/questions", async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { topic, difficulty, rating, status, bookmarked, search, limit = 50, page = 1 } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 50;
    const skip = (pageNum - 1) * limitNum;

    // Build filters for CodingQuestion
    const whereClause: any = {};
    if (topic) whereClause.topic = topic as string;
    if (difficulty) whereClause.difficulty = difficulty as string;
    if (rating) {
      const rVal = parseInt(rating as string);
      if (!isNaN(rVal)) {
        whereClause.rating = rVal;
      }
    }
    if (search) {
      whereClause.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { externalId: { contains: search as string, mode: "insensitive" } }
      ];
    }

    // Fetch user progress filters
    const userPrisma = await getUserPrismaFromRequest(req);
    const userProgress = await userPrisma.userQuestionProgress.findMany({
      where: { userId }
    });

    const progressMap = new Map(userProgress.map((p: any) => [p.questionId, p]));

    // Retrieve questions matching criteria
    const questions = await masterPrisma.codingQuestion.findMany({
      where: whereClause,
      orderBy: { rating: 'asc' }
    });

    let mappedQuestions = questions.map((q: any) => {
      const p: any = progressMap.get(q.id);
      return {
        ...q,
        progress: {
          status: p ? p.status : "unsolved",
          viewed: p ? p.viewed : false,
          attempted: p ? p.attempted : false,
          solved: p ? p.solved : false,
          bookmarked: p ? p.bookmarked : false,
          timeSpent: p ? p.timeSpent : 0
        }
      };
    });

    // Apply client-side filters for progress status if requested (status / bookmarked)
    if (status) {
      mappedQuestions = mappedQuestions.filter(q => q.progress.status === status);
    }
    if (bookmarked === "true") {
      mappedQuestions = mappedQuestions.filter(q => q.progress.bookmarked === true);
    }

    // Paginate in-memory after joining progress (since status filter depends on user DB)
    const totalCount = mappedQuestions.length;
    const paginated = mappedQuestions.slice(skip, skip + limitNum);

    res.json({
      questions: paginated,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    handleRouteError(res, error, "Coding.questions", "Failed to fetch questions");
  }
});

// Get Single Question Details + User Progress + AI Explanation
router.get("/question/:id", async (req: any, res) => {
  try {
    const questionId = req.params.id;
    const userId = req.user.userId;

    const question = await masterPrisma.codingQuestion.findUnique({
      where: { id: questionId },
      include: { aiAnalyses: { take: 1, orderBy: { generatedAt: 'desc' } } }
    });

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    const userPrisma = await getUserPrismaFromRequest(req);
    
    // Mark viewed as true when fetched
    const progress = await userPrisma.userQuestionProgress.upsert({
      where: { userId_questionId: { userId, questionId } },
      update: { viewed: true },
      create: { userId, questionId, viewed: true }
    });

    res.json({
      question,
      progress: {
        status: progress.status,
        viewed: progress.viewed,
        attempted: progress.attempted,
        solved: progress.solved,
        bookmarked: progress.bookmarked,
        timeSpent: progress.timeSpent
      },
      aiAnalysis: question.aiAnalyses[0] ? question.aiAnalyses[0].explanationJson : null
    });
  } catch (error) {
    handleRouteError(res, error, "Coding.questionDetails", "Failed to get question details");
  }
});

// Bookmark/Unbookmark Question
router.post("/question/:id/bookmark", async (req: any, res) => {
  try {
    const questionId = req.params.id;
    const userId = req.user.userId;
    const { bookmarked } = req.body;

    const userPrisma = await getUserPrismaFromRequest(req);
    const progress = await userPrisma.userQuestionProgress.upsert({
      where: { userId_questionId: { userId, questionId } },
      update: { bookmarked: !!bookmarked },
      create: { userId, questionId, bookmarked: !!bookmarked }
    });

    res.json({ success: true, progress });
  } catch (error) {
    handleRouteError(res, error, "Coding.bookmark", "Failed to toggle bookmark");
  }
});

// Mark Question as Attempted
router.post("/question/:id/attempt", async (req: any, res) => {
  try {
    const questionId = req.params.id;
    const userId = req.user.userId;
    const { timeSpent = 0 } = req.body;

    const userPrisma = await getUserPrismaFromRequest(req);
    
    // Fetch current progress first to ensure we don't downgrade "solved" status to "attempted"
    const current = await userPrisma.userQuestionProgress.findUnique({
      where: { userId_questionId: { userId, questionId } }
    });

    const isAlreadySolved = current?.status === "solved";

    const progress = await userPrisma.userQuestionProgress.upsert({
      where: { userId_questionId: { userId, questionId } },
      update: {
        attempted: true,
        status: isAlreadySolved ? "solved" : "attempted",
        timeSpent: { increment: timeSpent }
      },
      create: {
        userId,
        questionId,
        attempted: true,
        status: "attempted",
        timeSpent
      }
    });

    res.json({ success: true, progress });
  } catch (error) {
    handleRouteError(res, error, "Coding.attempt", "Failed to mark attempted");
  }
});

// Mark Question as Solved
router.post("/question/:id/solve", async (req: any, res) => {
  try {
    const questionId = req.params.id;
    const userId = req.user.userId;
    const { timeSpent = 0 } = req.body;

    const userPrisma = await getUserPrismaFromRequest(req);
    const progress = await userPrisma.userQuestionProgress.upsert({
      where: { userId_questionId: { userId, questionId } },
      update: {
        solved: true,
        status: "solved",
        timeSpent: { increment: timeSpent }
      },
      create: {
        userId,
        questionId,
        solved: true,
        status: "solved",
        timeSpent
      }
    });

    res.json({ success: true, progress });
  } catch (error) {
    handleRouteError(res, error, "Coding.solve", "Failed to mark solved");
  }
});

// Generate or Fetch AI Analysis
router.post("/question/:id/analyze", async (req, res) => {
  try {
    const questionId = req.params.id;
    const analysis = await AICodingService.getAnalysis(questionId);
    res.json({ success: true, analysis });
  } catch (error) {
    handleRouteError(res, error, "Coding.analyze", "Failed to generate AI analysis");
  }
});

// Get Daily Challenge Question
router.get("/daily-challenge", async (req: any, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let daily = await masterPrisma.dailyChallenge.findFirst({
      where: {
        challengeDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: { question: true }
    });

    if (!daily) {
      const count = await masterPrisma.codingQuestion.count();
      if (count === 0) {
        return res.status(404).json({ error: "No questions available. Please sync repository." });
      }
      const skip = Math.floor(Math.random() * count);
      const randomQ = await masterPrisma.codingQuestion.findMany({
        take: 1,
        skip: skip
      });

      if (randomQ.length > 0) {
        daily = await masterPrisma.dailyChallenge.create({
          data: {
            questionId: randomQ[0].id,
            challengeDate: today
          },
          include: { question: true }
        });
      }
    }

    let progress = null;
    if (daily) {
      const userPrisma = await getUserPrismaFromRequest(req);
      progress = await userPrisma.userQuestionProgress.findFirst({
        where: {
          userId: req.user.userId,
          questionId: daily.questionId
        }
      });
    }

    res.json({
      challenge: daily ? daily.question : null,
      progress
    });
  } catch (error) {
    handleRouteError(res, error, "Coding.dailyChallenge", "Failed to fetch daily challenge");
  }
});

export const codingRouter = router;
