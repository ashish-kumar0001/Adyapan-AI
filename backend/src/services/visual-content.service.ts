import { generateText, MODELS } from "../lib/ai/openrouter";

export interface DiagramResult {
  type: "mermaid" | "latex" | "table" | "chart_suggestion";
  title: string;
  code: string;
  description: string;
}

export async function generateVisualContent(
  contentType: "architecture" | "flowchart" | "uml" | "equation" | "table" | "workflow",
  topic: string,
  context?: string
): Promise<DiagramResult> {
  const systemPrompt = "You are a scientific visualizer and computer science graphics generator.";
  const prompt = `Task: Create a high-quality ${contentType} for a research paper on "${topic}".
Context: ${context || "General research methodology and system design"}

Output Format Rules:
- If contentType is architecture, flowchart, uml, or workflow: Return valid Mermaid.js code snippet wrapped in \`\`\`mermaid code.
- If contentType is equation: Return a formal LaTeX equation block, e.g. \\begin{equation}...\\end{equation}.
- If contentType is table: Return a clean Markdown formatted table with scientific headers and realistic numeric/comparative data.

Provide ONLY the visual block content and a brief 1-line description.`;

  try {
    const raw = await generateText(systemPrompt, prompt, { model: MODELS.POWERFUL, temperature: 0.3 });

    let code = raw;
    let type: DiagramResult["type"] = "mermaid";

    if (contentType === "equation") {
      type = "latex";
      const eqMatch = raw.match(/\\begin\{equation\}[\s\S]*?\\end\{equation\}/) || raw.match(/\$\$[\s\S]*?\$\$/);
      if (eqMatch) code = eqMatch[0];
    } else if (contentType === "table") {
      type = "table";
      const tableMatch = raw.match(/\|[\s\S]*?\|/g);
      if (tableMatch) code = tableMatch.join("\n");
    } else {
      type = "mermaid";
      const mermaidMatch = raw.match(/```mermaid([\s\S]*?)```/);
      if (mermaidMatch) {
        code = mermaidMatch[1].trim();
      } else {
        code = `graph TD\n  A[Input Data] --> B[Data Preprocessing]\n  B --> C[Proposed ${topic} Engine]\n  C --> D[Feature Extraction]\n  D --> E[Model Evaluation]\n  E --> F[Output Predictions]`;
      }
    }

    return {
      type,
      title: `${contentType.toUpperCase()} Visual Component for ${topic}`,
      code,
      description: `Generated ${contentType} diagram tailored for publication in ${topic}.`,
    };
  } catch (err: any) {
    console.warn("[VisualContentService] AI visual generation failed, using fallback:", err.message);
    return {
      type: "mermaid",
      title: `System Architecture — ${topic}`,
      code: `graph LR\n  Dataset[(Research Dataset)] --> Preprocess[Preprocessing Module]\n  Preprocess --> Model[Proposed Model]\n  Model --> Metrics[Evaluation Metrics]\n  Metrics --> Result[Experimental Result]`,
      description: `Fallback architecture flowchart for ${topic}.`,
    };
  }
}
