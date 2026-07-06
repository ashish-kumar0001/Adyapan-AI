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
  FAST: "openai/gpt-4o-mini",
  BALANCED: "openai/gpt-4o",
  POWERFUL: "anthropic/claude-sonnet-4",
  CODE: "anthropic/claude-sonnet-4",
  CHEAP: "openai/gpt-4o-mini",
} as const;
