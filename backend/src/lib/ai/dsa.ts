import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";

const genAI = new GoogleGenerativeAI(env.geminiApiKey);

function getGeminiModel() {
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

// Helper for structured JSON output
async function parseGeminiJson(prompt: string, fallback: any = {}) {
  try {
    const model = getGeminiModel();
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });
    const text = response.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini JSON Generation Error:", error);
    return fallback;
  }
}

export async function generateDsaHint(problemContext: string, currentCode: string) {
  const aiPrompt = `
    You are an expert Competitive Programmer mentoring a student.
    
    Problem:
    ${problemContext}
    
    Student's Current Code:
    ${currentCode}

    The student is stuck and asked for a hint. DO NOT give them the full solution. 
    Instead, provide 2 progressively helpful hints and a high-level conceptual approach.

    You MUST return the output as a JSON object strictly matching this schema:
    {
      "hint1": "A subtle hint to point them in the right direction",
      "hint2": "A more direct hint if they are still stuck",
      "approach": "A high-level explanation of the optimal algorithm to use (no code)"
    }
  `;

  return parseGeminiJson(aiPrompt, {
    hint1: "Error generating hint 1",
    hint2: "Error generating hint 2",
    approach: "Error generating approach",
  });
}

export async function reviewDsaSolution(problemContext: string, code: string) {
  const aiPrompt = `
    You are an expert Competitive Programmer reviewing a student's submission.
    
    Problem:
    ${problemContext}
    
    Submitted Code:
    ${code}

    Analyze the code for correctness, time complexity, and space complexity.
    You MUST return the output as a JSON object strictly matching this schema:
    {
      "timeComplexity": "e.g., O(n log n) with explanation",
      "spaceComplexity": "e.g., O(n) with explanation",
      "optimizationTips": ["Tip 1", "Tip 2", "Tip 3"]
    }
  `;

  return parseGeminiJson(aiPrompt, {
    timeComplexity: "Unknown",
    spaceComplexity: "Unknown",
    optimizationTips: [],
  });
}
