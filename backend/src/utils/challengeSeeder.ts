import { prisma as masterPrisma } from "../config/prisma";

interface SeedQuestion {
  externalId: string;
  source: string;
  title: string;
  problemUrl: string;
  difficulty: string;
  topic: string;
  tagsJson: any;
  placementImportance: boolean;
  interviewImportance: boolean;
}

const DEFAULT_QUESTIONS: SeedQuestion[] = [
  {
    externalId: "two-sum",
    source: "LeetCode",
    title: "Two Sum",
    problemUrl: "https://leetcode.com/problems/two-sum/",
    difficulty: "Easy",
    topic: "Arrays",
    tagsJson: ["arrays", "hash-table"],
    placementImportance: true,
    interviewImportance: true,
  },
  {
    externalId: "valid-parentheses",
    source: "LeetCode",
    title: "Valid Parentheses",
    problemUrl: "https://leetcode.com/problems/valid-parentheses/",
    difficulty: "Easy",
    topic: "Stacks",
    tagsJson: ["stacks", "strings"],
    placementImportance: true,
    interviewImportance: true,
  },
  {
    externalId: "longest-substring",
    source: "LeetCode",
    title: "Longest Substring Without Repeating Characters",
    problemUrl: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    difficulty: "Medium",
    topic: "Sliding Window",
    tagsJson: ["sliding-window", "strings", "hash-table"],
    placementImportance: true,
    interviewImportance: true,
  },
  {
    externalId: "merge-intervals",
    source: "LeetCode",
    title: "Merge Intervals",
    problemUrl: "https://leetcode.com/problems/merge-intervals/",
    difficulty: "Medium",
    topic: "Arrays",
    tagsJson: ["arrays", "sorting"],
    placementImportance: true,
    interviewImportance: true,
  },
  {
    externalId: "climbing-stairs",
    source: "LeetCode",
    title: "Climbing Stairs",
    problemUrl: "https://leetcode.com/problems/climbing-stairs/",
    difficulty: "Easy",
    topic: "Dynamic Programming",
    tagsJson: ["dynamic-programming", "recursion"],
    placementImportance: true,
    interviewImportance: true,
  },
  {
    externalId: "course-schedule",
    source: "LeetCode",
    title: "Course Schedule",
    problemUrl: "https://leetcode.com/problems/course-schedule/",
    difficulty: "Medium",
    topic: "Graphs",
    tagsJson: ["graphs", "dfs", "bfs", "topological-sort"],
    placementImportance: true,
    interviewImportance: true,
  },
  {
    externalId: "binary-tree-inorder",
    source: "LeetCode",
    title: "Binary Tree Inorder Traversal",
    problemUrl: "https://leetcode.com/problems/binary-tree-inorder-traversal/",
    difficulty: "Easy",
    topic: "Trees",
    tagsJson: ["trees", "recursion", "dfs"],
    placementImportance: false,
    interviewImportance: true,
  },
  {
    externalId: "validate-bst",
    source: "LeetCode",
    title: "Validate Binary Search Tree",
    problemUrl: "https://leetcode.com/problems/validate-binary-search-tree/",
    difficulty: "Medium",
    topic: "BST",
    tagsJson: ["trees", "bst", "dfs"],
    placementImportance: true,
    interviewImportance: true,
  },
  {
    externalId: "reverse-linked-list",
    source: "LeetCode",
    title: "Reverse Linked List",
    problemUrl: "https://leetcode.com/problems/reverse-linked-list/",
    difficulty: "Easy",
    topic: "Linked Lists",
    tagsJson: ["linked-lists", "recursion"],
    placementImportance: true,
    interviewImportance: true,
  },
  {
    externalId: "container-water",
    source: "LeetCode",
    title: "Container With Most Water",
    problemUrl: "https://leetcode.com/problems/container-with-most-water/",
    difficulty: "Medium",
    topic: "Two Pointers",
    tagsJson: ["arrays", "two-pointers"],
    placementImportance: true,
    interviewImportance: true,
  },
];

export async function seedChallengesIfNeeded() {
  try {
    const challengeCount = await masterPrisma.codingChallenge.count();
    if (challengeCount > 0) {
      console.log(`[ChallengeSeeder] Challenges already seeded: ${challengeCount} challenges found.`);
      return;
    }

    console.log("[ChallengeSeeder] Seeding questions first if needed...");
    const dbQuestionCount = await masterPrisma.codingQuestion.count();
    
    // Seed questions if DB has few questions
    if (dbQuestionCount < 5) {
      for (const q of DEFAULT_QUESTIONS) {
        await masterPrisma.codingQuestion.upsert({
          where: { externalId: q.externalId },
          update: {},
          create: {
            externalId: q.externalId,
            source: q.source,
            title: q.title,
            problemUrl: q.problemUrl,
            difficulty: q.difficulty,
            topic: q.topic,
            tagsJson: q.tagsJson,
            placementImportance: q.placementImportance,
            interviewImportance: q.interviewImportance,
          },
        });
      }
      console.log("[ChallengeSeeder] Questions seeded successfully.");
    }

    // Retrieve all seeded coding questions
    const questions = await masterPrisma.codingQuestion.findMany();
    const findQuestionId = (extId: string): string => {
      const q = questions.find((item) => item.externalId === extId);
      return q ? q.id : questions[0].id;
    };

    console.log("[ChallengeSeeder] Seeding challenges...");

    // 1. Daily Challenge
    const dailyChallenge = await masterPrisma.codingChallenge.create({
      data: {
        title: "Daily Arrays Warmup",
        challengeType: "daily",
        description: "Kickstart your day with a standard arrays optimization challenge. Perfect for keeping your streak alive!",
        difficulty: "Easy",
        xpReward: 30, // 10 XP base + 20 XP bonus
      },
    });

    await masterPrisma.challengeQuestion.create({
      data: {
        challengeId: dailyChallenge.id,
        questionId: findQuestionId("two-sum"),
        orderIndex: 0,
      },
    });

    // 2. Weekly Challenge
    const weeklyChallenge = await masterPrisma.codingChallenge.create({
      data: {
        title: "Weekly DSA Sprint (Week 1)",
        challengeType: "weekly",
        description: "Solve a selected set of 5 core questions covering Arrays, Stacks, Sliding Window, and Linked Lists to build critical thinking.",
        difficulty: "Medium",
        xpReward: 150,
      },
    });

    const weeklyExtIds = ["two-sum", "valid-parentheses", "longest-substring", "reverse-linked-list", "container-water"];
    for (let i = 0; i < weeklyExtIds.length; i++) {
      await masterPrisma.challengeQuestion.create({
        data: {
          challengeId: weeklyChallenge.id,
          questionId: findQuestionId(weeklyExtIds[i]),
          orderIndex: i,
        },
      });
    }

    // 3. Topic Challenge: DP
    const dpChallenge = await masterPrisma.codingChallenge.create({
      data: {
        title: "Dynamic Programming Foundations",
        challengeType: "topic",
        description: "Understand recursion, memoization, and tabulations. This challenge contains foundational problems to master DP principles.",
        difficulty: "Medium",
        xpReward: 80,
      },
    });

    await masterPrisma.challengeQuestion.create({
      data: {
        challengeId: dpChallenge.id,
        questionId: findQuestionId("climbing-stairs"),
        orderIndex: 0,
      },
    });

    // 4. Topic Challenge: Trees
    const treesChallenge = await masterPrisma.codingChallenge.create({
      data: {
        title: "Tree Traversals & BST Verification",
        challengeType: "topic",
        description: "Explore recursive structures, binary tree traversal orders, and strict boundary validation rules for Binary Search Trees.",
        difficulty: "Medium",
        xpReward: 90,
      },
    });

    await masterPrisma.challengeQuestion.create({
      data: {
        challengeId: treesChallenge.id,
        questionId: findQuestionId("binary-tree-inorder"),
        orderIndex: 0,
      },
    });
    await masterPrisma.challengeQuestion.create({
      data: {
        challengeId: treesChallenge.id,
        questionId: findQuestionId("validate-bst"),
        orderIndex: 1,
      },
    });

    // 5. Placement Challenge: Amazon
    const amazonChallenge = await masterPrisma.codingChallenge.create({
      data: {
        title: "Amazon Placement Readiness",
        challengeType: "placement",
        description: "Amazon online assessments heavily test HashMaps, Two-Pointers, and Sliding Window approaches. Prepare with these past assessment questions.",
        difficulty: "Medium",
        xpReward: 120,
      },
    });

    const amazonExtIds = ["two-sum", "longest-substring", "container-water"];
    for (let i = 0; i < amazonExtIds.length; i++) {
      await masterPrisma.challengeQuestion.create({
        data: {
          challengeId: amazonChallenge.id,
          questionId: findQuestionId(amazonExtIds[i]),
          orderIndex: i,
        },
      });
    }

    // 6. Placement Challenge: Google
    const googleChallenge = await masterPrisma.codingChallenge.create({
      data: {
        title: "Google Elite Coding Challenge",
        challengeType: "placement",
        description: "Crack Google's coding rounds. This challenge tests complex data structure traversal methods and topological ordering techniques on graph networks.",
        difficulty: "Hard",
        xpReward: 160,
      },
    });

    const googleExtIds = ["course-schedule", "validate-bst"];
    for (let i = 0; i < googleExtIds.length; i++) {
      await masterPrisma.challengeQuestion.create({
        data: {
          challengeId: googleChallenge.id,
          questionId: findQuestionId(googleExtIds[i]),
          orderIndex: i,
        },
      });
    }

    console.log("[ChallengeSeeder] Challenges seeded successfully!");
  } catch (error) {
    console.error("[ChallengeSeeder] Error during seeding challenges:", error);
  }
}
