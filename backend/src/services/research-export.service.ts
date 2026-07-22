import type { GeneratedPaper } from "./research.service";
import { renderPaperHTMLByTemplate, getTemplateMeta } from "./template-engine.service";

// ============================================================================
// 1. PDF EXPORT (via Puppeteer with dynamic template HTML rendering)
// ============================================================================

export async function exportPaperPdf(paper: GeneratedPaper, templateId: string = "IEEE"): Promise<Buffer> {
  const { default: puppeteer } = await import("puppeteer");

  const html = renderPaperHTMLByTemplate(paper, templateId);
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const paperTitleStr = typeof paper.title === "string" ? paper.title : (Array.isArray(paper.title) ? (paper.title as string[]).join(", ") : "Untitled");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", bottom: "18mm", left: "15mm", right: "15mm" },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:8px;font-family:serif;text-align:center;width:100%;color:#64748b;">${escapeHtmlHeader(paperTitleStr)} • ${templateId.toUpperCase()} Template</div>`,
      footerTemplate: `<div style="font-size:8px;font-family:serif;text-align:center;width:100%;color:#64748b;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser?.close();
  }
}

function escapeHtmlHeader(str: string | string[]): string {
  const text = typeof str === "string" ? str : (Array.isArray(str) ? str.join(", ") : "");
  return (text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ============================================================================
// 2. DOCX EXPORT (HTML formatted payload for Word compatibility)
// ============================================================================

export async function exportPaperDocx(paper: GeneratedPaper, templateId: string = "IEEE"): Promise<Buffer> {
  const html = renderPaperHTMLByTemplate(paper, templateId);
  const paperTitleStr = typeof paper.title === "string" ? paper.title : "Untitled Paper";
  const docxHtml = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head><meta charset='utf-8'><title>${escapeHtmlHeader(paperTitleStr)}</title></head>
  <body>${html}</body>
  </html>`;
  return Buffer.from(docxHtml, "utf-8");
}

// ============================================================================
// 3. LATEX (.tex) EXPORT (Professional TeX source file generation)
// ============================================================================

export async function exportPaperLatex(paper: GeneratedPaper, templateId: string = "IEEE"): Promise<string> {
  const docClass = templateId === "ACM" ? "\\documentclass[sigconf]{acmart}" : (templateId === "Springer-LNCS" ? "\\documentclass{llncs}" : "\\documentclass[conference]{IEEEtran}");

  const authorsTex = paper.authors && paper.authors.length > 0
    ? paper.authors.map((a) => `\\author{\\IEEEauthorblockN{${sanitizeLatex(a)}}\n\\IEEEauthorblockA{\\textit{Department of Computer Science}\\\\Institution}}`).join("\n\\and\n")
    : "\\author{\\IEEEauthorblockN{Anonymous Author}}";

  const sectionsTex = paper.sections
    .filter(s => s.id !== "references")
    .map(s => `\\section{${sanitizeLatex(s.title)}}\n${markdownToLatex(s.content)}`)
    .join("\n\n");

  const refsTex = paper.references
    .map((r, i) => `\\bibitem{ref${i + 1}}\n${sanitizeLatex(r.authors?.join(", ") || "Author")}, "\`\`${sanitizeLatex(r.title)}'', \\textit{${sanitizeLatex(r.journal || r.source || "Proceedings")}}, ${r.year}.`)
    .join("\n\n");

  const paperTitleStr = typeof paper.title === "string" ? paper.title : "Untitled Paper";

  return `${docClass}
\\usepackage{cite}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{algorithmic}
\\usepackage{graphicx}
\\usepackage{textcomp}
\\usepackage{xcolor}

\\begin{document}

\\title{${sanitizeLatex(paperTitleStr)}}

${authorsTex}

\\maketitle

\\begin{abstract}
${sanitizeLatex(paper.abstract)}
\\end{abstract}

\\begin{IEEEkeywords}
${sanitizeLatex(paper.keywords?.join(", ") || "Research, AI")}
\\end{IEEEkeywords}

${sectionsTex}

\\begin{thebibliography}{99}
${refsTex}
\\end{thebibliography}

\\end{document}`;
}

// ============================================================================
// 4. MARKDOWN (.md) EXPORT
// ============================================================================

export async function exportPaperMarkdown(paper: GeneratedPaper): Promise<string> {
  const authorsStr = paper.authors?.join(", ") || "Anonymous Author";
  const keywordsStr = paper.keywords?.join(", ") || "Research";

  const sectionsMd = paper.sections
    .filter(s => s.id !== "references")
    .map(s => `## ${s.title}\n\n${s.content}`)
    .join("\n\n");

  const refsMd = paper.references
    .map((r, i) => `[${i + 1}] ${r.authors?.join(", ") || "Author"}. "${r.title}." *${r.journal || r.source || "Publication"}*, ${r.year}.${r.doi ? ` DOI: ${r.doi}` : ""}`)
    .join("\n");

  return `# ${paper.title}

**Authors:** ${authorsStr}  
**Keywords:** ${keywordsStr}  
**Template:** ${paper.metadata?.template || "IEEE"}  

---

### Abstract
${paper.abstract}

---

${sectionsMd}

---

## References
${refsMd}
`;
}

export async function exportPaperBibtex(paper: GeneratedPaper): Promise<string> {
  return paper.references.map((r, i) => {
    const key = `ref_${r.year}_${i + 1}`;
    const authorStr = r.authors?.join(" and ") || "Author, A.";
    return `@article{${key},
  author = {${authorStr}},
  title = {{${r.title}}},
  journal = {${r.journal || r.source || "Scientific Journal"}},
  year = {${r.year}},
  ${r.doi ? `doi = {${r.doi}},` : ""}
}`;
  }).join("\n\n");
}

function sanitizeLatex(str: string): string {
  return (str || "")
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function markdownToLatex(md: string): string {
  return (md || "")
    .replace(/^### (.+)$/gm, "\\subsection{$1}")
    .replace(/^## (.+)$/gm, "\\section{$1}")
    .replace(/\*\*(.*?)\*\*/g, "\\textbf{$1}")
    .replace(/\*(.*?)\*/g, "\\textit{$1}");
}
