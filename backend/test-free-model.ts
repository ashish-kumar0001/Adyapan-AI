import { generateJSON } from "./src/lib/ai/openrouter";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });

async function runTest() {
  console.log("Calling generateJSON with a free OpenRouter model...");
  const systemPrompt = "You are a helpful assistant.";
  const userPrompt = "Generate a JSON with a single key 'hello' having value 'world'.";
  
  try {
    const result = await generateJSON(
      systemPrompt,
      userPrompt,
      { model: "google/gemini-2.5-flash:free", maxTokens: 8000 },
      null
    );
    console.log("Result (google/gemini-2.5-flash:free):", result);
  } catch (error) {
    console.error("Failed to generate JSON:", error);
  }
}

runTest();
