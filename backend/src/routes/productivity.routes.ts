import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { handleRouteError } from "../utils/routeError";
import { generateText, MODELS } from "../lib/ai/openrouter";

const router = Router();
router.use(requireAuth);

// ─── POST /generate-email ─ Generate a professional email ──────────────
router.post("/generate-email", async (req, res) => {
  try {
    const { category, tone, length, recipient, details } = req.body;

    if (!details || typeof details !== "string") {
      res.status(400).json({ success: false, error: "details is required" });
      return;
    }

    const systemPrompt = `You are an expert professional email writer. Generate polished, well-structured emails based on the user's requirements. Always include a clear subject line and body. Match the tone requested (Professional, Friendly, or Formal). Adjust length based on the user's preference (Brief = ~100 words, Detailed = ~250 words, Comprehensive = ~400 words).`;

    const userPrompt = `Write a professional email with the following parameters:
Category: ${category || "General"}
Tone: ${tone || "Professional"}
Length: ${length || "Detailed"}
Recipient: ${recipient || "Hiring Manager"}
Details/Background: ${details}

Return the email in this exact JSON format:
{
  "subject": "The email subject line",
  "content": "The complete email body including greeting, body paragraphs, and closing"
}

Return ONLY the JSON object, no other text.`;

    const raw = await generateText(systemPrompt, userPrompt, {
      model: MODELS.FAST,
      temperature: 0.7,
      responseFormat: { type: "json_object" },
    });

    let parsed: { subject?: string; content?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { subject: "", content: raw };
    }

    res.json({
      success: true,
      subject: parsed.subject || "",
      content: parsed.content || raw,
    });
  } catch (error) {
    handleRouteError(res, error, "Productivity.generateEmail", "Failed to generate email");
  }
});

// ─── POST /generate-sop ─ Generate a Statement of Purpose ──────────────
router.post("/generate-sop", async (req, res) => {
  try {
    const { category, background, goals, targetUniversity, course } = req.body;

    if (!course || typeof course !== "string") {
      res.status(400).json({ success: false, error: "course is required" });
      return;
    }
    if (!targetUniversity || typeof targetUniversity !== "string") {
      res.status(400).json({ success: false, error: "targetUniversity is required" });
      return;
    }

    const systemPrompt = `You are an expert Statement of Purpose (SOP) writer with years of experience helping students get admitted to top universities worldwide. Write compelling, authentic, and well-structured SOPs that tell a persuasive story about the applicant's journey, motivations, and aspirations. Use a professional academic tone. Structure the SOP with clear paragraphs covering: introduction/hook, academic background, relevant experience, why this program/university, career goals, and conclusion. Aim for 800-1200 words.`;

    const userPrompt = `Write a Statement of Purpose with the following details:
Category: ${category || "Master's Program"}
Target Course: ${course}
Target University: ${targetUniversity}
Academic Background: ${background || "Not provided"}
Career Goals: ${goals || "Not provided"}

The SOP should:
1. Open with a compelling hook that shows passion for the field
2. Describe academic journey and key learnings
3. Highlight relevant projects, research, or work experience
4. Explain why this specific university and program
5. Articulate clear short-term and long-term career goals
6. Close with a strong summary statement

Return the SOP content as a plain text string. Do not include "Statement of Purpose" as a title — just the body text starting with "Dear Admissions Committee," or a creative opening.`;

    const content = await generateText(systemPrompt, userPrompt, {
      model: MODELS.FAST,
      temperature: 0.7,
    });

    res.json({ success: true, content });
  } catch (error) {
    handleRouteError(res, error, "Productivity.generateSOP", "Failed to generate SOP");
  }
});

// ─── POST /generate-linkedin ─ Generate a LinkedIn post ────────────────
router.post("/generate-linkedin", async (req, res) => {
  try {
    const { category, format, topic, includeEmojis, includeHashtags } = req.body;

    if (!topic || typeof topic !== "string") {
      res.status(400).json({ success: false, error: "topic is required" });
      return;
    }

    const emojiInstruction = includeEmojis
      ? "Use relevant emojis throughout the post to make it visually engaging and break up text."
      : "Do not use any emojis in the post.";

    const hashtagInstruction = includeHashtags
      ? "End the post with 3-5 relevant hashtags on a new line."
      : "Do not include any hashtags.";

    const formatInstructions: Record<string, string> = {
      Storytelling: "Write in a storytelling format with a personal narrative arc — setup, challenge, resolution, and takeaway. Use short paragraphs and line breaks for readability.",
      Motivational: "Write in an inspirational, motivational tone. Use powerful statements, rhetorical questions, and a call-to-action that encourages engagement.",
      Technical: "Write in a technical but accessible style. Focus on insights, data, and practical knowledge. Use bullet points or numbered lists where appropriate.",
      "Short Format": "Write a concise, punchy post under 150 words. Use short sentences and get to the point quickly. Make every word count.",
    };

    const systemPrompt = `You are an expert LinkedIn content creator and personal branding specialist. Write engaging, high-quality LinkedIn posts that drive engagement (likes, comments, shares). Write in first person. Use a conversational yet professional tone. Keep paragraphs short (1-3 sentences max) for mobile readability. ${emojiInstruction} ${hashtagInstruction} ${formatInstructions[format] || formatInstructions.Storytelling}`;

    const userPrompt = `Write a LinkedIn post with these details:
Post Category: ${category || "Project Showcase"}
Format Style: ${format || "Storytelling"}
Topic/Details: ${topic}

The post should be authentic, value-driven, and encourage engagement. Start with a strong hook line that stops the scroll.

Return the post content as a plain text string.`;

    const content = await generateText(systemPrompt, userPrompt, {
      model: MODELS.FAST,
      temperature: 0.8,
    });

    res.json({ success: true, content });
  } catch (error) {
    handleRouteError(res, error, "Productivity.generateLinkedIn", "Failed to generate LinkedIn post");
  }
});

// ─── POST /generate-content ─ Generate general content ─────────────────
router.post("/generate-content", async (req, res) => {
  try {
    const { category, style, keywords, outline } = req.body;

    if (!outline || typeof outline !== "string") {
      res.status(400).json({ success: false, error: "outline is required" });
      return;
    }

    const styleInstructions: Record<string, string> = {
      "SEO Optimized": "Write SEO-optimized content. Naturally incorporate the target keywords in headings, intro, and body. Use H2/H3 structure. Include meta-description suggestions. Write for both humans and search engines.",
      Technical: "Write technical documentation style content. Be precise, clear, and thorough. Use code examples, diagrams descriptions, and step-by-step instructions where appropriate.",
      Academic: "Write in an academic style with formal language, citations-style references, and structured argumentation. Use evidence-based claims and logical flow.",
      Creative: "Write in a creative, engaging style. Use metaphors, anecdotes, and vivid language. Make the content enjoyable to read while being informative.",
    };

    const typeInstructions: Record<string, string> = {
      "Blog Article": "Write a comprehensive blog article with an engaging introduction, well-structured sections, and a strong conclusion with call-to-action.",
      "Technical Documentation": "Write clear technical documentation with prerequisites, step-by-step instructions, code examples, and troubleshooting tips.",
      "Research Summary": "Write a concise research summary that distills complex findings into accessible insights. Include key findings, methodology overview, and implications.",
      "Case Study": "Write a detailed case study with background, challenge, solution, results, and key takeaways. Use specific metrics and outcomes where possible.",
    };

    const systemPrompt = `You are an expert content writer and editor. ${styleInstructions[style] || styleInstructions["SEO Optimized"]} ${typeInstructions[category] || typeInstructions["Blog Article"]} Write high-quality, original content that provides real value to the reader.`;

    const userPrompt = `Create the following content:
Content Type: ${category || "Blog Article"}
Style: ${style || "SEO Optimized"}
Target Keywords: ${keywords || "None specified"}
Outline/Instructions: ${outline}

Write the full content following the outline provided. Make it comprehensive, well-structured, and engaging. Use proper formatting with headings, paragraphs, and where appropriate, bullet points or numbered lists.

Return the content as a plain text string with markdown-style headings (## for sections).`;

    const content = await generateText(systemPrompt, userPrompt, {
      model: MODELS.FAST,
      temperature: 0.7,
    });

    res.json({ success: true, content });
  } catch (error) {
    handleRouteError(res, error, "Productivity.generateContent", "Failed to generate content");
  }
});

// ─── POST /chat ─ AI Productivity Coach chat ───────────────────────────
router.post("/chat", async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({ success: false, error: "message is required" });
      return;
    }

    const currentTab = context?.tab || "general";

    const tabContext: Record<string, string> = {
      email: "The user is currently working on writing a professional email.",
      sop: "The user is currently working on writing a Statement of Purpose.",
      linkedin: "The user is currently working on writing a LinkedIn post.",
      content: "The user is currently working on creating written content (blog, docs, etc).",
      general: "The user is working in the Productivity Hub.",
    };

    const systemPrompt = `You are the AI Productivity Coach, an expert assistant specializing in professional writing, communication, and content creation. You help users:
- Draft and refine professional emails
- Write compelling Statements of Purpose (SOPs)
- Create engaging LinkedIn posts
- Generate high-quality articles, documentation, and other content
- Provide writing tips, tone suggestions, and structure advice

Be concise, helpful, and actionable. When asked to generate content, provide it directly. When asked for advice, give specific, practical suggestions. Keep responses focused and under 300 words unless generating content.`;

    const userPrompt = `${tabContext[currentTab] || tabContext.general}

User's message: "${message}"

Provide a helpful, actionable response. If they're asking you to write or draft something, do it. If they're asking for advice, give specific tips.

Return your response as a plain text string.`;

    const reply = await generateText(systemPrompt, userPrompt, {
      model: MODELS.FAST,
      temperature: 0.7,
    });

    res.json({ success: true, response: reply });
  } catch (error) {
    handleRouteError(res, error, "Productivity.chat", "Failed to process chat message");
  }
});

export const productivityRouter = router;
