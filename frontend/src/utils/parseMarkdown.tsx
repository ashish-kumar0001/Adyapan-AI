import type { ReactNode } from "react";

export function parseMarkdown(text: string, isDark: boolean): ReactNode {
  if (!text) return null;
  const blocks = text.split(/(```[\s\S]*?```)/g);
  return (
    <>
      {blocks.map((block, blockIdx) => {
        if (block.startsWith("```") && block.endsWith("```")) {
          const match = block.match(/```(\w*)\n?([\s\S]*?)```/);
          const lang = match ? match[1] : "";
          const codeContent = match ? match[2].trim() : block.slice(3, -3).trim();
          return (
            <div key={blockIdx} className="my-3 rounded-lg border overflow-hidden font-mono text-[11px] leading-relaxed" style={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.1)"}`, background: isDark ? "rgba(0,0,0,0.45)" : "#f1f5f9" }}>
              {lang && <div className="flex justify-between items-center px-4 py-1.5 border-b text-[9px] uppercase" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)", background: isDark ? "rgba(0,0,0,0.3)" : "#e2e8f0", color: isDark ? "rgba(255,255,255,0.3)" : "#64748b" }}><span>{lang}</span></div>}
              <pre className="p-3 overflow-x-auto" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#334155" }}><code>{codeContent}</code></pre>
            </div>
          );
        }
        const inlineParts = block.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\n)/g);
        return (
          <span key={blockIdx}>
            {inlineParts.map((part, inlineIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) return <strong key={inlineIdx} className="font-extrabold" style={{ color: isDark ? "rgba(255,255,255,0.95)" : "#0f172a" }}>{part.slice(2, -2)}</strong>;
              if (part.startsWith("*") && part.endsWith("*")) return <em key={inlineIdx} className="italic" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#475569" }}>{part.slice(1, -1)}</em>;
              if (part.startsWith("`") && part.endsWith("`")) return <code key={inlineIdx} className="font-mono text-xs px-1.5 py-0.5 rounded border" style={{ background: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.2)", color: "#f59e0b" }}>{part.slice(1, -1)}</code>;
              if (part === "\n") return <br key={inlineIdx} />;
              return <span key={inlineIdx}>{part}</span>;
            })}
          </span>
        );
      })}
    </>
  );
}
