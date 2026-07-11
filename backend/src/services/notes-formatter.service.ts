import { Marked } from "marked";

const marked = new Marked();

marked.use({
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const langClass = lang ? ` class="language-${lang}"` : "";
      return `<pre class="code-block"><code${langClass}>${escapeHtml(text)}</code></pre>`;
    },
    table({ header, body }: { header: string; body: string }) {
      return `<div class="table-wrapper"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
    },
    heading({ text, depth }: { text: string; depth: number }) {
      const id = text
        .toLowerCase()
        .replace(/[^\w]+/g, "-")
        .replace(/^-|-$/g, "");
      return `<h${depth} id="${id}">${text}</h${depth}>`;
    },
  },
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanMarkdown(raw: string): string {
  let cleaned = raw;

  // Remove standalone hash lines that are just decoration (##### or more)
  cleaned = cleaned.replace(/^#{5,}\s*$/gm, "");

  // Remove horizontal rules that are just dashes/asterisks
  cleaned = cleaned.replace(/^[-*_]{3,}\s*$/gm, "");

  // Remove multiple consecutive blank lines (keep max 2)
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  // Remove leading/trailing whitespace on each line
  cleaned = cleaned
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");

  // Remove leading/trailing newlines
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Convert raw AI-generated markdown into clean, styled HTML.
 * Strips unnecessary markdown artifacts, converts to semantic HTML,
 * and wraps in a professional Adyapan AI styled template.
 */
export function formatNotesHtml(
  markdown: string,
  topic: string,
  options?: { difficulty?: string; type?: string }
): string {
  const cleaned = cleanMarkdown(markdown);
  const bodyHtml = marked.parse(cleaned) as string;

  const difficultyBadge = options?.difficulty
    ? `<span class="badge badge-difficulty">${options.difficulty}</span>`
    : "";
  const typeBadge = options?.type
    ? `<span class="badge badge-type">${options.type}</span>`
    : "";

  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(topic)} - Adyapan AI Notes</title>
  <style>
    /* ── Reset & Base ──────────────────────────────── */
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --amber: #f59e0b;
      --amber-dark: #d97706;
      --amber-bg: rgba(245, 158, 11, 0.06);
      --amber-border: rgba(245, 158, 11, 0.18);
      --purple: #8b5cf6;
      --purple-bg: rgba(139, 92, 246, 0.06);
      --purple-border: rgba(139, 92, 246, 0.14);
      --cyan: #06b6d4;
      --cyan-bg: rgba(6, 182, 212, 0.06);
      --green: #10b981;
      --green-bg: rgba(16, 185, 129, 0.08);
      --red: #ef4444;
      --red-bg: rgba(239, 68, 68, 0.06);
      --text: #0f172a;
      --text-secondary: #334155;
      --text-muted: #64748b;
      --bg: #ffffff;
      --surface: #f8fafc;
      --border: #e2e8f0;
      --font-sans: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
      --font-mono: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
    }

    body {
      font-family: var(--font-sans);
      font-size: 15px;
      line-height: 1.7;
      color: var(--text);
      background: var(--bg);
      -webkit-font-smoothing: antialiased;
    }

    /* ── Notes Container ───────────────────────────── */
    .notes-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 48px;
    }

    /* ── Topic Header ──────────────────────────────── */
    .topic-header {
      text-align: center;
      padding-bottom: 32px;
      margin-bottom: 36px;
      border-bottom: 2px solid var(--border);
    }

    .topic-header h1 {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text);
      line-height: 1.2;
      margin-bottom: 10px;
      letter-spacing: -0.02em;
    }

    .topic-header .meta {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
      color: var(--text-muted);
      font-size: 13px;
    }

    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .badge-difficulty { background: var(--amber-bg); color: var(--amber-dark); border: 1px solid var(--amber-border); }
    .badge-type { background: var(--purple-bg); color: var(--purple); border: 1px solid var(--purple-border); }

    /* ── Typography ────────────────────────────────── */
    h1 { font-size: 1.8rem; font-weight: 800; margin: 36px 0 14px; color: var(--text); line-height: 1.25; }
    h2 { font-size: 1.45rem; font-weight: 700; margin: 32px 0 12px; color: var(--text); line-height: 1.3; padding-bottom: 6px; border-bottom: 1px solid var(--border); }
    h3 { font-size: 1.2rem; font-weight: 700; margin: 26px 0 10px; color: var(--text); line-height: 1.35; }
    h4 { font-size: 1.05rem; font-weight: 700; margin: 22px 0 8px; color: var(--text-secondary); }
    h5, h6 { font-size: 0.95rem; font-weight: 700; margin: 18px 0 8px; color: var(--text-secondary); }

    p { margin-bottom: 14px; color: var(--text-secondary); line-height: 1.75; }

    strong { font-weight: 700; color: var(--text); }
    em { font-style: italic; }

    a { color: var(--amber-dark); text-decoration: underline; text-underline-offset: 2px; }

    /* ── Lists ─────────────────────────────────────── */
    ul, ol { margin: 10px 0 16px 28px; }
    li { margin-bottom: 6px; color: var(--text-secondary); line-height: 1.65; }
    li::marker { color: var(--amber); }
    ul li::marker { content: "• "; font-weight: 700; }
    ol li::marker { font-weight: 700; color: var(--amber-dark); }

    /* Nested lists */
    ul ul, ol ol, ul ol, ol ul { margin-top: 6px; margin-bottom: 6px; }

    /* ── Blockquote (Important Notes / Tips) ───────── */
    blockquote {
      margin: 20px 0;
      padding: 16px 20px;
      border-left: 4px solid var(--amber);
      background: var(--amber-bg);
      border-radius: 0 10px 10px 0;
      color: var(--text-secondary);
    }

    blockquote p { margin-bottom: 0; }

    /* ── Code ──────────────────────────────────────── */
    code {
      font-family: var(--font-mono);
      font-size: 0.88em;
      padding: 2px 6px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 4px;
      color: var(--amber-dark);
    }

    pre.code-block {
      margin: 18px 0;
      padding: 20px 24px;
      background: #0f172a;
      border-radius: 12px;
      overflow-x: auto;
      line-height: 1.55;
    }

    pre.code-block code {
      background: none;
      border: none;
      padding: 0;
      color: #e2e8f0;
      font-size: 13.5px;
    }

    /* ── Tables ────────────────────────────────────── */
    .table-wrapper {
      margin: 20px 0;
      overflow-x: auto;
      border-radius: 10px;
      border: 1px solid var(--border);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    thead { background: var(--surface); }

    th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 700;
      color: var(--text);
      border-bottom: 2px solid var(--border);
      white-space: nowrap;
    }

    td {
      padding: 10px 16px;
      border-bottom: 1px solid var(--border);
      color: var(--text-secondary);
    }

    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover { background: var(--surface); }

    /* ── Horizontal Rule ───────────────────────────── */
    hr {
      margin: 30px 0;
      border: none;
      border-top: 1px solid var(--border);
    }

    /* ── Images ────────────────────────────────────── */
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 12px 0;
    }

    /* ── Page Break Hints (for PDF) ────────────────── */
    h1, h2, h3 { page-break-after: avoid; }
    pre, table, blockquote { page-break-inside: avoid; }
    p, li { orphans: 3; widows: 3; }

    /* ── Print Styles ──────────────────────────────── */
    @media print {
      body { font-size: 12pt; }
      .notes-container { padding: 0; max-width: 100%; }
      pre.code-block { white-space: pre-wrap; word-wrap: break-word; }
    }

    /* ── Responsive ────────────────────────────────── */
    @media (max-width: 768px) {
      .notes-container { padding: 20px 16px; }
      .topic-header h1 { font-size: 1.5rem; }
      h2 { font-size: 1.25rem; }
      table { font-size: 13px; }
      th, td { padding: 8px 10px; }
    }
  </style>
</head>
<body>
  <div class="notes-container">
    <div class="topic-header">
      <h1>${escapeHtml(topic)}</h1>
      <div class="meta">
        ${difficultyBadge}
        ${typeBadge}
        <span>Generated on ${dateStr}</span>
      </div>
    </div>
    <div class="notes-body">
      ${bodyHtml}
    </div>
  </div>
</body>
</html>`;
}

/**
 * Convert raw AI-generated markdown into body-only HTML (no full page template).
 * Useful for embedding formatted notes into other pages or components.
 */
export function formatNotesBodyHtml(markdown: string): string {
  const cleaned = cleanMarkdown(markdown);
  return marked.parse(cleaned) as string;
}

/**
 * Parse markdown into structured sections for frontend accordion display.
 * Returns an array of section objects with title, content, and bullet points.
 */
export function parseMarkdownToSections(markdown: string): Array<{
  title: string;
  content: string;
  bulletPoints: string[];
}> {
  const sections: Array<{ title: string; content: string; bulletPoints: string[] }> = [];
  const lines = markdown.split("\n");
  let currentSection: { title: string; content: string; bulletPoints: string[] } | null = null;

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,4}\s+(.+)/);
    if (headingMatch) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        title: headingMatch[1].replace(/\*+/g, "").trim(),
        content: "",
        bulletPoints: [],
      };
    } else if (currentSection) {
      const trimmed = line.trim();
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        currentSection.bulletPoints.push(trimmed.replace(/^[-*]\s+/, ""));
      } else if (trimmed.startsWith("|")) {
        // Skip table formatting lines (|---|, etc.)
        if (!trimmed.match(/^\|[\s\-:|]+\|$/)) {
          currentSection.content += trimmed + "\n";
        }
      } else if (trimmed) {
        currentSection.content += trimmed + "\n";
      }
    }
  }

  if (currentSection) sections.push(currentSection);

  // Clean up content
  for (const section of sections) {
    section.content = section.content.trim();
    // Remove multiple blank lines
    section.content = section.content.replace(/\n{3,}/g, "\n\n");
  }

  if (sections.length === 0) {
    return [{ title: "Generated Notes", content: markdown, bulletPoints: [] }];
  }

  return sections;
}
