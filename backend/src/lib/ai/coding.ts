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

export async function generateCode(prompt: string) {
  const aiPrompt = `
    You are an expert Senior Software Engineer. The user is asking for code generation.
    Generate a complete, production-ready solution for the following request: "${prompt}"

    You MUST return the output as a JSON object strictly matching this schema:
    {
      "setupGuide": "Step by step instructions to run this code (in markdown)",
      "folderStructure": "A visual tree of the folder structure (in markdown)",
      "code": "The complete source code implementation (in markdown with codeblocks)"
    }
  `;

  return parseGeminiJson(aiPrompt, {
    setupGuide: "An error occurred generating the setup guide.",
    folderStructure: "Error",
    code: "Error generating code.",
  });
}

export async function debugCode(errorMsg: string, codeSnippet: string) {
  const aiPrompt = `
    You are an expert Senior Software Engineer. The user needs help debugging code.
    
    Error Message:
    ${errorMsg}
    
    Code Snippet:
    ${codeSnippet}

    Analyze the error and the code. You MUST return the output as a JSON object strictly matching this schema:
    {
      "issue": "A short summary of what the issue is",
      "rootCause": "Detailed explanation of why the error occurred",
      "fixedCode": "The corrected code (in markdown with codeblocks)"
    }
  `;

  return parseGeminiJson(aiPrompt, {
    issue: "Could not parse issue",
    rootCause: "Could not parse root cause",
    fixedCode: "Could not generate fixed code",
  });
}

export async function explainCode(codeSnippet: string) {
  const aiPrompt = `
    You are an expert Programming Instructor. The user wants you to explain a piece of code.
    
    Code Snippet:
    ${codeSnippet}

    Provide a highly detailed, line-by-line breakdown.
    You MUST return the output as a JSON object strictly matching this schema:
    {
      "explanation": "A detailed, line-by-line explanation of the code (in markdown)",
      "complexity": "Time and Space complexity (if applicable)"
    }
  `;

  return parseGeminiJson(aiPrompt, {
    explanation: "Could not generate explanation.",
    complexity: "Unknown",
  });
}

export async function generateProject(projectName: string) {
  const aiPrompt = `
    You are a Software Architect. The user wants to build a project called: "${projectName}"
    
    Design a comprehensive project plan.
    You MUST return the output as a JSON object strictly matching this schema:
    {
      "architecture": "High level system architecture description (in markdown)",
      "techStack": ["List", "of", "technologies"],
      "folderStructure": "Project structure tree (in markdown)",
      "features": ["List", "of", "core", "features"],
      "roadmap": ["Step 1", "Step 2", "Step 3"]
    }
  `;

  return parseGeminiJson(aiPrompt, {
    architecture: "Error generating architecture",
    techStack: [],
    folderStructure: "Error",
    features: [],
    roadmap: [],
  });
}
