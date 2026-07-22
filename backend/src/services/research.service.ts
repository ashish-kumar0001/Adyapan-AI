import { generateText, generateJSON, MODELS } from "../lib/ai/openrouter";

// ============================================================================
// TYPES
// ============================================================================

export interface ResearchConfig {
  topic: string;
  field?: string;
  researchType?: string;
  template?: string;
  paperLength?: string;
  citationStyle?: string;
  options?: {
    includeTables?: boolean;
    includeEquations?: boolean;
    generateGraphs?: boolean;
    addFutureWork?: boolean;
    addLimitations?: boolean;
    generateAbstractLast?: boolean;
  };
}

export interface ScholarSource {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  doi?: string;
  url: string;
  source: string;
  citationCount?: number;
  journal?: string;
}

export interface PaperSection {
  id: string;
  title: string;
  content: string;
  type: "text" | "table" | "equation" | "placeholder";
}

export interface GeneratedPaper {
  title: string;
  authors: string[];
  abstract: string;
  keywords: string[];
  sections: PaperSection[];
  references: ScholarSource[];
  metadata: {
    template: string;
    citationStyle: string;
    wordCount: number;
    pageCount: number;
    sourceCount: number;
  };
}

export interface ResearchProgress {
  step: string;
  message: string;
  percent: number;
  sourcesFound: number;
}

// ============================================================================
// SCHOLARLY API FETCHERS
// ============================================================================

async function fetchArxiv(query: string, maxResults: number = 20): Promise<ScholarSource[]> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `http://export.arxiv.org/api/query?search_query=all:${encoded}&start=0&max_results=${maxResults}&sortBy=relevance`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const text = await res.text();

    const entries: ScholarSource[] = [];
    const entryBlocks = text.split("<entry>").slice(1);

    for (const block of entryBlocks) {
      const title = (block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "").replace(/\s+/g, " ").trim();
      const summary = (block.match(/<summary>([\s\S]*?)<\/summary>/)?.[1] || "").replace(/\s+/g, " ").trim();
      const id = (block.match(/<id>(.*?)<\/id>/)?.[1] || "").trim();
      const published = (block.match(/<published>(.*?)<\/published>/)?.[1] || "").slice(0, 4);
      const authors = [...block.matchAll(/<name>(.*?)<\/name>/g)].map(m => m[1].trim());

      if (title) {
        entries.push({
          id: `arxiv-${entries.length}`,
          title,
          authors,
          year: parseInt(published) || new Date().getFullYear(),
          abstract: summary,
          url: id || "",
          source: "arXiv",
        });
      }
    }
    return entries;
  } catch {
    return [];
  }
}

async function fetchSemanticScholar(query: string, limit: number = 20): Promise<ScholarSource[]> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encoded}&limit=${limit}&fields=title,authors,year,abstract,externalIds,citationCount,url,journal`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const data = await res.json() as any;

    return (data.data || []).map((p: any, i: number) => ({
      id: `ss-${i}`,
      title: p.title || "",
      authors: (p.authors || []).map((a: any) => a.name).slice(0, 6),
      year: p.year || new Date().getFullYear(),
      abstract: p.abstract || "",
      doi: p.externalIds?.DOI,
      url: p.url || p.externalIds?.DOI ? `https://doi.org/${p.externalIds?.DOI}` : "",
      source: "Semantic Scholar",
      citationCount: p.citationCount,
      journal: p.journal?.name,
    }));
  } catch {
    return [];
  }
}

async function fetchCrossref(query: string, limit: number = 20): Promise<ScholarSource[]> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://api.crossref.org/works?query=${encoded}&rows=${limit}&select=DOI,title,author,published-print,abstract,URL,is-referenced-by-count,container-title`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const data = await res.json() as any;

    return (data.message?.items || []).map((item: any, i: number) => ({
      id: `crossref-${i}`,
      title: (item.title?.[0] || "").replace(/<[^>]*>/g, ""),
      authors: (item.author || []).map((a: any) => `${a.given || ""} ${a.family || ""}`.trim()).slice(0, 6),
      year: item["published-print"]?.["date-parts"]?.[0]?.[0] || new Date().getFullYear(),
      abstract: (item.abstract || "").replace(/<[^>]*>/g, ""),
      doi: item.DOI,
      url: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : ""),
      source: "Crossref",
      citationCount: item["is-referenced-by-count"],
      journal: item["container-title"]?.[0],
    }));
  } catch {
    return [];
  }
}

async function fetchPubMed(query: string, limit: number = 20): Promise<ScholarSource[]> {
  try {
    const encoded = encodeURIComponent(query);
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encoded}&retmax=${limit}&retmode=json`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) });
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json() as any;
    const ids = searchData.esearchresult?.idlist || [];
    if (ids.length === 0) return [];

    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
    const summaryRes = await fetch(summaryUrl, { signal: AbortSignal.timeout(10000) });
    if (!summaryRes.ok) return [];
    const summaryData = await summaryRes.json() as any;

    return ids.map((id: string, i: number) => {
      const item = summaryData.result?.[id] || {};
      return {
        id: `pubmed-${i}`,
        title: item.title || "",
        authors: (item.authors || []).map((a: any) => a.name).slice(0, 6),
        year: parseInt((item.pubdate || "").slice(0, 4)) || new Date().getFullYear(),
        abstract: "",
        doi: item.elocationid || "",
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        source: "PubMed",
        journal: item.fulljournalname,
      };
    });
  } catch {
    return [];
  }
}

async function fetchGoogleScholarMetadata(query: string): Promise<ScholarSource[]> {
  // Google Scholar doesn't have a free API; use a serpapi-style approach or return empty
  // For now, we rely on the other sources which are more reliable
  return [];
}

// ============================================================================
// MAIN: FETCH ALL SOURCES
// ============================================================================

export async function fetchResearchSources(
  topic: string,
  onProgress?: (progress: ResearchProgress) => void
): Promise<ScholarSource[]> {
  const queries = [
    topic,
    `${topic} recent survey`,
    `${topic} deep learning machine learning`,
  ];

  onProgress?.({ step: "searching", message: "Searching scholarly databases...", percent: 10, sourcesFound: 0 });

  const [arxivResults, ssResults, crossrefResults, pubmedResults] = await Promise.allSettled([
    fetchArxiv(queries[0], 20),
    fetchSemanticScholar(queries[0], 20),
    fetchCrossref(queries[0], 20),
    fetchPubMed(queries[0], 15),
  ]);

  onProgress?.({ step: "searching", message: "Searching additional queries...", percent: 40, sourcesFound: 0 });

  const [arxivExtra, ssExtra] = await Promise.allSettled([
    fetchArxiv(queries[1], 10),
    fetchSemanticScholar(queries[2], 10),
  ]);

  const allSources: ScholarSource[] = [
    ...(arxivResults.status === "fulfilled" ? arxivResults.value : []),
    ...(arxivExtra.status === "fulfilled" ? arxivExtra.value : []),
    ...(ssResults.status === "fulfilled" ? ssResults.value : []),
    ...(ssExtra.status === "fulfilled" ? ssExtra.value : []),
    ...(crossrefResults.status === "fulfilled" ? crossrefResults.value : []),
    ...(pubmedResults.status === "fulfilled" ? pubmedResults.value : []),
  ];

  // Deduplicate by title similarity
  const seen = new Set<string>();
  const unique: ScholarSource[] = [];
  for (const s of allSources) {
    const key = s.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
    if (!seen.has(key) && s.title.length > 10) {
      seen.add(key);
      unique.push(s);
    }
  }

  // Sort by citation count (descending), then year
  unique.sort((a, b) => {
    if (b.citationCount && a.citationCount) return b.citationCount - a.citationCount;
    return b.year - a.year;
  });

  onProgress?.({ step: "sources", message: `Found ${unique.length} relevant sources`, percent: 60, sourcesFound: unique.length });

  return unique;
}

// ============================================================================
// AI: GENERATE OUTLINE
// ============================================================================

interface PaperOutline {
  title: string;
  sections: Array<{
    id: string;
    title: string;
    subsections: string[];
  }>;
}

export async function generateResearchOutline(
  config: ResearchConfig,
  sources: ScholarSource[]
): Promise<PaperOutline> {
  const sourceSummary = sources.slice(0, 25).map((s, i) =>
    `[${i + 1}] ${s.title} (${s.year}) - ${s.source}${s.doi ? ` DOI:${s.doi}` : ""}`
  ).join("\n");

  const templateGuide: Record<string, string> = {
    IEEE: "Follow IEEE transaction format: Abstract, Introduction, Related Work, Methodology, Results, Discussion, Conclusion. Use numbered sections (I, II, III...). Dense technical writing.",
    ACM: "Follow ACM format: Abstract, Introduction, Background, Design/Methodology, Evaluation, Discussion, Threats to Validity, Conclusion. More narrative style.",
    Springer: "Follow Springer LNCS format: Abstract, Introduction, State of the Art, Proposed Method, Experimental Results, Conclusion. Concise and well-structured.",
    Elsevier: "Follow Elsevier journal format: Abstract, Introduction, Literature Review, Methodology, Results and Discussion, Conclusion. Comprehensive with figures/tables.",
    APA: "Follow APA 7th edition format: Title Page, Abstract, Introduction, Literature Review, Method, Results, Discussion, References. Double-spaced, clear headings.",
  };

  const lengthGuide: Record<string, string> = {
    "Short (4-6 pages)": "Keep sections concise, 3000-4500 words total. Focus on core contributions.",
    "Medium (8-12 pages)": "Moderate depth, 5000-8000 words total. Balance between breadth and depth.",
    "Long (15-25 pages)": "Comprehensive coverage, 10000-18000 words total. Deep analysis with detailed subsections.",
  };

  const prompt = `Generate a detailed research paper outline for the topic: "${config.topic}"

Research Field: ${config.field || "Computer Science"}
Research Type: ${config.researchType || "Experimental"}
Template: ${config.template || "IEEE"}
Paper Length: ${config.paperLength || "Medium (8-12 pages)"}

Template Guidelines: ${templateGuide[config.template || "IEEE"] || templateGuide.IEEE}
Length Guidelines: ${lengthGuide[config.paperLength || "Medium (8-12 pages)"] || lengthGuide["Medium (8-12 pages)"]}

Key sources found:
${sourceSummary}

Generate a comprehensive outline with a compelling academic title and all necessary sections.
Include sections for: title, abstract, keywords, introduction, problem statement, objectives, literature review, research gap, methodology, algorithm/architecture, experiments, results, discussion, limitations, future work, conclusion, and references.

Output JSON:
{
  "title": "Academic paper title",
  "sections": [
    { "id": "abstract", "title": "Abstract", "subsections": [] },
    { "id": "introduction", "title": "I. Introduction", "subsections": ["Background", "Problem Statement", "Objectives", "Contributions"] },
    { "id": "literature-review", "title": "II. Literature Review", "subsections": ["[topic area 1]", "[topic area 2]", "Research Gap Analysis"] },
    { "id": "methodology", "title": "III. Proposed Methodology", "subsections": ["System Architecture", "Algorithm Design", "Dataset Description"] },
    { "id": "experiments", "title": "IV. Experimental Setup", "subsections": ["Implementation Details", "Evaluation Metrics", "Baselines"] },
    { "id": "results", "title": "V. Results and Analysis", "subsections": ["Quantitative Results", "Comparison Tables", "Discussion"] },
    { "id": "limitations", "title": "VI. Limitations", "subsections": [] },
    { "id": "future-work", "title": "VII. Future Work", "subsections": [] },
    { "id": "conclusion", "title": "VIII. Conclusion", "subsections": [] },
    { "id": "references", "title": "References", "subsections": [] }
  ]
}`;

  const fallback: PaperOutline = {
    title: config.topic,
    sections: [
      { id: "abstract", title: "Abstract", subsections: [] },
      { id: "introduction", title: "I. Introduction", subsections: ["Background", "Problem Statement", "Objectives", "Contributions"] },
      { id: "literature-review", title: "II. Literature Review", subsections: ["Related Work", "Research Gap"] },
      { id: "methodology", title: "III. Proposed Methodology", subsections: ["Architecture", "Algorithm"] },
      { id: "experiments", title: "IV. Experimental Setup", subsections: ["Setup", "Metrics"] },
      { id: "results", title: "V. Results and Analysis", subsections: ["Results", "Discussion"] },
      { id: "conclusion", title: "VI. Conclusion", subsections: [] },
      { id: "references", title: "References", subsections: [] },
    ],
  };

  return generateJSON<PaperOutline>(
    "You are an expert academic researcher. Generate structured, well-organized research paper outlines.",
    prompt,
    { model: MODELS.POWERFUL, responseFormat: { type: "json_object" } },
    fallback
  );
}

// ============================================================================
// AI: GENERATE INDIVIDUAL SECTION
// ============================================================================

const SECTION_SYSTEM = `You are an expert academic researcher and writer. Write scholarly content with proper academic tone, citations in [number] format, and rigorous analysis. Use markdown formatting with headings, bold, tables, and lists where appropriate. Write detailed, comprehensive academic content.`;

export async function generateSection(
  sectionId: string,
  sectionTitle: string,
  subsections: string[],
  config: ResearchConfig,
  sources: ScholarSource[],
  previousSections: string,
  title: string
): Promise<string> {
  const sourceCitations = sources.slice(0, 30).map((s, i) =>
    `[${i + 1}] ${s.authors.slice(0, 3).join(", ")}${s.authors.length > 3 ? " et al." : ""}. "${s.title}." ${s.journal ? s.journal + ", " : ""}${s.year}.${s.doi ? ` DOI: ${s.doi}` : ""}`
  ).join("\n");

  const sectionInstructions: Record<string, string> = {
    abstract: "Write a comprehensive abstract (150-300 words) summarizing the research problem, methodology, key findings, and conclusions. Use past tense for methods and results.",
    introduction: `Write a detailed introduction section with these subsections: ${subsections.join(", ")}. Include research context, problem motivation, clear objectives, and list 3-4 main contributions. Cite 5-8 relevant papers from the provided sources.`,
    "literature-review": `Write a thorough literature review covering: ${subsections.join(", ")}. Analyze and compare existing approaches, identify trends, and clearly articulate the research gap. Cite 10-15 papers from the provided sources.`,
    methodology: `Write a detailed methodology section covering: ${subsections.join(", ")}. Include system architecture description, algorithm pseudocode or steps, mathematical formulations if applicable, and dataset characteristics. Be specific and reproducible.`,
    experiments: `Write the experimental setup section covering: ${subsections.join(", ")}. Describe implementation details, hardware/software used, evaluation metrics, datasets, baseline methods, and experimental protocols.`,
    results: `Write comprehensive results and analysis covering: ${subsections.join(", ")}. Present findings with comparison tables, statistical analysis, and thorough discussion of results. Reference tables/figures with [Table X] and [Figure X].`,
    limitations: "Write a candid discussion of the limitations of this research. Include 3-5 specific limitations with explanations of their impact.",
    "future-work": "Write future research directions. Include 3-5 specific, actionable future work items with expected impact.",
    conclusion: "Write a strong conclusion summarizing key findings, contributions, and significance. Do not introduce new information.",
    "problem-statement": "Clearly define the research problem, its scope, and why existing solutions are inadequate.",
    objectives: "List 3-5 specific research objectives as bullet points.",
  };

  const instruction = sectionInstructions[sectionId] || `Write the ${sectionTitle} section. Be comprehensive and cite relevant papers.`;

  const lengthWords: Record<string, number> = {
    "Short (4-6 pages)": 500,
    "Medium (8-12 pages)": 800,
    "Long (15-25 pages)": 1200,
  };
  const targetWords = lengthWords[config.paperLength || "Medium (8-12 pages)"] || 800;

  const prompt = `Write the "${sectionTitle}" section for a research paper titled: "${title}"

Field: ${config.field || "Computer Science"}
Template: ${config.template || "IEEE"}
Citation Style: ${config.citationStyle || "IEEE"}

Section Instructions: ${instruction}

Target length: approximately ${targetWords} words (adjust based on section importance - abstract shorter, literature review and methodology longer).

IMPORTANT CITATION RULES:
- Use inline citations in format [1], [2], [3] etc. referencing the sources below
- Cite relevant sources naturally throughout the text
- For a Literature Review, cite at least 10 sources
- For Introduction, cite at least 5 sources
- For Methodology/Results, cite at least 3 sources

Available Sources (use these for citations):
${sourceCitations}

${previousSections ? `\nPreviously written sections (for context and consistency):\n${previousSections}` : ""}

Write ONLY the content for this section. Use markdown formatting.`;

  const fallback = `## ${sectionTitle}\n\n[Content generation for this section encountered an issue. Please use the AI Assistant to regenerate.]`;

  try {
    return await generateText(SECTION_SYSTEM, prompt, { model: MODELS.POWERFUL, maxTokens: 4096 });
  } catch (error) {
    console.warn(`[Research] Failed to generate section ${sectionId}:`, error);
    return fallback;
  }
}

// ============================================================================
// AI: GENERATE FULL PAPER
// ============================================================================

export async function generateFullPaper(
  config: ResearchConfig,
  sources: ScholarSource[],
  onProgress?: (progress: ResearchProgress) => void
): Promise<GeneratedPaper> {
  // Step 1: Generate outline
  onProgress?.({ step: "outline", message: "Generating research paper outline...", percent: 65, sourcesFound: sources.length });
  const outline = await generateResearchOutline(config, sources);

  // Step 2: Generate each section sequentially
  const sections: PaperSection[] = [];
  const totalSections = outline.sections.length;
  let previousSectionsText = "";

  for (let i = 0; i < totalSections; i++) {
    const sec = outline.sections[i];
    const percent = 68 + Math.round((i / totalSections) * 22);
    onProgress?.({
      step: "generating",
      message: `Generating: ${sec.title}...`,
      percent,
      sourcesFound: sources.length,
    });

    const content = await generateSection(
      sec.id,
      sec.title,
      sec.subsections,
      config,
      sources,
      previousSectionsText,
      outline.title
    );

    sections.push({
      id: sec.id,
      title: sec.title,
      content,
      type: "text",
    });

    previousSectionsText += `\n\n### ${sec.title}\n${content.slice(0, 500)}...`;
  }

  // Step 3: Generate keywords
  onProgress?.({ step: "keywords", message: "Generating keywords...", percent: 92, sourcesFound: sources.length });
  const keywordsPrompt = `Generate 5-8 academic keywords for a paper titled "${outline.title}" in ${config.field || "Computer Science"}. Return a JSON array of strings only.`;
  let keywords: string[] = [];
  try {
    keywords = await generateJSON<string[]>(
      "You are an academic indexer. Generate precise, relevant keywords.",
      keywordsPrompt,
      { model: MODELS.FAST, responseFormat: { type: "json_object" } },
      [config.topic || "Research", "AI", "Machine Learning"]
    );
  } catch {
    keywords = [config.topic || "Research", "AI", "Machine Learning", "Deep Learning", "Analysis"];
  }

  // Step 4: Format references
  onProgress?.({ step: "references", message: "Formatting references...", percent: 96, sourcesFound: sources.length });
  const topSources = sources.slice(0, Math.min(30, sources.length));

  // Calculate word count
  const allContent = sections.map(s => s.content).join(" ");
  const wordCount = allContent.split(/\s+/).filter(w => w.length > 0).length;

  onProgress?.({ step: "complete", message: "Research paper generated successfully!", percent: 100, sourcesFound: sources.length });

  return {
    title: outline.title,
    authors: ["AI-Assisted Research Generation"],
    abstract: sections.find(s => s.id === "abstract")?.content || "",
    keywords,
    sections,
    references: topSources,
    metadata: {
      template: config.template || "IEEE",
      citationStyle: config.citationStyle || "IEEE",
      wordCount,
      pageCount: Math.max(4, Math.round(wordCount / 500)),
      sourceCount: topSources.length,
    },
  };
}

// ============================================================================
// AI: SECTION REFINEMENT CHAT
// ============================================================================

export async function researchChat(
  message: string,
  paperContext: string,
  sources: ScholarSource[]
): Promise<string> {
  const sourceList = sources.slice(0, 20).map((s, i) =>
    `[${i + 1}] ${s.title} (${s.year})`
  ).join("\n");

  const prompt = `You are an expert AI research assistant helping a researcher write and refine an academic paper.

Current Paper Content (abbreviated):
"""
${paperContext.slice(0, 3000)}
"""

Available Sources:
${sourceList}

User Request: "${message}"

Respond helpfully. If asked to rewrite/expand/improve a section, provide the improved content. If asked to add citations, include proper [number] citations. Be concise but thorough.`;

  try {
    return await generateText(SECTION_SYSTEM, prompt, { model: MODELS.POWERFUL });
  } catch {
    return "I'm sorry, I encountered an error processing your request. Please try again.";
  }
}

// ============================================================================
// AI: GENERATE SUGGESTED TOPICS
// ============================================================================

export async function generateSuggestedTopics(): Promise<{
  trending: string[];
  recent: string[];
  recommended: string[];
}> {
  const prompt = `Generate research topic suggestions across Computer Science, AI/ML, Healthcare, Cybersecurity, IoT, and Finance domains.

Output JSON:
{
  "trending": [5 trending research topics in 2025-2026],
  "recent": [5 recent hot research topics],
  "recommended": [5 beginner-friendly research topics]
}`;

  return generateJSON<{ trending: string[]; recent: string[]; recommended: string[] }>(
    "You are an academic research advisor. Suggest timely, relevant, and interesting research topics.",
    prompt,
    { model: MODELS.FAST, responseFormat: { type: "json_object" } },
    {
      trending: [
        "Large Language Model Reasoning and Chain-of-Thought",
        "Multimodal AI for Healthcare Diagnostics",
        "Federated Learning for Privacy-Preserving AI",
        "Autonomous Systems and Reinforcement Learning",
        "AI-Generated Code Quality and Security",
      ],
      recent: [
        "Transformer Architecture Optimizations",
        "Graph Neural Networks for Drug Discovery",
        "Explainable AI in Critical Applications",
        "Edge AI and TinyML Deployment",
        "AI Ethics and Bias Mitigation",
      ],
      recommended: [
        "Transfer Learning for Low-Resource Languages",
        "CNN-based Image Classification with Small Datasets",
        "Sentiment Analysis Using BERT",
        "IoT Anomaly Detection with Machine Learning",
        "Fake News Detection Using NLP",
      ],
    }
  );
}

// ============================================================================
// AI: TEXT ENHANCEMENT TOOLS
// ============================================================================

export async function enhanceResearchText(
  text: string,
  mode: "grammar" | "academic_tone" | "plagiarism_reduction" | "expand" | "shorten" | "humanize" | "rewrite"
): Promise<{ enhancedText: string; mode: string }> {
  if (!text || text.trim().length === 0) {
    return { enhancedText: text, mode };
  }

  let promptGoal = "";
  switch (mode) {
    case "grammar":
      promptGoal = "Fix all grammar, spelling, punctuation, and typographical errors while preserving original academic meaning.";
      break;
    case "academic_tone":
      promptGoal = "Elevate to formal, objective, high-impact scientific academic prose. Use precise domain terminology and scholarly language.";
      break;
    case "plagiarism_reduction":
      promptGoal = "Paraphrase thoroughly with fresh sentence structures, varied vocabulary, and original phrasing to minimize similarity index while preserving exact technical concepts.";
      break;
    case "expand":
      promptGoal = "Expand significantly by adding deeper technical explanations, contextual analysis, methodological nuances, and illustrative examples.";
      break;
    case "shorten":
      promptGoal = "Concise and condense drastically while preserving core research contributions, methodology, and key quantitative findings.";
      break;
    case "humanize":
      promptGoal = "Rewrite to sound naturally authored by an experienced human academic researcher, eliminating repetitive AI patterns and formulaic transitions.";
      break;
    default:
      promptGoal = "Rewrite for maximum clarity, logical flow, and academic impact.";
      break;
  }

  const prompt = `You are a Senior Peer Reviewer and Science Editor for IEEE/Nature.
Task: ${promptGoal}

Original Text:
"""
${text}
"""

Return ONLY the refined text without meta commentary.`;

  try {
    const enhancedText = await generateText(SECTION_SYSTEM, prompt, { model: MODELS.POWERFUL });
    return { enhancedText, mode };
  } catch (err: any) {
    console.warn("[EnhanceResearchText] Failed, returning original text:", err.message);
    return { enhancedText: text, mode };
  }
}

