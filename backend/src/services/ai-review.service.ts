import { prisma as masterPrisma } from "../config/prisma";
import { generateJSON, MODELS } from "../lib/ai/openrouter";

export interface CodeReviewOutput {
  summary: string;
  strengths: string[];
  issues: string[];
  optimizations: string[];
  edge_cases: string[];
  interview_feedback: string;
  overall_score: number;
  interview_readiness: {
    interview_ready: boolean;
    score: number;
    follow_ups: string[];
    improvements: string[];
  };
  code_quality_score: {
    readability: number;
    structure: number;
    naming: number;
    complexity: number;
    correctness: number;
    score: number;
  };
  line_level_feedback: Array<{
    line_number: number;
    code_line: string;
    feedback: string;
  }>;
  error_review: {
    error_type: string;
    message: string;
    cause: string;
    suggested_fix: string;
  };
  learning_insights: {
    concepts_used: string[];
    concepts_missing: string[];
    alternative_approaches: string[];
    recommended_next_topics: string[];
    ai_coach_guidance: string;
  };
  recommendations: {
    related_problems: string[];
    harder_problems: string[];
    easier_problems: string[];
    interview_variants: string[];
  };
}

export class AIReviewService {
  static async generateReview(
    userPrisma: any,
    userId: string,
    questionId: string,
    code: string,
    language: string,
    reviewMode: string
  ): Promise<any> {
    // 1. Fetch the question details
    const question = await masterPrisma.codingQuestion.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      throw new Error(`Coding question with ID ${questionId} not found.`);
    }

    // 2. Fetch the last execution history of the user for context
    const lastExecution = await userPrisma.codeExecution.findFirst({
      where: { userId, questionId },
      orderBy: { createdAt: "desc" }
    });

    // 3. Define fallback structure for safety
    const fallback: CodeReviewOutput = {
      summary: "Your solution has been reviewed. Here are the core insights.",
      strengths: ["Logic implemented correctly"],
      issues: ["Room for modularity"],
      optimizations: ["Consider checking for smaller constant factors"],
      edge_cases: ["Empty arrays and negative values should be tested"],
      interview_feedback: "Ready for practice. Practice explaining the complexity.",
      overall_score: 75,
      interview_readiness: {
        interview_ready: false,
        score: 70,
        follow_ups: ["Can you solve this in O(1) space?"],
        improvements: ["Optimize storage and handle null pointers"]
      },
      code_quality_score: {
        readability: 70,
        structure: 75,
        naming: 80,
        complexity: 70,
        correctness: 80,
        score: 75
      },
      line_level_feedback: [],
      error_review: {
        error_type: "None",
        message: "",
        cause: "",
        suggested_fix: ""
      },
      learning_insights: {
        concepts_used: [question.topic],
        concepts_missing: [],
        alternative_approaches: ["Brute-force approach"],
        recommended_next_topics: ["Optimized search"],
        ai_coach_guidance: "Keep practicing! You are making steady progress."
      },
      recommendations: {
        related_problems: [question.title],
        harder_problems: [],
        easier_problems: [],
        interview_variants: []
      }
    };

    // 4. Build prompt instructions based on reviewMode
    let modeFocus = "";
    if (reviewMode === "beginner") {
      modeFocus = `
Review Mode Focus: BEGINNER CODE REVIEW
- Prioritize understanding, readability, basic coding conventions, and syntax.
- Identify common beginners' bugs, redundancies, or complex constructs that can be simplified.
- Keep the tone warm, highly educational, and encouraging.
`;
    } else if (reviewMode === "interview") {
      modeFocus = `
Review Mode Focus: TECHNICAL INTERVIEW PREPARATION (FAANG Style)
- Focus heavily on optimization, time/space complexity, and scalability.
- Evaluate edge cases and readiness for high-bar technical interviews.
- Provide typical follow-up questions and potential improvements an interviewer would ask for.
`;
    } else if (reviewMode === "competitive") {
      modeFocus = `
Review Mode Focus: COMPETITIVE PROGRAMMING
- Emphasize efficiency, constant-factor speedups, and corner case testing.
- Evaluate boundary limits (e.g. extremely large or small inputs).
- Recommend shortcuts, optimized standard libraries, and optimal time-limit techniques.
`;
    } else {
      // professional
      modeFocus = `
Review Mode Focus: PROFESSIONAL CLEAN CODE & BEST PRACTICES
- Evaluate clean code principles, modularity, maintainability, formatting, naming conventions, and code smell identification.
- Suggest abstractions or refactoring patterns where appropriate.
`;
    }

    const systemPrompt = `You are a Senior Software Engineer, Technical Interviewer, and Competitive Programming Coach.
Analyze the provided code and execution logs for the given problem. Evaluate: Correctness, Readability, Performance, Maintainability, Interview Readiness, and Edge Cases.
Teach the student how to improve. Support their learning journey.

You MUST respond with valid JSON matching this schema:
{
  "summary": "Concise paragraph executive summary of the review",
  "strengths": ["list of positive aspects of their code"],
  "issues": ["list of issues, bugs, logic errors, or clean code violations"],
  "optimizations": ["specific time/space optimizations with Big-O impact, e.g. change O(N^2) to O(N) using a Hash Map"],
  "edge_cases": ["tested/potential corner input scenarios, e.g. empty array, single element, large inputs"],
  "interview_feedback": "Paragraph evaluation of technical communication, approach, and interview perspective",
  "overall_score": 85, // number from 0 to 100 representing overall assessment
  "interview_readiness": {
    "interview_ready": true, // boolean
    "score": 80, // score out of 100 for interview readiness
    "follow_ups": ["questions an interviewer would ask after seeing this solution"],
    "improvements": ["things needed to make this solution perfect for a FAANG interview"]
  },
  "code_quality_score": {
    "readability": 85, // subscore 0-100
    "structure": 90, // subscore 0-100
    "naming": 80, // subscore 0-100
    "complexity": 75, // subscore 0-100
    "correctness": 95, // subscore 0-100
    "score": 85 // weighted average overall code quality score (0-100)
  },
  "line_level_feedback": [
    {
      "line_number": 5, // 1-based line number of the code where the issue resides. Make sure it matches the exact line of user code snippet!
      "code_line": "snippet of the code line (e.g. for i in range(len(nums)):)",
      "feedback": "specific feedback or recommended optimization for this line"
    }
  ],
  "error_review": {
    "error_type": "None | Compilation Error | Runtime Error", // identify if the execution had compile/runtime issues
    "message": "raw error message or summary",
    "cause": "educational explanation of why this error occurred",
    "suggested_fix": "exact instructions on how to patch the bug"
  },
  "learning_insights": {
    "concepts_used": ["algorithms/data structures implemented by student"],
    "concepts_missing": ["concepts that would make the solution cleaner or faster"],
    "alternative_approaches": ["other paradigms to solve this, e.g. sliding window, two pointer, dynamic programming"],
    "recommended_next_topics": ["what topics the student should learn next"],
    "ai_coach_guidance": "Direct advice from the coach to the student (supporting, encouraging, motivating)"
  },
  "recommendations": {
    "related_problems": ["related coding topics/problems"],
    "harder_problems": ["next tier challenge questions"],
    "easier_problems": ["scaffolding questions if they struggled"],
    "interview_variants": ["interview variations of this question"]
  }
}
`;

    let executionContext = "No code executions found yet.";
    if (lastExecution) {
      executionContext = `
Execution Status: ${lastExecution.status}
Execution Time: ${lastExecution.executionTime}s
STDOUT: ${lastExecution.stdout || "(empty)"}
STDERR/Compilation Logs: ${lastExecution.stderr || "(empty)"}
`;
    }

    const userPrompt = `
Problem Details:
Title: ${question.title}
Topic: ${question.topic}
Difficulty: ${question.difficulty}
Rating: ${question.rating || "N/A"}
Tags: ${JSON.stringify(question.tagsJson)}

${modeFocus}

Student Code (${language}):
\`\`\`${language}
${code}
\`\`\`

Last Code Execution Details:
${executionContext}

Please analyze this solution, run edge case simulations, and generate the final code review in the requested JSON format.
`;

    try {
      const generated = await generateJSON<CodeReviewOutput>(
        systemPrompt,
        userPrompt,
        { model: MODELS.CODE, temperature: 0.6, maxTokens: 4000 },
        fallback
      );

      // Clean up line numbers in case LLM returned floats or invalid ranges
      if (generated.line_level_feedback && Array.isArray(generated.line_level_feedback)) {
        generated.line_level_feedback = generated.line_level_feedback.map(item => ({
          ...item,
          line_number: Math.max(1, Math.round(Number(item.line_number) || 1))
        }));
      }

      return generated;
    } catch (err: any) {
      console.error("[AIReviewService] Error generating review:", err.message || err);
      return fallback;
    }
  }
}
