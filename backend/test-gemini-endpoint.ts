import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });

async function runTest() {
  const apiKey = process.env.GEMINI_API_KEY || "";
  console.log("Using API Key:", apiKey);

  const urls = [
    "https://generativelanguage.googleapis.com/v1beta/chat/completions",
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
  ];

  for (const url of urls) {
    console.log(`\nTesting URL: ${url}`);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: "Say hello!" }
          ],
          temperature: 0.7,
          max_tokens: 100
        }),
      });

      const data = await res.json() as any;
      console.log("Status:", res.status);
      console.log("Response:", JSON.stringify(data).slice(0, 500));
    } catch (err: any) {
      console.error("Fetch Error:", err.message || err);
    }
  }
}

runTest();
