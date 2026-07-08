import { env } from "../../config/env";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

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

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: { message: string };
}

async function callOpenRouter(
  messages: OpenRouterMessage[],
  options: OpenRouterOptions
): Promise<string> {
  const body: Record<string, unknown> = {
    model: options.model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4096,
  };

  if (options.responseFormat?.type === "json_object") {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openrouterApiKey}`,
      "HTTP-Referer": env.frontendUrl,
      "X-Title": "Adyapan AI",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as OpenRouterResponse;

  if (!res.ok || data.error) {
    throw new Error(`OpenRouter API error: ${data.error?.message ?? res.statusText}`);
  }

  return data.choices[0].message.content;
}

function stripMarkdownJson(text: string): string {
  return text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
}

export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  options: OpenRouterOptions
): Promise<string> {
  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
  return callOpenRouter(messages, options);
}

export async function generateJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  options: OpenRouterOptions,
  fallback: T
): Promise<T> {
  try {
    const messages: OpenRouterMessage[] = [
      { role: "system", content: `${systemPrompt}\nYou MUST respond with valid JSON only, no markdown.` },
      { role: "user", content: userPrompt },
    ];
    const text = await callOpenRouter(messages, options);
    return JSON.parse(stripMarkdownJson(text)) as T;
  } catch (error) {
    console.error(`OpenRouter JSON error (${options.model}):`, error);
    return fallback;
  }
}

// Default model presets for different task categories
export const MODELS = {
  FAST: "meta-llama/llama-2-7b-chat",
  BALANCED: "meta-llama/llama-3-70b-instruct",
  POWERFUL: "meta-llama/llama-3-70b-instruct",
  CODE: "meta-llama/llama-3-70b-instruct",
  CHEAP: "meta-llama/llama-2-7b-chat",
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
