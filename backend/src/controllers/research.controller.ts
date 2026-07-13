import type { NextFunction, Request, Response } from "express";
import { httpError } from "../utils/httpError";
import { generateText, generateJSON, MODELS } from "../lib/ai/openrouter";
import {
  fetchResearchSources,
  generateFullPaper,
  generateSection,
  researchChat,
  generateSuggestedTopics,
  type ResearchConfig,
} from "../services/research.service";
import {
  exportPaperPdf,
  exportPaperDocx,
  exportPaperLatex,
  exportPaperBibtex,
} from "../services/research-export.service";

const paperStore = new Map<string, any>();

// POST /api/research/suggest-topics
export async function suggestTopics(_req: Request, res: Response, next: NextFunction) {
  try {
    const topics = await generateSuggestedTopics();
    res.json({ success: true, topics });
  } catch (err: any) {
    next(httpError(500, err.message || "Failed to generate topic suggestions"));
  }
}

// POST /api/research/fetch-sources
export async function fetchSources(req: Request, res: Response, next: NextFunction) {
  const { topic } = req.body as { topic?: string };
  if (!topic?.trim()) {
    next(httpError(400, "Topic is required"));
    return;
  }
  try {
    const sources = await fetchResearchSources(topic.trim());
    res.json({ success: true, sources: sources.slice(0, 50), totalFound: sources.length });
  } catch (err: any) {
    next(httpError(500, err.message || "Failed to fetch research sources"));
  }
}

// POST /api/research/generate-paper — SSE streaming with real-time progress
export async function generatePaperSSE(req: Request, res: Response) {
  const config = req.body as ResearchConfig;
  if (!config.topic?.trim()) {
    res.status(400).write(`data: ${JSON.stringify({ type: "error", message: "Research topic is required" })}\n\n`);
    res.end();
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const sendEvent = (data: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (typeof (res as any).flush === "function") (res as any).flush();
  };

  try {
    sendEvent({ type: "progress", step: "init", message: "Initializing AI research engine...", percent: 5, sourcesFound: 0 });

    // Fetch sources with progress
    const sources = await fetchResearchSources(config.topic, (p) => {
      sendEvent({ type: "progress", ...p });
    });

    sendEvent({ type: "progress", step: "sources", message: `Found ${sources.length} sources. Starting paper generation...`, percent: 62, sourcesFound: sources.length });

    // Generate paper with progress
    const paper = await generateFullPaper(config, sources, (p) => {
      sendEvent({ type: "progress", ...p });
    });

    // Store
    const paperId = `paper-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    paperStore.set(paperId, paper);
    if (paperStore.size > 20) {
      const keys = Array.from(paperStore.keys());
      for (let i = 0; i < keys.length - 20; i++) paperStore.delete(keys[i]);
    }

    sendEvent({ type: "complete", paperId, paper });
  } catch (err: any) {
    sendEvent({ type: "error", message: err.message || "Paper generation failed" });
  } finally {
    res.end();
  }
}

// POST /api/research/generate-paper-sync — Non-streaming fallback
export async function generatePaperSync(req: Request, res: Response, next: NextFunction) {
  const config = req.body as ResearchConfig;
  if (!config.topic?.trim()) {
    next(httpError(400, "Research topic is required"));
    return;
  }
  try {
    const sources = await fetchResearchSources(config.topic);
    const paper = await generateFullPaper(config, sources);
    const paperId = `paper-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    paperStore.set(paperId, paper);
    if (paperStore.size > 20) {
      const keys = Array.from(paperStore.keys());
      for (let i = 0; i < keys.length - 20; i++) paperStore.delete(keys[i]);
    }
    res.json({ success: true, paperId, paper });
  } catch (err: any) {
    next(httpError(500, err.message || "Failed to generate research paper"));
  }
}

// POST /api/research/generate-section
export async function generateSectionHandler(req: Request, res: Response, next: NextFunction) {
  const { sectionId, sectionTitle, subsections, config, sources, previousSections, title } = req.body as {
    sectionId: string; sectionTitle: string; subsections: string[];
    config: ResearchConfig; sources: any[]; previousSections: string; title: string;
  };
  if (!sectionId || !sectionTitle) {
    next(httpError(400, "sectionId and sectionTitle are required"));
    return;
  }
  try {
    const content = await generateSection(
      sectionId, sectionTitle, subsections || [],
      config || { topic: "" }, sources || [], previousSections || "", title || ""
    );
    res.json({ success: true, content });
  } catch (err: any) {
    next(httpError(500, err.message || "Failed to generate section"));
  }
}

// POST /api/research/chat
export async function chatWithAI(req: Request, res: Response, next: NextFunction) {
  const { message, context } = req.body as { message?: string; context?: any };
  if (!message?.trim()) {
    next(httpError(400, "Message is required"));
    return;
  }
  try {
    const response = await researchChat(message, context?.paperContent || "", context?.sources || []);
    res.json({ success: true, response });
  } catch (err: any) {
    next(httpError(500, err.message || "Chat request failed"));
  }
}

// GET /api/research/paper/:id
export function getPaper(req: Request, res: Response, next: NextFunction) {
  const id = req.params.id as string;
  const paper = paperStore.get(id);
  if (!paper) { next(httpError(404, "Paper not found")); return; }
  res.json({ success: true, paper });
}

// ── EXPORT ENDPOINTS ────────────────────────────────────────────────────────

// POST /api/research/export/pdf
export async function exportPdf(req: Request, res: Response, next: NextFunction) {
  const { paper } = req.body as { paper?: any };
  if (!paper) { next(httpError(400, "Paper data is required")); return; }
  try {
    const buffer = await exportPaperPdf(paper);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${(paper.title || "research-paper").replace(/[^a-zA-Z0-9]/g, "-").slice(0, 50)}.pdf"`);
    res.send(buffer);
  } catch (err: any) {
    next(httpError(500, err.message || "PDF export failed"));
  }
}

// POST /api/research/export/docx
export async function exportDocx(req: Request, res: Response, next: NextFunction) {
  const { paper } = req.body as { paper?: any };
  if (!paper) { next(httpError(400, "Paper data is required")); return; }
  try {
    const buffer = await exportPaperDocx(paper);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${(paper.title || "research-paper").replace(/[^a-zA-Z0-9]/g, "-").slice(0, 50)}.docx"`);
    res.send(buffer);
  } catch (err: any) {
    next(httpError(500, err.message || "DOCX export failed"));
  }
}

// POST /api/research/export/latex
export async function exportLatex(req: Request, res: Response, next: NextFunction) {
  const { paper } = req.body as { paper?: any };
  if (!paper) { next(httpError(400, "Paper data is required")); return; }
  try {
    const latex = exportPaperLatex(paper);
    res.setHeader("Content-Type", "application/x-latex");
    res.setHeader("Content-Disposition", `attachment; filename="${(paper.title || "research-paper").replace(/[^a-zA-Z0-9]/g, "-").slice(0, 50)}.tex"`);
    res.send(latex);
  } catch (err: any) {
    next(httpError(500, err.message || "LaTeX export failed"));
  }
}

// POST /api/research/export/bibtex
export async function exportBibtex(req: Request, res: Response, next: NextFunction) {
  const { paper } = req.body as { paper?: any };
  if (!paper) { next(httpError(400, "Paper data is required")); return; }
  try {
    const bibtex = exportPaperBibtex(paper);
    res.setHeader("Content-Type", "application/x-bibtex");
    res.setHeader("Content-Disposition", `attachment; filename="${(paper.title || "references").replace(/[^a-zA-Z0-9]/g, "-").slice(0, 50)}.bib"`);
    res.send(bibtex);
  } catch (err: any) {
    next(httpError(500, err.message || "BibTeX export failed"));
  }
}

// POST /api/research/check-plagiarism
export async function checkPlagiarism(req: Request, res: Response, next: NextFunction) {
  const { text } = req.body as { text?: string };
  if (!text?.trim()) { next(httpError(400, "Text is required")); return; }
  try {
    const result = await generateJSON(
      "You are a plagiarism detection expert. Analyze the given text for potential similarity.",
      `Analyze this text for potential plagiarism indicators:\n"""\n${text.slice(0, 2000)}\n"""\nReturn JSON:\n{"similarity": number (0-100), "sources": [{"title": "source", "url": "", "match": number}]}`,
      { model: MODELS.FAST, responseFormat: { type: "json_object" } },
      { similarity: 0, sources: [] }
    );
    res.json(result);
  } catch (err: any) {
    next(httpError(500, err.message || "Plagiarism check failed"));
  }
}

// POST /api/research/rephrase
export async function rephraseText(req: Request, res: Response, next: NextFunction) {
  const { text } = req.body as { text?: string };
  if (!text?.trim()) { next(httpError(400, "Text is required")); return; }
  try {
    const content = await generateText(
      "You are an expert academic paraphraser. Rewrite text to be original while preserving meaning.",
      `Rephrase the following academic text to be original and plagiarism-free:\n"""\n${text}\n"""\nReturn ONLY the rephrased text. Maintain academic tone and all technical accuracy.`,
      { model: MODELS.FAST }
    );
    res.json({ success: true, content });
  } catch (err: any) {
    next(httpError(500, err.message || "Rephrasing failed"));
  }
}
