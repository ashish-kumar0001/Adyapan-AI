import { generateJSON } from "./src/lib/ai/openrouter";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });
import { env } from "./src/config/env";

const mockText = `Short content.`;

async function runTest() {
  const prompt = "Explain recursion in 1 sentence.";

  console.log("Calling generateJSON first time with google/gemini-2.5-flash...");
  try {
    const analysis = await generateJSON(
      "You are a helpful tutor.",
      prompt,
      { model: "google/gemini-2.5-flash", maxTokens: 16000 },
      null
    );
    console.log("Analysis Result 1:", analysis);
  } catch (error) {
    console.error("Error in generateJSON 1:", error);
  }
}

runTest();
