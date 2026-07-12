import fs from "fs";
import path from "path";
import crypto from "crypto";

const CACHE_DIR = path.join(process.cwd(), "ai_cache");

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

interface CacheEntry {
  timestamp: number;
  response: string;
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days TTL

function getCacheKey(systemPrompt: string, userPrompt: string, options: any): string {
  const data = JSON.stringify({ systemPrompt, userPrompt, options });
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function getCachedAIResponse(
  systemPrompt: string,
  userPrompt: string,
  options: any
): string | null {
  try {
    const key = getCacheKey(systemPrompt, userPrompt, options);
    const filePath = path.join(CACHE_DIR, `${key}.json`);

    if (fs.existsSync(filePath)) {
      const dataStr = fs.readFileSync(filePath, "utf-8");
      const entry = JSON.parse(dataStr) as CacheEntry;
      
      const age = Date.now() - entry.timestamp;
      if (age < CACHE_TTL_MS) {
        console.log(`[AI Cache] Cache hit for key: ${key}`);
        return entry.response;
      } else {
        console.log(`[AI Cache] Expired cache entry for key: ${key}. Deleting.`);
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    console.error("[AI Cache] Error reading cache file:", error);
  }
  return null;
}

export function setCachedAIResponse(
  systemPrompt: string,
  userPrompt: string,
  options: any,
  response: string
): void {
  try {
    const key = getCacheKey(systemPrompt, userPrompt, options);
    const filePath = path.join(CACHE_DIR, `${key}.json`);

    const entry: CacheEntry = {
      timestamp: Date.now(),
      response,
    };

    fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), "utf-8");
    console.log(`[AI Cache] Saved response to cache: ${key}`);
  } catch (error) {
    console.error("[AI Cache] Error writing cache file:", error);
  }
}
