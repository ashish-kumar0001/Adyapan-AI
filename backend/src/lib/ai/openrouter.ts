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

// Gemini model fallback chain — tried in order when one is unavailable
const GEMINI_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

// Groq model fallback chain
const GROQ_MODEL_FALLBACKS_STRONG = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];
const GROQ_MODEL_FALLBACKS_FAST = [
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
];

// Sequential fallback completion engine: Gemini (multiple models) → Groq (multiple models) → OpenRouter
async function callAIRobust(
  messages: OpenRouterMessage[],
  options: OpenRouterOptions
): Promise<string> {
  const providers: { name: string; url: string; key: string; model: string }[] = [];

  // 1. Add Google Gemini with fallback models (primary)
  if (env.geminiApiKey) {
    const modelLower = options.model?.toLowerCase() ?? "";
    const requestedModel = modelLower.includes("gemini")
      ? options.model.split("/").pop() || ""
      : "";

    // If a specific Gemini model was requested, try it first then fall back
    const modelsToTry = requestedModel
      ? [requestedModel, ...GEMINI_MODEL_FALLBACKS.filter(m => m !== requestedModel)]
      : [...GEMINI_MODEL_FALLBACKS];

    for (const m of modelsToTry) {
      providers.push({
        name: `Gemini (${m})`,
        url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        key: env.geminiApiKey,
        model: m,
      });
    }
  }

  // 2. Add Groq with fallback models (secondary)
  if (env.groqApiKey) {
    const modelLower = options.model?.toLowerCase() ?? "";
    const isMiniOrFast = (modelLower.includes("mini") && !modelLower.includes("gemini")) ||
                         (modelLower.includes("fast") && !modelLower.includes("flash")) ||
                         modelLower.includes("cheap");
    const groqChain = isMiniOrFast ? GROQ_MODEL_FALLBACKS_FAST : GROQ_MODEL_FALLBACKS_STRONG;

    for (const m of groqChain) {
      providers.push({
        name: `Groq (${m})`,
        url: "https://api.groq.com/openai/v1/chat/completions",
        key: env.groqApiKey,
        model: m,
      });
    }
  }

  // 3. Add OpenRouter if key exists (tertiary)
  if (env.openrouterApiKey) {
    providers.push({
      name: "OpenRouter",
      url: "https://openrouter.ai/api/v1/chat/completions",
      key: env.openrouterApiKey,
      model: options.model || "openai/gpt-4o-mini",
    });
  }

  if (providers.length === 0) {
    throw new Error("No AI providers configured. Please check environment keys.");
  }

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      const body: Record<string, unknown> = {
        model: provider.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
      };

      if (options.responseFormat?.type === "json_object") {
        body.response_format = { type: "json_object" };
      }

      const controller = new AbortController();
      const fetchTimeoutMs = (options.maxTokens ?? 4096) > 4096 ? 120000 : 60000;
      const timeoutId = setTimeout(() => controller.abort(), fetchTimeoutMs);

      let res: Response;
      try {
        res = await fetch(provider.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${provider.key}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        throw fetchErr;
      }
      clearTimeout(timeoutId);

      const rawText = await res.text();
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        console.error(`[AI Engine] ${provider.name} returned non-JSON (${rawText.length} chars): ${rawText.substring(0, 300)}`);
        throw new Error(`${provider.name} returned non-JSON response.`);
      }

      if (!res.ok || data.error) {
        const errMsg = data.error?.message ?? res.statusText;
        const isRateLimit = res.status === 429;
        console.error(`[AI Engine] ${provider.name} error (HTTP ${res.status}):`, JSON.stringify(data).substring(0, 500));
        throw new Error(`${provider.name} error: ${errMsg}`);
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content || content.trim().length === 0) {
        console.error(`[AI Engine] ${provider.name} empty content. Full response keys: ${Object.keys(data)}, choices: ${JSON.stringify(data.choices).substring(0, 500)}`);
        throw new Error(`${provider.name} returned empty completion.`);
      }

      console.log(`[AI Engine] Success with ${provider.name}`);
      return content;
    } catch (e: any) {
      const msg = e.message || String(e);
      const isAbort = e?.name === "AbortError" || msg.includes("abort") || msg.includes("This operation was aborted");
      if (isAbort) {
        console.warn(`[AI Engine] ${provider.name} request timed out, trying next...`);
        errors.push(`${provider.name}: Request timed out`);
      } else {
        console.warn(`[AI Engine] ${provider.name} failed: ${msg} — trying next...`);
        errors.push(`${provider.name}: ${msg}`);
      }
      // No retry per-model — just move to the next model/provider in the chain
      continue;
    }
  }

  throw new Error(`All AI providers/models failed. Tried ${providers.length} options: ${errors.join(" | ")}`);
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
      const validated = enforceSchema(parsed, fallback);
      // Reject cached resume profiles that are empty/all-default (only for resume schemas that have name/email/skills)
      const isResumeSchema = "name" in (fallback as any) || "email" in (fallback as any);
      const isEmpty = isResumeSchema && !(validated as any).name && !(validated as any).email && ((validated as any).skills?.length ?? 0) === 0;
      if (isEmpty) {
      } else {
        return validated;
      }
    } catch (e) {
    }
  } else {
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
      console.error(`[AI Engine] All AI providers exhausted. Throwing error.`);
      throw new Error("AI extraction failed: all providers are rate-limited or unavailable. Please try again later.");
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
