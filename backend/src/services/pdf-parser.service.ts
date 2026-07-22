export interface ParsedPDFResult {
  title: string;
  authors: string[];
  abstract: string;
  year?: number;
  doi?: string;
  keywords: string[];
  references: Array<{
    title: string;
    authors: string[];
    year?: number;
    rawText: string;
  }>;
  rawText: string;
}

export async function parseUploadedPDFBuffer(buffer: Buffer): Promise<ParsedPDFResult> {
  let parsedText = "";
  try {
    const pdf = require("pdf-parse");
    const parseFn = typeof pdf === "function" ? pdf : (pdf.PDFParse || pdf.default);
    if (typeof parseFn === "function") {
      const pdfData = await parseFn(buffer);
      parsedText = pdfData.text || "";
    } else {
      parsedText = buffer.toString("utf-8").slice(0, 10000);
    }
  } catch (err: any) {
    console.warn("[PDFParser] Fallback text extraction for PDF failed:", err.message);
    parsedText = buffer.toString("utf-8").slice(0, 10000);
  }

  // Clean raw text
  const cleanText = parsedText.replace(/\r\n/g, "\n").replace(/\t/g, " ");
  const lines = cleanText.split("\n").map(l => l.trim()).filter(Boolean);

  // Heuristic extractions
  const title = lines.slice(0, 3).join(" ").slice(0, 200) || "Uploaded Research Paper";

  // Abstract extraction
  let abstract = "";
  const abstractMatch = cleanText.match(/abstract[\s:-]+([\s\S]*?)(?:1\.\s+introduction|introduction|keywords|1\s+introduction)/i);
  if (abstractMatch && abstractMatch[1]) {
    abstract = abstractMatch[1].trim().replace(/\s+/g, " ").slice(0, 1500);
  } else {
    abstract = lines.slice(3, 12).join(" ").slice(0, 800);
  }

  // Keywords extraction
  let keywords: string[] = [];
  const kwMatch = cleanText.match(/keywords[\s:-]+([^\n\r.]+)/i);
  if (kwMatch && kwMatch[1]) {
    keywords = kwMatch[1].split(/[,;]/).map(k => k.trim()).filter(Boolean).slice(0, 10);
  }

  // DOI extraction
  const doiMatch = cleanText.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);
  const doi = doiMatch ? doiMatch[0] : undefined;

  // Year extraction
  const yearMatch = cleanText.match(/\b(19\d\d|20\d\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

  // References extraction
  const references: ParsedPDFResult["references"] = [];
  const refIndex = cleanText.toLowerCase().lastIndexOf("references");
  if (refIndex !== -1) {
    const refSection = cleanText.slice(refIndex);
    const refLines = refSection.split("\n").slice(1).filter(l => l.length > 10);
    for (let i = 0; i < Math.min(refLines.length, 25); i++) {
      const line = refLines[i];
      references.push({
        title: line.slice(0, 150),
        authors: [],
        year: year,
        rawText: line,
      });
    }
  }

  return {
    title,
    authors: ["Primary Author"],
    abstract,
    year,
    doi,
    keywords,
    references,
    rawText: cleanText.slice(0, 20000),
  };
}
