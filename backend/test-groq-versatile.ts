import { generateJSON } from "./src/lib/ai/openrouter";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });

async function runTest() {
  const prompt = "Explain data structures in 1 sentence.";

  console.log("Calling Groq with llama-3.3-70b-versatile...");
  try {
    const analysis = await generateJSON(
      "You are a computer science tutor.",
      prompt,
      { model: "openai/gpt-4o", maxTokens: 16000 },
      null
    );
    console.log("Analysis Result:", analysis);
  } catch (error) {
    console.error("Error in generateJSON:", error);
  }
}

// Disable OpenRouter for this test
process.env.OPENROUTER_API_KEY = "";

runTest();
