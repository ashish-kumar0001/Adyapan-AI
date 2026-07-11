import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });

async function runTest() {
  const apiKey = process.env.GEMINI_API_KEY || "";
  console.log("Using API Key:", apiKey);
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Say hello!");
    console.log("Gemini SDK Response:", result.response.text());
  } catch (error: any) {
    console.error("Gemini SDK Error:", error.message || error);
  }
}

runTest();
