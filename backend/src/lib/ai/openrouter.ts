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

// Robust fallback completion engine using OpenRouter, Groq, and Google AI Studio
async function callAIRobust(
  messages: OpenRouterMessage[],
  options: OpenRouterOptions
): Promise<string> {
  const providers = [];

  // 1. Add Google Gemini if key exists
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

  // 2. Add OpenRouter if key exists
  if (env.openrouterApiKey) {
    providers.push({
      name: "OpenRouter",
      url: "https://openrouter.ai/api/v1/chat/completions",
      key: env.openrouterApiKey,
      model: options.model || "openai/gpt-4o-mini"
    });
  }

  // 3. Add Groq if key exists
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

  if (providers.length === 0) {
    throw new Error("No AI providers configured. Please check environment keys.");
  }

  const controller = new AbortController();
  const { signal } = controller;

  const promises = providers.map(async (provider) => {
    try {
      console.log(`[AI Engine] [Simultaneous] Calling ${provider.name} using model ${provider.model}...`);
      
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
        signal,
      });

      const data = (await res.json()) as any;

      if (!res.ok || data.error) {
        throw new Error(`${provider.name} error: ${data.error?.message ?? res.statusText}`);
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content || content.trim().length === 0) {
        throw new Error(`${provider.name} returned empty completion.`);
      }

      console.log(`[AI Engine] [Simultaneous] Successfully generated content via ${provider.name}.`);
      
      // Cancel other pending requests
      controller.abort();
      
      return content;
    } catch (e: any) {
      if (e.name === "AbortError" || (e instanceof Error && e.name === "AbortError")) {
        console.log(`[AI Engine] [Simultaneous] ${provider.name} request aborted (another provider succeeded first).`);
      } else {
        console.warn(`[AI Engine] [Simultaneous] ${provider.name} execution failed:`, e.message || e);
      }
      throw e;
    }
  });

  try {
    return await Promise.any(promises);
  } catch (aggregateError: any) {
    const errors = aggregateError.errors || [aggregateError];
    const errorMsg = errors.map((e: any) => e.message || e).join(" | ");
    throw new Error(`All AI completion providers failed. Errors: ${errorMsg}`);
  }
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
      const cleaned = stripMarkdownJson(cached);
      return JSON.parse(cleaned) as T;
    } catch {
      // In case parsing fails, let it fallback or recalculate
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
    } catch (err) {
      // Ignore monitoring import errors
    }

    const cleaned = stripMarkdownJson(text);
    const parsed = JSON.parse(cleaned) as T;
    
    setCachedAIResponse(modifiedSys, userPrompt, options, text);
    return parsed;
  } catch (error) {
    console.error(`[AI Engine] JSON generation error (${options.model}):`, error);
    console.error(`[AI Engine] Original LLM Response text was:\n${text}`);
    return fallback;
  }
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
