"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, ThumbsUp, ThumbsDown, RefreshCw,
  Share2, Volume2, ChevronDown, Download, Check
} from "lucide-react";
import type { ChatMessage } from "./types";

interface AIMessageProps {
  message: ChatMessage;
  index: number;
  isDark: boolean;
  isStreaming?: boolean;
  streamingText?: string;
  onRegenerate?: () => void;
}

// ─── Lightweight markdown renderer ───────────────────────────────────────────

function renderMarkdown(content: string, isDark: boolean): React.ReactNode {
  const text = isDark ? "#e2e8f0" : "#1e293b";
  const textSec = isDark ? "rgba(255,255,255,0.65)" : "#475569";
  const codeBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const codeBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const blockBg = isDark ? "rgba(10,8,22,0.8)" : "rgba(248,250,252,0.9)";
  const blockBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const tableHeader = isDark ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.06)";
  const tableBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim() || "text";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      const code = codeLines.join("\n");
      elements.push(
        <CodeBlock key={i} code={code} lang={lang} isDark={isDark} blockBg={blockBg} blockBorder={blockBorder} />
      );
      i++;
      continue;
    }

    // Heading 1
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-2xl font-black mb-3 mt-5 first:mt-0" style={{ color: text, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>
          {inlineFormat(line.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    // Heading 2
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-xl font-bold mb-2 mt-4 first:mt-0" style={{ color: text, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.01em" }}>
          {inlineFormat(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    // Heading 3
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-base font-bold mb-2 mt-3 first:mt-0" style={{ color: text }}>
          {inlineFormat(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    // Unordered list
    if (line.match(/^[-*] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={i} className="space-y-1.5 my-3 pl-1">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2.5 text-sm items-start" style={{ color: textSec }}>
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#f59e0b" }} />
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      let num = 1;
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      elements.push(
        <ol key={i} className="space-y-1.5 my-3 pl-1">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2.5 text-sm items-start" style={{ color: textSec }}>
              <span
                className="text-xs font-bold flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}
              >
                {j + 1}
              </span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Table (detect by pipe)
    if (line.includes("|") && i + 1 < lines.length && lines[i + 1].includes("---")) {
      const headers = line.split("|").map(h => h.trim()).filter(Boolean);
      i += 2; // skip separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|")) {
        rows.push(lines[i].split("|").map(c => c.trim()).filter(Boolean));
        i++;
      }
      elements.push(
        <div key={i} className="overflow-x-auto my-4">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                {headers.map((h, j) => (
                  <th key={j} className="px-3 py-2 text-left font-semibold" style={{ background: tableHeader, color: "#f59e0b", borderBottom: `1px solid ${tableBorder}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, j) => (
                <tr key={j}>
                  {row.map((cell, k) => (
                    <td key={k} className="px-3 py-2" style={{ color: textSec, borderBottom: `1px solid ${tableBorder}` }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={i}
          className="pl-4 my-3 text-sm italic"
          style={{
            borderLeft: "3px solid rgba(245,158,11,0.5)",
            color: textSec,
            background: isDark ? "rgba(245,158,11,0.04)" : "rgba(245,158,11,0.03)",
            borderRadius: "0 8px 8px 0",
            padding: "8px 12px",
          }}
        >
          {inlineFormat(line.slice(2))}
        </blockquote>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (line.trim() === "---" || line.trim() === "***") {
      elements.push(
        <hr key={i} className="my-4" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
      );
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-sm leading-relaxed mb-1" style={{ color: textSec }}>
        {inlineFormat(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

// ─── Inline formatting (bold, italic, code, links) ───────────────────────────

function inlineFormat(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/^([\s\S]*?)\*\*([\s\S]+?)\*\*([\s\S]*)/);
    if (boldMatch) {
      if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>);
      parts.push(<strong key={key++} style={{ color: "inherit", fontWeight: 700 }}>{boldMatch[2]}</strong>);
      remaining = boldMatch[3];
      continue;
    }

    // Italic
    const italicMatch = remaining.match(/^([\s\S]*?)\*([\s\S]+?)\*([\s\S]*)/);
    if (italicMatch) {
      if (italicMatch[1]) parts.push(<span key={key++}>{italicMatch[1]}</span>);
      parts.push(<em key={key++}>{italicMatch[2]}</em>);
      remaining = italicMatch[3];
      continue;
    }

    // Inline code
    const codeMatch = remaining.match(/^([\s\S]*?)`([\s\S]+?)`([\s\S]*)/);
    if (codeMatch) {
      if (codeMatch[1]) parts.push(<span key={key++}>{codeMatch[1]}</span>);
      parts.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded text-xs font-mono"
          style={{
            background: "rgba(245,158,11,0.12)",
            color: "#f59e0b",
            border: "1px solid rgba(245,158,11,0.2)",
          }}
        >
          {codeMatch[2]}
        </code>
      );
      remaining = codeMatch[3];
      continue;
    }

    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return <>{parts}</>;
}

// ─── Code block component with copy ──────────────────────────────────────────

function CodeBlock({
  code, lang, isDark, blockBg, blockBorder,
}: {
  code: string; lang: string; isDark: boolean; blockBg: string; blockBorder: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="my-4 rounded-2xl overflow-hidden"
      style={{ background: blockBg, border: `1px solid ${blockBorder}` }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: `1px solid ${blockBorder}` }}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 opacity-60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 opacity-60" />
          </div>
          <span
            className="text-[10px] font-semibold uppercase tracking-wider ml-1"
            style={{ color: isDark ? "rgba(255,255,255,0.35)" : "#94a3b8" }}
          >
            {lang}
          </span>
        </div>
        <motion.button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg"
          style={{
            background: copied ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)",
            color: copied ? "#22c55e" : isDark ? "rgba(255,255,255,0.4)" : "#94a3b8",
            border: `1px solid ${copied ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)"}`,
          }}
          whileHover={{ scale: 1.04, background: "rgba(255,255,255,0.08)" }}
          whileTap={{ scale: 0.96 }}
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Check className="w-3 h-3" />
              </motion.div>
            ) : (
              <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Copy className="w-3 h-3" />
              </motion.div>
            )}
          </AnimatePresence>
          {copied ? "Copied!" : "Copy"}
        </motion.button>
      </div>

      {/* Code */}
      <pre
        className="p-4 overflow-x-auto text-xs leading-relaxed font-mono"
        style={{ color: isDark ? "#e2e8f0" : "#1e293b", maxHeight: 400 }}
      >
        {code}
      </pre>
    </div>
  );
}

// ─── AI Message action bar ────────────────────────────────────────────────────

function ActionBar({
  isDark,
  content,
  onRegenerate,
}: {
  isDark: boolean;
  content: string;
  onRegenerate?: () => void;
}) {
  const [liked, setLiked] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const actions = [
    {
      icon: copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />,
      label: copied ? "Copied" : "Copy",
      onClick: handleCopy,
      active: copied,
    },
    {
      icon: <ThumbsUp className="w-3.5 h-3.5" />,
      label: "Like",
      onClick: () => setLiked(true),
      active: liked === true,
      activeColor: "#22c55e",
    },
    {
      icon: <ThumbsDown className="w-3.5 h-3.5" />,
      label: "Dislike",
      onClick: () => setLiked(false),
      active: liked === false,
      activeColor: "#ef4444",
    },
    {
      icon: <RefreshCw className="w-3.5 h-3.5" />,
      label: "Regenerate",
      onClick: onRegenerate,
    },
    {
      icon: <Share2 className="w-3.5 h-3.5" />,
      label: "Share",
      onClick: () => {},
    },
    {
      icon: <Volume2 className="w-3.5 h-3.5" />,
      label: "Speak",
      onClick: () => {
        const utterance = new SpeechSynthesisUtterance(content.slice(0, 300));
        window.speechSynthesis.speak(utterance);
      },
    },
  ];

  const textMuted = isDark ? "rgba(255,255,255,0.6)" : "#5f6368";

  return (
    <motion.div
      className="flex items-center gap-0.5 mt-3 ml-10"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
    >
      {actions.map((action, i) => (
        <motion.button
          key={i}
          onClick={action.onClick}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] transition-colors"
          style={{
            color: action.active ? (action.activeColor || "#f59e0b") : textMuted,
          }}
          whileHover={{
            scale: 1.05,
            color: action.activeColor || "#f59e0b",
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          }}
          whileTap={{ scale: 0.92 }}
          title={action.label}
        >
          {action.icon}
        </motion.button>
      ))}
    </motion.div>
  );
}

// ─── Main AI Message component ────────────────────────────────────────────────

export function AIMessage({
  message,
  index,
  isDark,
  isStreaming,
  streamingText,
  onRegenerate,
}: AIMessageProps) {
  const rawContent = isStreaming ? (streamingText || "") : message.content;
  const content = rawContent.replace(/\*/g, "");
  const [showCursor] = useState(true);

  return (
    <motion.div
      className="flex gap-3 mb-6"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.03,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {/* AI Avatar */}
      <motion.div
        className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.06))",
          border: "1px solid rgba(245,158,11,0.3)",
          boxShadow: "0 0 14px rgba(245,158,11,0.15)",
        }}
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.05 }}
      >
        <svg width="14" height="14" viewBox="0 0 44 44" fill="none">
          <path d="M22 6L28 18H16L22 6Z" fill="rgba(245,158,11,0.9)" />
          <path d="M16 18L10 30H22L16 18Z" fill="rgba(245,158,11,0.6)" />
          <path d="M28 18L22 30H34L28 18Z" fill="rgba(245,158,11,0.75)" />
          <circle cx="22" cy="22" r="3" fill="white" opacity="0.9" />
        </svg>
      </motion.div>

      {/* Message content */}
      <div className="flex-1 min-w-0 max-w-[85%]">
        {/* Rendered markdown */}
        <div className="text-sm leading-relaxed">
          {renderMarkdown(content, isDark)}
          {/* Blinking cursor while streaming */}
          {isStreaming && (
            <motion.span
              className="inline-block w-0.5 h-4 ml-0.5 align-text-bottom rounded-full"
              style={{ background: "#f59e0b" }}
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </div>

        {/* Action bar (only for completed messages) */}
        {!isStreaming && (
          <ActionBar isDark={isDark} content={content} onRegenerate={onRegenerate} />
        )}
      </div>
    </motion.div>
  );
}
