import { env } from "../../config/env";
import { getCachedAIResponse, setCachedAIResponse } from "./aiCache";

export interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OpenRouterOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" | "text" };
}

// Sequential fallback completion engine: Gemini → Groq → OpenRouter
async function callAIRobust(
  messages: OpenRouterMessage[],
  options: OpenRouterOptions
): Promise<string> {
  const providers = [];

  // 1. Add Google Gemini if key exists (primary)
  if (env.geminiApiKey) {
    let geminiModel = "gemini-2.5-flash";
    if (options.model?.includes("gemini")) {
      geminiModel = options.model.split("/").pop() || "gemini-2.5-flash";
    }
    providers.push({
      name: "Gemini",
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      key: env.geminiApiKey,
      model: geminiModel
    });
  }

  // 2. Add Groq if key exists (secondary)
  if (env.groqApiKey) {
    let groqModel = "llama-3.3-70b-versatile";
    const modelLower = options.model?.toLowerCase() ?? "";
    const isMiniOrFast = (modelLower.includes("mini") && !modelLower.includes("gemini")) ||
                         modelLower.includes("fast") ||
                         modelLower.includes("cheap");
    if (isMiniOrFast) {
      groqModel = "llama-3.1-8b-instant";
    }
    providers.push({
      name: "Groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      key: env.groqApiKey,
      model: groqModel
    });
  }

  // 3. Add OpenRouter if key exists (tertiary)
  if (env.openrouterApiKey) {
    providers.push({
      name: "OpenRouter",
      url: "https://openrouter.ai/api/v1/chat/completions",
      key: env.openrouterApiKey,
      model: options.model || "openai/gpt-4o-mini"
    });
  }

  if (providers.length === 0) {
    throw new Error("No AI providers configured. Please check environment keys.");
  }

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      console.log(`[AI Engine] [Fallback] Trying ${provider.name} using model ${provider.model}...`);
      
      const body: Record<string, unknown> = {
        model: provider.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
      };

      if (options.responseFormat?.type === "json_object") {
        body.response_format = { type: "json_object" };
      }

      const res = await fetch(provider.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.key}`,
        },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as any;

      if (!res.ok || data.error) {
        throw new Error(`${provider.name} error: ${data.error?.message ?? res.statusText}`);
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content || content.trim().length === 0) {
        throw new Error(`${provider.name} returned empty completion.`);
      }

      console.log(`[AI Engine] [Fallback] Successfully generated content via ${provider.name}.`);
      return content;
    } catch (e: any) {
      const msg = e.message || String(e);
      console.warn(`[AI Engine] [Fallback] ${provider.name} failed: ${msg}`);
      errors.push(`${provider.name}: ${msg}`);
    }
  }

  throw new Error(`All AI providers failed. Errors: ${errors.join(" | ")}`);
}

// Extracts clean JSON string by finding first '{' or '[' and matching to final '}' or ']'
function stripMarkdownJson(text: string): string {
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  
  let startIdx = -1;
  let endIdx = -1;
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = text.lastIndexOf("}");
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = text.lastIndexOf("]");
  }
  
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return text.substring(startIdx, endIdx + 1);
  }
  
  return text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
}

export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  options: OpenRouterOptions
): Promise<string> {
  const cached = getCachedAIResponse(systemPrompt, userPrompt, options);
  if (cached) return cached;

  const start = Date.now();
  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
  const response = await callAIRobust(messages, options);
  const duration = Date.now() - start;

  try {
    const { PerformanceMonitor } = require("../../utils/monitoring");
    PerformanceMonitor.record("ai", options.model || "unknown", duration);
  } catch (err) {
    // Ignore monitoring import errors in isolated contexts
  }

  setCachedAIResponse(systemPrompt, userPrompt, options, response);
  return response;
}

export async function generateJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  options: OpenRouterOptions,
  fallback: T
): Promise<T> {
  const modifiedSys = `${systemPrompt}\nYou MUST respond with valid JSON only, no other conversational introduction or explanation.`;
  const cached = getCachedAIResponse(modifiedSys, userPrompt, options);
  if (cached) {
    try {
      const repaired = tryRepairJSON(cached);
      const parsed = JSON.parse(repaired);
      return enforceSchema(parsed, fallback);
    } catch {
      // In case parsing fails, recalculate
    }
  }

  const start = Date.now();
  let text = "";
  try {
    const messages: OpenRouterMessage[] = [
      { role: "system", content: modifiedSys },
      { role: "user", content: userPrompt },
    ];
    text = await callAIRobust(messages, options);
    const duration = Date.now() - start;

    try {
      const { PerformanceMonitor } = require("../../utils/monitoring");
      PerformanceMonitor.record("ai", options.model || "unknown", duration);
    } catch (err) {}

    const repaired = tryRepairJSON(text);
    const parsed = JSON.parse(repaired);
    const validated = enforceSchema(parsed, fallback);
    
    setCachedAIResponse(modifiedSys, userPrompt, options, text);
    return validated;
  } catch (error) {
    console.warn(`[AI Engine] Initial JSON generation/parsing failed:`, error);
    try {
      console.log(`[AI Engine] Attempting automatic retry...`);
      const retryMessages: OpenRouterMessage[] = [
        { role: "system", content: `${modifiedSys}\nIMPORTANT: Your previous output was invalid JSON. Ensure all keys and string values are double-quoted and all trailing commas are removed. Do not include markdown wraps or conversational prose.` },
        { role: "user", content: `${userPrompt}\n\nStrict instruction: return valid JSON matching this schema: ${JSON.stringify(fallback)}` }
      ];
      const retryText = await callAIRobust(retryMessages, options);
      const repaired = tryRepairJSON(retryText);
      const parsed = JSON.parse(repaired);
      const validated = enforceSchema(parsed, fallback);
      
      setCachedAIResponse(modifiedSys, userPrompt, options, retryText);
      return validated;
    } catch (retryError) {
      console.error(`[AI Engine] Retry JSON generation failed too:`, retryError);
      console.error(`[AI Engine] Returning fallback structure.`);
      return fallback;
    }
  }
}

// Helper to repair common JSON malformations from LLMs
function tryRepairJSON(text: string): string {
  let cleaned = text.trim();
  cleaned = stripMarkdownJson(cleaned);
  
  // Clean trailing commas before close characters
  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");
  
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {}

  // Repair unquoted or single quoted keys/values
  let repaired = cleaned
    .replace(/(['"])?(\w+)\1\s*:/g, '"$2":')
    .replace(/:\s*'([^']*)'/g, ':"$1"');

  try {
    JSON.parse(repaired);
    return repaired;
  } catch {}

  // Balance open/close brackets
  let openBraces = (repaired.match(/\{/g) || []).length;
  let closeBraces = (repaired.match(/\}/g) || []).length;
  let openBrackets = (repaired.match(/\[/g) || []).length;
  let closeBrackets = (repaired.match(/\]/g) || []).length;

  while (openBraces > closeBraces) {
    repaired += "}";
    closeBraces++;
  }
  while (openBrackets > closeBrackets) {
    repaired += "]";
    closeBrackets++;
  }

  try {
    JSON.parse(repaired);
    return repaired;
  } catch {}

  return cleaned;
}

// Ensures parsed object has the identical keys and types as the fallback schema
function enforceSchema<T>(parsed: any, fallback: T): T {
  if (fallback === null || fallback === undefined) {
    return parsed as T;
  }
  
  if (Array.isArray(fallback)) {
    if (!Array.isArray(parsed)) {
      return fallback;
    }
    if (fallback.length > 0) {
      const template = fallback[0];
      return parsed.map((item: any) => enforceSchema(item, template)) as unknown as T;
    }
    return parsed as T;
  }
  
  if (typeof fallback === "object") {
    if (typeof parsed !== "object" || parsed === null) {
      return fallback;
    }
    const res: any = { ...fallback };
    for (const key of Object.keys(fallback)) {
      if (key in parsed) {
        res[key] = enforceSchema(parsed[key], (fallback as any)[key]);
      }
    }
    return res as T;
  }
  
  if (typeof parsed !== typeof fallback) {
    return fallback;
  }
  
  return parsed as T;
}

// Default model presets for different task categories
export const MODELS = {
  FAST: "google/gemini-2.5-flash",
  BALANCED: "google/gemini-2.5-flash",
  POWERFUL: "google/gemini-2.5-flash",
  CODE: "google/gemini-2.5-flash",
  CHEAP: "google/gemini-2.5-flash",
} as const;

// Available models for Ady Chat
export const CHAT_MODELS = [
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", cheap: true },
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI", cheap: false },
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", provider: "Anthropic", cheap: false },
  { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku", provider: "Anthropic", cheap: true },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", cheap: true },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", cheap: false },
  { id: "deepseek/deepseek-chat", name: "DeepSeek V3", provider: "DeepSeek", cheap: true },
  { id: "deepseek/deepseek-r1", name: "DeepSeek R1", provider: "DeepSeek", cheap: true },
  { id: "meta-llama/llama-3.3-70b", name: "Llama 3.3 70B", provider: "Meta", cheap: true },
  { id: "mistralai/mistral-large", name: "Mistral Large", provider: "Mistral", cheap: false },
] as const;

export type ChatModelId = (typeof CHAT_MODELS)[number]["id"];
