import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });

async function runTest() {
  const apiKey = process.env.GEMINI_API_KEY || "";
  console.log("Using API Key:", apiKey);
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const models = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
  ];

  for (const modelName of models) {
    console.log(`\nTesting SDK with model: ${modelName}`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say hello!");
      console.log(`Success with ${modelName}:`, result.response.text().trim());
    } catch (error: any) {
      console.error(`Error with ${modelName}:`, error.message || error);
    }
  }
}

runTest();
