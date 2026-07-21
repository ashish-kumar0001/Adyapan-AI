export const mkColors = (theme: string) => {
  const d = theme === "dark";
  return {
    d,
    isDark: d,
    text:          d ? "#e5e7eb"                    : "#0f172a",
    textSec:       d ? "#9ca3af"                    : "#475569",
    textMuted:     d ? "#828fa3"                    : "#5f6368",
    textOnAmber:   "#000000",
    bg:            d ? "rgba(255,255,255,0.025)"    : "#ffffff",
    bgGradient:    d
      ? "linear-gradient(135deg, #0a0e1a 0%, #0d1520 30%, #111827 60%, #0a0e1a 100%)"
      : "linear-gradient(160deg, #f8fafc 0%, #f1f5f9 40%, #e8edf5 100%)",
    bgHover:       d ? "rgba(255,255,255,0.04)"    : "#f8fafc",
    surface:       d ? "rgba(255,255,255,0.03)"    : "rgba(0,0,0,0.02)",
    surfaceHover:  d ? "rgba(255,255,255,0.06)"    : "rgba(0,0,0,0.04)",
    border:        d ? "rgba(255,255,255,0.07)"    : "rgba(0,0,0,0.08)",
    borderHover:   d ? "rgba(255,255,255,0.15)"    : "rgba(0,0,0,0.18)",
    borderFocus:   d ? "rgba(245,158,11,0.45)"     : "rgba(245,158,11,0.5)",
    borderLight:   d ? "rgba(255,255,255,0.05)"    : "rgba(0,0,0,0.05)",
    inputBg:       d ? "rgba(0,0,0,0.35)"          : "#f1f5f9",
    cardBg:        d ? "rgba(255,255,255,0.025)"   : "#ffffff",
    cardBgAlt:     d ? "rgba(0,0,0,0.25)"          : "#f8fafc",
    stickyBg:      d ? "rgba(10,10,20,0.88)"       : "rgba(248,250,252,0.92)",
    amber:         "#f59e0b",
    amberDark:     "#d97706",
    amberBg:       d ? "rgba(245,158,11,0.07)"     : "rgba(245,158,11,0.08)",
    amberBorder:   d ? "rgba(245,158,11,0.18)"     : "rgba(245,158,11,0.25)",
    amberActive:   d ? "rgba(245,158,11,0.12)"     : "rgba(245,158,11,0.1)",
    rose:          "#f43f5e",
    roseBg:        d ? "rgba(244,63,94,0.07)"      : "rgba(244,63,94,0.06)",
    roseBorder:    d ? "rgba(244,63,94,0.18)"      : "rgba(244,63,94,0.2)",
    red:           "#ef4444",
    redBg:         d ? "rgba(239,68,68,0.1)"       : "rgba(239,68,68,0.08)",
    redBorder:     d ? "rgba(239,68,68,0.2)"       : "rgba(239,68,68,0.3)",
    purple:        "#8b5cf6",
    purpleBg:      d ? "rgba(139,92,246,0.06)"     : "rgba(139,92,246,0.05)",
    purpleBorder:  d ? "rgba(139,92,246,0.14)"     : "rgba(139,92,246,0.15)",
    cyan:          "#06b6d4",
    cyanBg:        d ? "rgba(6,182,212,0.06)"      : "rgba(6,182,212,0.05)",
    cyanBorder:    d ? "rgba(6,182,212,0.14)"      : "rgba(6,182,212,0.15)",
    blue:          "#3b82f6",
    blueBg:        d ? "rgba(59,130,246,0.1)"      : "rgba(59,130,246,0.06)",
    blueBorder:    d ? "rgba(59,130,246,0.2)"      : "rgba(59,130,246,0.15)",
    green:         "#10b981",
    greenBg:       d ? "rgba(16,185,129,0.1)"      : "rgba(16,185,129,0.08)",
    greenBorder:   d ? "rgba(16,185,129,0.2)"      : "rgba(16,185,129,0.3)",
    divider:       d ? "rgba(255,255,255,0.06)"    : "rgba(0,0,0,0.07)",
    pill:          d ? "rgba(255,255,255,0.05)"    : "rgba(0,0,0,0.05)",
    pillBorder:    d ? "rgba(255,255,255,0.1)"     : "rgba(0,0,0,0.1)",
    glass:         d ? "rgba(255,255,255,0.03)"    : "rgba(255,255,255,0.7)",
    glassBorder:   d ? "rgba(255,255,255,0.06)"    : "rgba(0,0,0,0.06)",
    shadow:        d
      ? "0 4px 24px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)"
      : "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
    shadowLg:      d
      ? "0 16px 48px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4)"
      : "0 16px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)",
    shadowGlow:    "0 0 30px rgba(245,158,11,0.25)",
    orb1:          d ? "rgba(245,158,11,0.07)"     : "rgba(245,158,11,0.04)",
    orb2:          d ? "rgba(139,92,246,0.06)"     : "rgba(139,92,246,0.03)",
    orb3:          d ? "rgba(59,130,246,0.05)"     : "rgba(59,130,246,0.03)",
  };
};

export type ThemeColors = ReturnType<typeof mkColors>;
