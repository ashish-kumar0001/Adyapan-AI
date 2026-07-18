import jsPDF from "jspdf";

export interface InterviewReportData {
  sessionId: string;
  role: string;
  company?: string;
  type: string;
  difficulty: string;
  language: string;
  durationMinutes: number;
  technology?: string;
  createdAt: string;
  endedAt?: string;
  evaluation?: {
    overallScore: number;
    communicationScore: number;
    technicalScore?: number;
    hrScore?: number;
    confidenceScore?: number;
    fluencyScore?: number;
    bodyLanguageScore?: number;
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    summary: string;
    hiringRecommendation: string;
  };
  violationReport?: {
    totalViolations: number;
    totalPoints: number;
    threshold: number;
    violations: Array<{ type: string; count: number; totalPoints: number }>;
  };
}

function getScoreColor(score: number): [number, number, number] {
  if (score >= 80) return [16, 185, 129]; // green
  if (score >= 60) return [245, 158, 11]; // amber
  return [239, 68, 68]; // red
}

function drawScoreRing(
  doc: jsPDF,
  cx: number,
  cy: number,
  radius: number,
  score: number
) {
  const color = getScoreColor(score);
  // Background ring
  doc.setDrawColor(40, 40, 60);
  doc.setLineWidth(4);
  doc.circle(cx, cy, radius, "S");
  // Score arc (approximated as a series of short lines)
  const segments = 60;
  const filled = Math.round((score / 100) * segments);
  const startAngle = -Math.PI / 2;
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(4);
  for (let i = 0; i < filled; i++) {
    const a1 = startAngle + (i / segments) * 2 * Math.PI;
    const a2 = startAngle + ((i + 1) / segments) * 2 * Math.PI;
    doc.line(
      cx + radius * Math.cos(a1),
      cy + radius * Math.sin(a1),
      cx + radius * Math.cos(a2),
      cy + radius * Math.sin(a2)
    );
  }
  // Score text
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(color[0], color[1], color[2]);
  const scoreText = `${score}%`;
  const textWidth = doc.getTextWidth(scoreText);
  doc.text(scoreText, cx - textWidth / 2, cy + 2);
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 170);
  const label = "OVERALL";
  const labelWidth = doc.getTextWidth(label);
  doc.text(label, cx - labelWidth / 2, cy + 8);
}

export function generateInterviewPDF(data: InterviewReportData): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 18;
  const contentW = pageW - margin * 2;

  // ── HEADER BANNER ─────────────────────────────────────────
  doc.setFillColor(10, 10, 20);
  doc.rect(0, 0, pageW, 38, "F");

  // Brand badge
  doc.setFillColor(245, 158, 11);
  doc.roundedRect(margin, 10, 48, 8, 2, 2, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("ADYAPAN AI", margin + 4, 15.5);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Interview Performance Report", margin, 30);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 200);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, pageW - margin - 60, 30);

  let y = 50;

  // ── SESSION DETAILS ────────────────────────────────────────
  doc.setFillColor(18, 18, 35);
  doc.roundedRect(margin, y, contentW, 30, 3, 3, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(245, 158, 11);
  doc.text("SESSION DETAILS", margin + 6, y + 8);

  const details = [
    ["Role", data.role],
    ["Company", data.company || "—"],
    ["Type", data.type.charAt(0).toUpperCase() + data.type.slice(1)],
    ["Difficulty", data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1)],
    ["Duration", `${data.durationMinutes} minutes`],
    ["Language", data.language.charAt(0).toUpperCase() + data.language.slice(1)],
  ];

  const colW = contentW / 3;
  let col = 0;
  let detailY = y + 16;
  doc.setFontSize(7.5);
  for (const [label, value] of details) {
    const xOff = margin + 6 + col * colW;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(150, 150, 170);
    doc.text(`${label}: `, xOff, detailY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(220, 220, 240);
    doc.text(value, xOff + doc.getTextWidth(`${label}: `), detailY);
    col++;
    if (col === 3) { col = 0; detailY += 7; }
  }
  y += 36;

  // ── SCORE SECTION ──────────────────────────────────────────
  if (data.evaluation) {
    const ev = data.evaluation;
    const boxH = 55;
    doc.setFillColor(18, 18, 35);
    doc.roundedRect(margin, y, contentW, boxH, 3, 3, "F");

    // Score ring
    drawScoreRing(doc, margin + 28, y + 28, 18, ev.overallScore);

    // Score breakdown bars
    const scores = [
      { label: "Communication", value: ev.communicationScore },
      { label: "Technical", value: ev.technicalScore ?? 0 },
      { label: "HR / Behavioral", value: ev.hrScore ?? 0 },
      { label: "Confidence", value: ev.confidenceScore ?? 0 },
      { label: "Fluency", value: ev.fluencyScore ?? 0 },
    ].filter(s => s.value > 0);

    const barsX = margin + 58;
    const barW = contentW - 58 - 12;
    let bY = y + 10;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(245, 158, 11);
    doc.text("SCORE BREAKDOWN", barsX, bY);
    bY += 6;

    for (const s of scores) {
      const barColor = getScoreColor(s.value);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 180, 200);
      doc.text(s.label, barsX, bY + 3);
      // Background bar
      doc.setFillColor(40, 40, 60);
      doc.roundedRect(barsX + 38, bY - 0.5, barW - 42, 4, 1, 1, "F");
      // Filled bar
      doc.setFillColor(barColor[0], barColor[1], barColor[2]);
      const fillW = ((s.value / 100) * (barW - 42));
      if (fillW > 0) doc.roundedRect(barsX + 38, bY - 0.5, fillW, 4, 1, 1, "F");
      // Score text
      doc.setFont("helvetica", "bold");
      doc.setTextColor(barColor[0], barColor[1], barColor[2]);
      doc.text(`${s.value}%`, barsX + 38 + (barW - 42) + 2, bY + 3);
      bY += 7;
    }

    // Recommendation
    const rec = ev.hiringRecommendation.replace(/_/g, " ");
    const recColor = rec.includes("strong") || rec === "recommend" ? [16, 185, 129] : rec === "maybe" ? [245, 158, 11] : [239, 68, 68];
    doc.setFillColor(recColor[0], recColor[1], recColor[2]);
    doc.roundedRect(margin + 6, y + boxH - 12, 50, 7, 2, 2, "F");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`Recommendation: ${rec.toUpperCase()}`, margin + 9, y + boxH - 7.5);

    y += boxH + 6;

    // ── SUMMARY ──────────────────────────────────────────────
    doc.setFillColor(18, 18, 35);
    doc.roundedRect(margin, y, contentW, 24, 3, 3, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(245, 158, 11);
    doc.text("AI SUMMARY", margin + 6, y + 8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 220);
    doc.setFontSize(7.5);
    const summaryLines = doc.splitTextToSize(ev.summary || "No summary available.", contentW - 12);
    doc.text(summaryLines.slice(0, 2), margin + 6, y + 15);
    y += 30;

    // ── STRENGTHS & WEAKNESSES ────────────────────────────────
    const halfW = (contentW - 4) / 2;
    // Strengths box
    doc.setFillColor(14, 35, 28);
    doc.roundedRect(margin, y, halfW, 50, 3, 3, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text("✓  STRENGTHS", margin + 6, y + 9);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 220, 200);
    let sy = y + 16;
    for (const str of (ev.strengths || []).slice(0, 5)) {
      const lines = doc.splitTextToSize(`• ${str}`, halfW - 12);
      doc.text(lines, margin + 6, sy);
      sy += lines.length * 5 + 1;
      if (sy > y + 46) break;
    }

    // Weaknesses box
    const wx = margin + halfW + 4;
    doc.setFillColor(35, 14, 14);
    doc.roundedRect(wx, y, halfW, 50, 3, 3, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(239, 68, 68);
    doc.text("✗  IMPROVEMENTS", wx + 6, y + 9);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(220, 180, 180);
    let wy = y + 16;
    for (const w of (ev.weaknesses || []).slice(0, 5)) {
      const lines = doc.splitTextToSize(`• ${w}`, halfW - 12);
      doc.text(lines, wx + 6, wy);
      wy += lines.length * 5 + 1;
      if (wy > y + 46) break;
    }
    y += 56;

    // ── IMPROVEMENT PLAN ─────────────────────────────────────
    if ((ev.improvements || []).length > 0) {
      doc.setFillColor(20, 20, 40);
      doc.roundedRect(margin, y, contentW, 32, 3, 3, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(245, 158, 11);
      doc.text("ACTION PLAN", margin + 6, y + 9);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 220);
      let iy = y + 16;
      for (const imp of ev.improvements.slice(0, 4)) {
        const lines = doc.splitTextToSize(`→  ${imp}`, contentW - 12);
        doc.text(lines, margin + 6, iy);
        iy += lines.length * 5 + 1;
        if (iy > y + 29) break;
      }
      y += 38;
    }
  }

  // ── VIOLATION REPORT ────────────────────────────────────────
  if (data.violationReport && data.violationReport.totalViolations > 0) {
    const vr = data.violationReport;
    doc.setFillColor(35, 14, 14);
    doc.roundedRect(margin, y, contentW, 32, 3, 3, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(239, 68, 68);
    doc.text(`⚠  PROCTORING VIOLATIONS  (${vr.totalViolations} events, ${vr.totalPoints} pts / ${vr.threshold} threshold)`, margin + 6, y + 9);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 160, 160);
    let vy = y + 16;
    for (const v of vr.violations.slice(0, 4)) {
      doc.text(`• ${v.type.replace(/_/g, " ")}  ×${v.count}  (${v.totalPoints} pts)`, margin + 6, vy);
      vy += 5;
    }
    y += 38;
  }

  // ── FOOTER ────────────────────────────────────────────────
  doc.setFillColor(10, 10, 20);
  doc.rect(0, 280, pageW, 17, "F");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 130);
  doc.text("Adyapan AI • AI-powered Learning & Career Platform • adyapan.com", margin, 289);
  doc.text(`Session ID: ${data.sessionId}`, pageW - margin - 60, 289);

  // ── DOWNLOAD ─────────────────────────────────────────────
  const filename = `adyapan-interview-${data.role.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
