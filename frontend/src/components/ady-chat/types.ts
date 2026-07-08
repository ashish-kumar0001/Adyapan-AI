// ─── Shared types for Ady Chat ────────────────────────────────────────────

export interface ChatSession {
  id: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatModel {
  id: string;
  name: string;
  displayName: string;
  provider: string;
  icon: string;
  description: string;
  fast: boolean;
}

export const ADY_MODELS: ChatModel[] = [
  {
    id: "google/gemini-2.5-flash",
    name: "Ady Flash",
    displayName: "Ady Flash",
    provider: "Google",
    icon: "⚡",
    description: "Fast & efficient",
    fast: true,
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Ady Pro",
    displayName: "Ady Pro",
    provider: "Google",
    icon: "🧠",
    description: "Most capable",
    fast: false,
  },
  {
    id: "deepseek/deepseek-r1",
    name: "Ady Reasoning",
    displayName: "Ady Reasoning",
    provider: "DeepSeek",
    icon: "🔬",
    description: "Deep reasoning",
    fast: false,
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Ady Vision",
    displayName: "Ady Vision",
    provider: "Anthropic",
    icon: "👁️",
    description: "Multimodal",
    fast: false,
  },
];

export const SUGGESTION_CARDS = [
  { icon: "📚", title: "Study a Topic", prompt: "Help me study " },
  { icon: "📝", title: "Generate Notes", prompt: "Generate detailed notes on " },
  { icon: "💻", title: "Explain Code", prompt: "Explain this code: " },
  { icon: "📄", title: "Resume Review", prompt: "Review and improve my resume: " },
  { icon: "🎯", title: "Interview Prep", prompt: "Help me prepare for an interview for " },
  { icon: "🔬", title: "Research Assistant", prompt: "Research and summarize: " },
  { icon: "📋", title: "Assignment Help", prompt: "Help me with this assignment: " },
  { icon: "🎨", title: "Create PPT Outline", prompt: "Create a presentation outline for " },
  { icon: "❓", title: "Generate Quiz", prompt: "Generate a quiz on " },
  { icon: "🚀", title: "Career Advice", prompt: "Give me career advice for " },
];
