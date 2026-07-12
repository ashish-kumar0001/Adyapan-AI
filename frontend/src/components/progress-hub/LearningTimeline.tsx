"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { FileText, Clock, HelpCircle, RotateCcw, Layers, Map } from "lucide-react";

export interface TimelineEvent {
  date: string;
  displayDate: string;
  title: string;
  description: string;
  type: "upload" | "note" | "quiz" | "milestone" | "revision" | "flashcard" | "mindmap";
  icon: string;
}

interface LearningTimelineProps {
  events: TimelineEvent[];
}

const TYPE_STYLES = {
  upload: { color: "from-blue-500 to-blue-600", icon: FileText, glow: "#3b82f6" },
  note: { color: "from-violet-500 to-violet-600", icon: Layers, glow: "#8b5cf6" },
  quiz: { color: "from-emerald-500 to-emerald-600", icon: HelpCircle, glow: "#10b981" },
  revision: { color: "from-amber-500 to-amber-600", icon: RotateCcw, glow: "#f59e0b" },
  flashcard: { color: "from-pink-500 to-pink-600", icon: Clock, glow: "#ec4899" },
  mindmap: { color: "from-teal-500 to-teal-600", icon: Map, glow: "#14b8a6" },
  milestone: { color: "from-orange-500 to-red-500", icon: Clock, glow: "#f97316" },
};

function TimelineItem({ event, index }: { event: TimelineEvent; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const style = TYPE_STYLES[event.type] || TYPE_STYLES.note;
  const IconComponent = style.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex items-start gap-4 group"
    >
      {/* Timeline dot */}
      <div className="flex-shrink-0 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={inView ? { scale: 1 } : {}}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          className={`w-10 h-10 rounded-full bg-gradient-to-br ${style.color} flex items-center justify-center shadow-lg`}
          style={{ boxShadow: `0 0 16px ${style.glow}40` }}
        >
          <span className="text-sm">{event.icon}</span>
        </motion.div>
        {/* Line */}
        <div className="w-0.5 h-full bg-white/[0.06] mt-1" />
      </div>

      {/* Card */}
      <motion.div
        whileHover={{ x: 4 }}
        className="flex-1 mb-6 pb-6 border-b border-white/[0.04] last:border-0"
      >
        <div className="flex items-center gap-2 mb-1">
          <IconComponent size={12} className="text-white/40" />
          <span className="text-[11px] font-bold text-white/40 tracking-wider">{event.displayDate}</span>
        </div>
        <h4 className="text-sm font-bold text-white group-hover:text-white/90 transition-colors leading-tight">
          {event.title}
        </h4>
        <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{event.description}</p>
      </motion.div>
    </motion.div>
  );
}

export function LearningTimeline({ events }: LearningTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Clock size={48} className="text-white/20 mb-4" />
        <p className="text-white/40 font-semibold">Your timeline is empty</p>
        <p className="text-white/25 text-sm mt-1">Start using AI tools to build your learning journey</p>
      </div>
    );
  }

  return (
    <div className="max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
      <div className="space-y-0">
        {events.map((event, i) => (
          <TimelineItem key={`${event.date}-${i}`} event={event} index={i} />
        ))}
      </div>
    </div>
  );
}

