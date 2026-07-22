import type { GeneratedPaper } from "./research.service";

export interface AcademicTemplateMeta {
  id: string;
  name: string;
  category: "Conference" | "Journal" | "Institutional" | "Specialized";
  columns: 1 | 2;
  fontFamily: string;
  fontSize: string;
  description: string;
  previewThumbnail?: string;
}

export const ACADEMIC_TEMPLATES: AcademicTemplateMeta[] = [
  { id: "IEEE", name: "IEEE Conference", category: "Conference", columns: 2, fontFamily: "'Times New Roman', Times, serif", fontSize: "10pt", description: "Standard IEEE two-column format for conference proceedings." },
  { id: "IEEE-Journal", name: "IEEE Transactions Journal", category: "Journal", columns: 2, fontFamily: "'Times New Roman', Times, serif", fontSize: "9.5pt", description: "Formal IEEE Transactions layout with author affiliations and page headers." },
  { id: "ACM", name: "ACM Primary Article", category: "Conference", columns: 2, fontFamily: "Helvetica, Arial, sans-serif", fontSize: "9pt", description: "Official Association for Computing Machinery publication template." },
  { id: "Springer-LNCS", name: "Springer LNCS", category: "Conference", columns: 1, fontFamily: "Computer Modern, 'Times New Roman', serif", fontSize: "10pt", description: "Lecture Notes in Computer Science single-column format." },
  { id: "Elsevier", name: "Elsevier ScienceDirect", category: "Journal", columns: 2, fontFamily: "'Times New Roman', serif", fontSize: "10pt", description: "Two-column article style formatted for Elsevier journals." },
  { id: "Nature", name: "Nature Science Style", category: "Journal", columns: 1, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "10.5pt", description: "High-impact single-column journal format with summary lead paragraph." },
  { id: "Thesis", name: "University Academic Thesis", category: "Institutional", columns: 1, fontFamily: "'Times New Roman', serif", fontSize: "12pt", description: "Formatted for Master & PhD dissertation chapter submissions." },
  { id: "TechReport", name: "Technical Report", category: "Institutional", columns: 1, fontFamily: "Inter, Roboto, sans-serif", fontSize: "10.5pt", description: "Corporate and institutional R&D technical paper format." },
  { id: "Survey", name: "Comprehensive Survey Paper", category: "Specialized", columns: 2, fontFamily: "'Times New Roman', serif", fontSize: "10pt", description: "Multi-taxonomy survey paper with comparison tables and classification matrices." },
  { id: "Review", name: "State-of-the-Art Review", category: "Specialized", columns: 1, fontFamily: "Georgia, serif", fontSize: "11pt", description: "Systematic literature review paper layout." },
];

export function getTemplateMeta(templateId: string): AcademicTemplateMeta {
  return ACADEMIC_TEMPLATES.find(t => t.id.toLowerCase() === templateId.toLowerCase()) || ACADEMIC_TEMPLATES[0];
}

export function renderPaperHTMLByTemplate(paper: GeneratedPaper, templateId: string): string {
  const meta = getTemplateMeta(templateId);
  const isTwoCol = meta.columns === 2;

  const authorsText = paper.authors && paper.authors.length > 0
    ? paper.authors.join(", ")
    : "Anonymous Author(s)";

  const keywordsText = paper.keywords && paper.keywords.length > 0
    ? paper.keywords.join(", ")
    : "Research, Artificial Intelligence, Scientific Method";

  const sectionsHtml = paper.sections
    .filter(s => s.id !== "references")
    .map(s => {
      const body = formatMarkdownContent(s.content);
      return `<section class="paper-section"><h2>${s.title}</h2>${body}</section>`;
    })
    .join("\n");

  const refsHtml = paper.references
    .map((r, i) => {
      const authors = r.authors && r.authors.length > 3
        ? `${r.authors.slice(0, 3).join(", ")}, et al.`
        : (r.authors?.join(", ") || "Unknown Author");
      return `<li id="ref-${i + 1}">[${i + 1}] ${authors}, "${r.title}," <em>${r.journal || r.source || "Proceedings"}</em>, ${r.year}.${r.doi ? ` DOI: ${r.doi}` : ""}</li>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(paper.title)}</title>
<style>
  @page { size: A4; margin: 20mm 15mm 20mm 15mm; }
  body {
    font-family: ${meta.fontFamily};
    font-size: ${meta.fontSize};
    line-height: 1.5;
    color: #111827;
    margin: 0;
    padding: 20px;
    background: #ffffff;
  }
  .paper-header {
    text-align: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: ${templateId === "Thesis" ? "2px solid #111" : "1px solid #e5e7eb"};
  }
  .paper-title {
    font-size: ${templateId === "Thesis" ? "22pt" : "18pt"};
    font-weight: 800;
    margin: 0 0 10px 0;
    line-height: 1.25;
    color: #030712;
  }
  .paper-authors {
    font-size: 10pt;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
  }
  .paper-meta-badge {
    display: inline-block;
    padding: 3px 8px;
    font-size: 8pt;
    font-weight: 700;
    background: #f3f4f6;
    border-radius: 4px;
    color: #4b5563;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
  }
  .abstract-box {
    background: ${meta.category === "Journal" ? "transparent" : "#f9fafb"};
    border: ${meta.category === "Journal" ? "none" : "1px solid #e5e7eb"};
    border-left: ${meta.category === "Journal" ? "3px solid #2563eb" : "1px solid #e5e7eb"};
    padding: 12px 16px;
    margin: 0 auto 20px auto;
    font-size: 9.5pt;
    font-style: italic;
    border-radius: 6px;
    max-width: 92%;
  }
  .abstract-title {
    font-weight: 800;
    font-style: normal;
    text-transform: uppercase;
    font-size: 9pt;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
    color: #1e293b;
  }
  .keywords-line {
    font-size: 8.5pt;
    font-style: normal;
    margin-top: 8px;
    color: #475569;
  }
  .keywords-line span {
    font-weight: 700;
    color: #0f172a;
  }
  .paper-body {
    ${isTwoCol ? "column-count: 2; column-gap: 20px; column-fill: balance;" : ""}
  }
  .paper-section {
    margin-bottom: 18px;
    break-inside: avoid-column;
  }
  h2 {
    font-size: 11pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 4px;
    margin-top: 16px;
    margin-bottom: 8px;
    color: #0f172a;
  }
  h3 {
    font-size: 10pt;
    font-weight: 700;
    margin-top: 12px;
    margin-bottom: 4px;
    color: #1e293b;
  }
  p {
    margin: 0 0 8px 0;
    text-align: justify;
    text-justify: inter-word;
    text-indent: 12px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 8.5pt;
    break-inside: avoid;
  }
  th, td {
    border: 1px solid #cbd5e1;
    padding: 5px 8px;
    text-align: left;
  }
  th {
    background: #f1f5f9;
    font-weight: 700;
  }
  .references-list {
    font-size: 8.5pt;
    padding-left: 18px;
    line-height: 1.4;
  }
  .references-list li {
    margin-bottom: 4px;
    text-align: justify;
  }
</style>
</head>
<body>
  <div class="paper-header">
    <div class="paper-meta-badge">${escapeHtml(meta.name)} • ${escapeHtml(paper.metadata?.citationStyle || "IEEE")} Style</div>
    <h1 class="paper-title">${escapeHtml(paper.title)}</h1>
    <div class="paper-authors">${escapeHtml(authorsText)}</div>
  </div>

  <div class="abstract-box">
    <div class="abstract-title">Abstract</div>
    <div>${escapeHtml(paper.abstract)}</div>
    <div class="keywords-line"><span>Keywords—</span>${escapeHtml(keywordsText)}</div>
  </div>

  <div class="paper-body">
    ${sectionsHtml}

    <section class="paper-section">
      <h2>References</h2>
      <ol class="references-list">
        ${refsHtml}
      </ol>
    </section>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMarkdownContent(md: string): string {
  let html = (md || "")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code style='background:#f1f5f9;padding:2px 4px;border-radius:4px;font-size:0.85em;'>$1</code>");

  // Markdown tables to HTML tables
  html = html.replace(/(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)+)/g, (_match, header: string, _sep: string, rows: string) => {
    const ths = header.split("|").filter((c: string) => c.trim()).map((c: string) => `<th>${escapeHtml(c.trim())}</th>`).join("");
    const body = rows.trim().split("\n").map((row: string) => {
      const tds = row.split("|").filter((c: string) => c.trim()).map((c: string) => `<td>${escapeHtml(c.trim())}</td>`).join("");
      return `<tr>${tds}</tr>`;
    }).join("\n");
    return `<table><thead><tr>${ths}</tr></thead><tbody>${body}</tbody></table>`;
  });

  const lines = html.split("\n");
  const result: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("<h") || trimmed.startsWith("<table") || trimmed.startsWith("<ul") || trimmed.startsWith("<ol") || trimmed.startsWith("<section") || trimmed.startsWith("<code")) {
      result.push(trimmed);
    } else {
      result.push(`<p>${trimmed}</p>`);
    }
  }

  return result.join("\n");
}
