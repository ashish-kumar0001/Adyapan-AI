import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { handleRouteError } from "../utils/routeError";
import { generateNotesPdf } from "../services/pdf-generator.service";
import { formatNotesHtml, formatNotesBodyHtml } from "../services/notes-formatter.service";

export const notesExportRouter = Router();

notesExportRouter.use(requireAuth);

/**
 * POST /api/notes/export/pdf
 * Generate and download a professional PDF from raw markdown notes.
 * Body: { content: string, topic: string, difficulty?: string, type?: string }
 */
notesExportRouter.post("/pdf", async (req, res) => {
  try {
    const { content, topic, difficulty, type } = req.body;

    if (!content || !topic) {
      res.status(400).json({ success: false, error: "content and topic are required" });
      return;
    }

    console.log(`[Notes Export] Generating PDF for topic: "${topic}" by user: ${req.user!.userId}`);

    const pdfBuffer = await generateNotesPdf(content, topic, { difficulty, type });

    const filename = `${topic.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "_")}_AdyapanAI_Notes.pdf`;

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length.toString(),
    });

    res.send(pdfBuffer);

    console.log(`[Notes Export] PDF generated successfully (${pdfBuffer.length} bytes)`);
  } catch (error) {
    handleRouteError(res, error, "Notes.export.pdf", "PDF generation failed");
  }
});

/**
 * POST /api/notes/export/html
 * Return formatted HTML from raw markdown notes.
 * Body: { content: string, topic: string, difficulty?: string, type?: string }
 */
notesExportRouter.post("/html", async (req, res) => {
  try {
    const { content, topic, difficulty, type } = req.body;

    if (!content || !topic) {
      res.status(400).json({ success: false, error: "content and topic are required" });
      return;
    }

    const html = formatNotesHtml(content, topic, { difficulty, type });

    res.json({ success: true, html });
  } catch (error) {
    handleRouteError(res, error, "Notes.export.html", "HTML formatting failed");
  }
});

/**
 * POST /api/notes/format
 * Return formatted body-only HTML from raw markdown.
 * Body: { content: string }
 */
notesExportRouter.post("/format", async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ success: false, error: "content is required" });
      return;
    }

    const html = formatNotesBodyHtml(content);

    res.json({ success: true, html });
  } catch (error) {
    handleRouteError(res, error, "Notes.format", "Markdown formatting failed");
  }
});
