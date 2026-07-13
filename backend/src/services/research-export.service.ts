import type { GeneratedPaper, ScholarSource } from "./research.service";

// ============================================================================
// PDF EXPORT (via Puppeteer, matching existing codebase pattern)
// ============================================================================

export async function exportPaperPdf(paper: GeneratedPaper): Promise<Buffer> {
  const { default: puppeteer } = await import("puppeteer");

  const html = buildPaperHtml(paper);
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "25mm", bottom: "25mm", left: "20mm", right: "20mm" },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:8px;text-align:center;width:100%;color:#999;">${paper.title}</div>`,
      footerTemplate: `<div style="font-size:8px;text-align:center;width:100%;color:#999;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser?.close();
  }
}

function markdownToSimpleHtml(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\[Table (\d+)\]/g, "<em>[Table $1]</em>")
    .replace(/\[Figure (\d+)\]/g, "<em>[Figure $1]</em>")
    .replace(/\[(\d+)\]/g, "<sup>[$1]</sup>");

  // Convert simple tables
  html = html.replace(/(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)+)/g, (_match, header: string, _sep: string, rows: string) => {
    const ths = header.split("|").filter((c: string) => c.trim()).map((c: string) => `<th>${c.trim()}</th>`).join("");
    const body = rows.trim().split("\n").map((row: string) => {
      const tds = row.split("|").filter((c: string) => c.trim()).map((c: string) => `<td>${c.trim()}</td>`).join("");
      return `<tr>${tds}</tr>`;
    }).join("\n");
    return `<table><thead><tr>${ths}</tr></thead><tbody>${body}</tbody></table>`;
  });

  // Wrap non-tag lines in <p>
  html = html.split("\n").map(line => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("<")) return trimmed;
    return `<p>${trimmed}</p>`;
  }).join("\n");

  return html;
}

function buildPaperHtml(paper: GeneratedPaper): string {
  const sectionsHtml = paper.sections
    .filter(s => s.id !== "references")
    .map(s => {
      const body = markdownToSimpleHtml(s.content);
      return `<div class="section"><h2>${s.title}</h2>${body}</div>`;
    })
    .join("\n");

  const refsHtml = paper.references
    .map((r, i) => {
      const authors = r.authors.length > 3
        ? `${r.authors.slice(0, 3).join(", ")}, et al.`
        : r.authors.join(", ");
      return `<li id="ref-${i + 1}">[${i + 1}] ${authors}. "${r.title}." ${r.journal ? r.journal + ", " : ""}${r.year}.${r.doi ? ` DOI: ${r.doi}` : ""}</li>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.6; color: #111; max-width: 100%; margin: 0; padding: 0; }
  h1 { text-align: center; font-size: 16pt; margin-bottom: 4pt; }
  .authors { text-align: center; font-size: 10pt; color: #444; margin-bottom: 6pt; }
  .keywords { text-align: center; font-size: 9pt; color: #666; margin-bottom: 16pt; }
  .keywords span { font-weight: bold; }
  h2 { font-size: 12pt; margin-top: 18pt; margin-bottom: 6pt; text-transform: uppercase; }
  p { margin: 6pt 0; text-align: justify; }
  table { border-collapse: collapse; width: 100%; margin: 10pt 0; font-size: 9pt; }
  th, td { border: 1px solid #333; padding: 4pt 8pt; text-align: left; }
  th { background: #f0f0f0; font-weight: bold; }
  ol.references { font-size: 9pt; line-height: 1.4; padding-left: 20pt; }
  ol.references li { margin-bottom: 3pt; }
  .section { page-break-inside: avoid; }
  @media print { .section { page-break-inside: avoid; } }
</style>
</head>
<body>
  <h1>${paper.title}</h1>
  <div class="authors">${paper.authors.join(", ")}</div>
  <div class="keywords"><span>Keywords:</span> ${paper.keywords.join(", ")}</div>
  ${sectionsHtml}
  <div class="section">
    <h2>References</h2>
    <ol class="references">${refsHtml}</ol>
  </div>
</body>
</html>`;
}

// ============================================================================
// DOCX EXPORT (via docx package, matching existing codebase pattern)
// ============================================================================

export async function exportPaperDocx(paper: GeneratedPaper): Promise<Buffer> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, TabStopPosition, TabStopType } = await import("docx");

  const children: InstanceType<typeof Paragraph>[] = [];

  // Title
  children.push(new Paragraph({
    children: [new TextRun({ text: paper.title, bold: true, size: 32, font: "Times New Roman" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }));

  // Authors
  children.push(new Paragraph({
    children: [new TextRun({ text: paper.authors.join(", "), size: 22, font: "Times New Roman", color: "666666" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
  }));

  // Keywords
  children.push(new Paragraph({
    children: [
      new TextRun({ text: "Keywords: ", bold: true, size: 20, font: "Times New Roman" }),
      new TextRun({ text: paper.keywords.join(", "), size: 20, font: "Times New Roman", italics: true }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
  }));

  // Sections
  for (const section of paper.sections) {
    if (section.id === "references") continue;

    children.push(new Paragraph({
      children: [new TextRun({ text: section.title, bold: true, size: 24, font: "Times New Roman" })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 150 },
    }));

    const paragraphs = section.content.split("\n").filter(p => p.trim());
    for (const para of paragraphs) {
      children.push(new Paragraph({
        children: [new TextRun({ text: para.trim(), size: 22, font: "Times New Roman" })],
        spacing: { after: 120 },
        indent: { firstLine: 480 },
      }));
    }
  }

  // References
  children.push(new Paragraph({
    children: [new TextRun({ text: "References", bold: true, size: 24, font: "Times New Roman" })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
  }));

  paper.references.forEach((ref, i) => {
    const authors = ref.authors.length > 3
      ? `${ref.authors.slice(0, 3).join(", ")}, et al.`
      : ref.authors.join(", ");
    children.push(new Paragraph({
      children: [new TextRun({
        text: `[${i + 1}] ${authors}. "${ref.title}." ${ref.journal ? ref.journal + ", " : ""}${ref.year}.${ref.doi ? ` DOI: ${ref.doi}` : ""}`,
        size: 18,
        font: "Times New Roman",
      })],
      spacing: { after: 60 },
    }));
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
        },
      },
      children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

// ============================================================================
// LATEX EXPORT
// ============================================================================

export function exportPaperLatex(paper: GeneratedPaper): string {
  const escapeLatex = (s: string) =>
    s.replace(/\\/g, "\\textbackslash{}")
      .replace(/[&%$#_{}]/g, m => `\\${m}`)
      .replace(/~/g, "\\textasciitilde{}")
      .replace(/\^/g, "\\textasciicircum{}");

  let latex = `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{geometry}
\\usepackage{graphicx}
\\usepackage{amsmath}
\\usepackage{hyperref}
\\usepackage{booktabs}
\\usepackage{cite}

\\geometry{margin=1in}

\\title{${escapeLatex(paper.title)}}
\\author{${paper.authors.map(escapeLatex).join(" \\\\ ")}}
\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
${escapeLatex(paper.abstract)}
\\end{abstract}

\\textbf{Keywords:} ${paper.keywords.map(escapeLatex).join(", ")}

\\bigskip
`;

  for (const section of paper.sections) {
    if (section.id === "references") continue;

    const label = section.id.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    latex += `\\section{${escapeLatex(section.title)}}\n\\label{sec:${label}}\n\n`;

    const paragraphs = section.content.split("\n").filter(p => p.trim());
    for (const para of paragraphs) {
      // Escape LaTeX special chars first, then convert markdown to LaTeX
      const escaped = escapeLatex(para);
      const cleaned = escaped
        .replace(/\*\*(.*?)\*\*/g, "\\textbf{$1}")
        .replace(/\*(.*?)\*/g, "\\emph{$1}");
      latex += `${cleaned}\n\n`;
    }
  }

  // References
  latex += `\\section*{References}\n\\begin{thebibliography}{99}\n`;
  paper.references.forEach((ref, i) => {
    const authors = ref.authors.length > 3
      ? `${ref.authors.slice(0, 3).join(", ")}, et al.`
      : ref.authors.join(", ");
    latex += `\\bibitem{ref${i + 1}} ${escapeLatex(authors)}. {\\em ${escapeLatex(ref.title)}.} ${escapeLatex(ref.journal || "")}${ref.journal ? ", " : ""}${ref.year}.${ref.doi ? ` DOI: ${ref.doi}` : ""}\n`;
  });
  latex += `\\end{thebibliography}\n\\end{document}\n`;

  return latex;
}

// ============================================================================
// BIBTEX EXPORT
// ============================================================================

export function exportPaperBibtex(paper: GeneratedPaper): string {
  const escapeBibtex = (s: string) => s.replace(/[&%#_{}]/g, m => `\\${m}`);

  let bib = "";
  paper.references.forEach((ref, i) => {
    const key = `ref${i + 1}`;
    const authors = ref.authors.join(" and ");
    const title = escapeBibtex(ref.title);
    const journal = ref.journal ? escapeBibtex(ref.journal) : "arXiv preprint";

    bib += `@article{${key},\n`;
    bib += `  author = {${authors}},\n`;
    bib += `  title = {${title}},\n`;
    bib += `  journal = {${journal}},\n`;
    bib += `  year = {${ref.year}},\n`;
    if (ref.doi) bib += `  doi = {${ref.doi}},\n`;
    if (ref.url) bib += `  url = {${ref.url}},\n`;
    bib += `}\n\n`;
  });

  return bib;
}
