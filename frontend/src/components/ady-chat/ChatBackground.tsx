"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

// ─── Animated background: gradient mesh + aurora + particles + mouse glow ─────

export function ChatBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 30 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    >
      {/* Base dark background */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, #060614 0%, #090920 50%, #070715 100%)" }}
      />

      {/* Animated gradient mesh */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 20%, rgba(245,158,11,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(59,130,246,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 50% 50%, rgba(139,92,246,0.04) 0%, transparent 60%)
          `,
        }}
      />

      {/* Aurora light 1 */}
      <motion.div
        className="absolute rounded-full opacity-20 blur-[120px]"
        style={{
          width: 600,
          height: 600,
          background: "radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)",
          top: "-10%",
          left: "-5%",
        }}
        animate={{
          x: [0, 60, -40, 0],
          y: [0, 40, -30, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Aurora light 2 */}
      <motion.div
        className="absolute rounded-full opacity-15 blur-[150px]"
        style={{
          width: 500,
          height: 500,
          background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)",
          bottom: "10%",
          right: "5%",
        }}
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 30, -50, 0],
          scale: [1, 0.9, 1.15, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />

      {/* Aurora light 3 */}
      <motion.div
        className="absolute rounded-full opacity-10 blur-[100px]"
        style={{
          width: 400,
          height: 400,
          background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)",
          top: "40%",
          left: "40%",
        }}
        animate={{
          x: [0, 80, -60, 0],
          y: [0, -40, 60, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 7 }}
      />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: p.color,
            opacity: p.opacity,
            filter: "blur(0.5px)",
          }}
          animate={{
            y: [0, -p.drift, 0],
            x: [0, p.driftX, 0],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        />
      ))}

      {/* Mouse-follow glow */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 400,
          height: 400,
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
          background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)",
          opacity: 0.8,
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px",
        }}
      />
    </div>
  );
}

// ─── Pre-generated particles for consistent SSR ──────────────────────────────

const PARTICLES = [
  { x: 10, y: 20, size: 3, opacity: 0.4, color: "rgba(245,158,11,0.6)", drift: 30, driftX: 15, duration: 8, delay: 0 },
  { x: 85, y: 15, size: 2, opacity: 0.3, color: "rgba(59,130,246,0.6)", drift: 25, driftX: -10, duration: 10, delay: 1 },
  { x: 25, y: 70, size: 4, opacity: 0.2, color: "rgba(245,158,11,0.4)", drift: 20, driftX: 20, duration: 12, delay: 2 },
  { x: 70, y: 60, size: 2, opacity: 0.35, color: "rgba(139,92,246,0.5)", drift: 35, driftX: -15, duration: 9, delay: 0.5 },
  { x: 50, y: 85, size: 3, opacity: 0.25, color: "rgba(59,130,246,0.5)", drift: 28, driftX: 10, duration: 11, delay: 3 },
  { x: 90, y: 45, size: 2, opacity: 0.4, color: "rgba(245,158,11,0.5)", drift: 22, driftX: -20, duration: 7, delay: 1.5 },
  { x: 15, y: 55, size: 2, opacity: 0.3, color: "rgba(139,92,246,0.4)", drift: 40, driftX: 5, duration: 14, delay: 4 },
  { x: 60, y: 30, size: 3, opacity: 0.2, color: "rgba(245,158,11,0.3)", drift: 18, driftX: 12, duration: 13, delay: 2.5 },
  { x: 35, y: 40, size: 2, opacity: 0.45, color: "rgba(59,130,246,0.4)", drift: 32, driftX: -8, duration: 8.5, delay: 0.8 },
  { x: 78, y: 80, size: 4, opacity: 0.15, color: "rgba(245,158,11,0.3)", drift: 15, driftX: 25, duration: 16, delay: 5 },
  { x: 5, y: 90, size: 2, opacity: 0.3, color: "rgba(139,92,246,0.5)", drift: 26, driftX: -18, duration: 9.5, delay: 1.2 },
  { x: 95, y: 75, size: 3, opacity: 0.25, color: "rgba(59,130,246,0.4)", drift: 38, driftX: 8, duration: 11.5, delay: 3.5 },
];
