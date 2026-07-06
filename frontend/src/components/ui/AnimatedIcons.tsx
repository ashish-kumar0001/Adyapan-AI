"use client";

import { motion, type Variants } from "framer-motion";
import type { LucideIcon, LucideProps } from "lucide-react";
import {
  CheckCircle, XCircle, Rocket, Flame, Trash2,
  FileText, Search, Brain, BarChart3, TrendingUp,
  Lightbulb, Settings, Globe, PartyPopper, Trophy, Sparkles,
  Save, Clipboard, Dice1, Puzzle, Lock, Compass,
  Handshake, Megaphone, Blocks, Trees, Zap,
  Eye, MessageCircle, Download,
  CreditCard, User, Target, Upload,
  RefreshCw, Palette, GraduationCap, Code2, Mic,
  Briefcase, BookOpen, Wand2, Star, Crown,
  ArrowUpRight, Bell, AlertTriangle, Check,
  Loader2, ShoppingCart, DollarSign, Shield,
  Terminal, HardDrive, Cpu, Smartphone, Ban,
  Flag, UsersRound, Bot, Pen,
  Activity, Server, Link, BookMarked,
} from "lucide-react";

type AnimatedIconProps = LucideProps & { className?: string };

// ─── Animated Icon Wrapper ────────────────────────────────────────

function Animated({
  icon: Icon,
  animation,
  ...rest
}: {
  icon: LucideIcon;
  animation: Variants;
} & AnimatedIconProps) {
  return (
    <motion.span
      variants={animation}
      initial="initial"
      animate="animate"
      style={{ display: "inline-flex", alignItems: "center", verticalAlign: "middle", lineHeight: 1 }}
    >
      <Icon {...rest} />
    </motion.span>
  );
}

// ─── Animation Presets ────────────────────────────────────────────

const pulse: Variants = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.12, 1], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
};

const float: Variants = {
  initial: { y: 0 },
  animate: { y: [-2, 2, -2], transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } },
};

const spin: Variants = {
  initial: { rotate: 0 },
  animate: { rotate: 360, transition: { duration: 4, repeat: Infinity, ease: "linear" } },
};

const wiggle: Variants = {
  initial: { rotate: 0 },
  animate: { rotate: [0, -10, 10, -10, 0], transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } },
};

const shimmer: Variants = {
  initial: { opacity: 1, scale: 1 },
  animate: {
    opacity: [1, 0.6, 1],
    scale: [1, 1.05, 1],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};

const bounce: Variants = {
  initial: { y: 0 },
  animate: { y: [0, -6, 0], transition: { duration: 1.2, repeat: Infinity, ease: "easeOut" } },
};

const glow: Variants = {
  initial: { filter: "brightness(1)" },
  animate: {
    filter: ["brightness(1)", "brightness(1.4)", "brightness(1)"],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};

const shake: Variants = {
  initial: { x: 0 },
  animate: { x: [0, -2, 2, -2, 0], transition: { duration: 0.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" } },
};

// ─── Icons ────────────────────────────────────────────────────────

export function AnimatedCheckCircle(props: AnimatedIconProps) {
  return <Animated icon={CheckCircle} animation={pulse} color="#10b981" {...props} />;
}

export function AnimatedXCircle(props: AnimatedIconProps) {
  return <Animated icon={XCircle} animation={shake} color="#ef4444" {...props} />;
}

export function AnimatedRocket(props: AnimatedIconProps) {
  return <Animated icon={Rocket} animation={float} color="var(--primary)" {...props} />;
}

export function AnimatedFlame(props: AnimatedIconProps) {
  return <Animated icon={Flame} animation={shimmer} color="#f97316" {...props} />;
}

export function AnimatedTrash(props: AnimatedIconProps) {
  return <Animated icon={Trash2} animation={wiggle} color="#ef4444" {...props} />;
}

export function AnimatedCheck(props: AnimatedIconProps) {
  return <Animated icon={Check} animation={pulse} color="#10b981" {...props} />;
}

export function AnimatedFileText(props: AnimatedIconProps) {
  return <Animated icon={FileText} animation={float} color="var(--primary)" {...props} />;
}

export function AnimatedSearch(props: AnimatedIconProps) {
  return <Animated icon={Search} animation={spin} color="var(--primary)" {...props} />;
}

export function AnimatedBrain(props: AnimatedIconProps) {
  return <Animated icon={Brain} animation={pulse} color="#8b5cf6" {...props} />;
}

export function AnimatedBarChart(props: AnimatedIconProps) {
  return <Animated icon={BarChart3} animation={pulse} color="var(--primary)" {...props} />;
}

export function AnimatedTrendingUp(props: AnimatedIconProps) {
  return <Animated icon={TrendingUp} animation={float} color="#10b981" {...props} />;
}

export function AnimatedLightbulb(props: AnimatedIconProps) {
  return <Animated icon={Lightbulb} animation={shimmer} color="#f59e0b" {...props} />;
}

export function AnimatedSettings(props: AnimatedIconProps) {
  return <Animated icon={Settings} animation={spin} color="var(--text-secondary)" {...props} />;
}

export function AnimatedGlobe(props: AnimatedIconProps) {
  return <Animated icon={Globe} animation={spin} color="#3b82f6" {...props} />;
}

export function AnimatedParty(props: AnimatedIconProps) {
  return <Animated icon={PartyPopper} animation={bounce} color="#f59e0b" {...props} />;
}

export function AnimatedTrophy(props: AnimatedIconProps) {
  return <Animated icon={Trophy} animation={glow} color="#f59e0b" {...props} />;
}

export function AnimatedSparkles(props: AnimatedIconProps) {
  return <Animated icon={Sparkles} animation={shimmer} color="var(--primary)" {...props} />;
}

export function AnimatedSave(props: AnimatedIconProps) {
  return <Animated icon={Save} animation={pulse} color="#10b981" {...props} />;
}

export function AnimatedClipboard(props: AnimatedIconProps) {
  return <Animated icon={Clipboard} animation={float} color="var(--primary)" {...props} />;
}

export function AnimatedDice(props: AnimatedIconProps) {
  return <Animated icon={Dice1} animation={bounce} color="var(--primary)" {...props} />;
}

export function AnimatedPuzzle(props: AnimatedIconProps) {
  return <Animated icon={Puzzle} animation={pulse} color="#8b5cf6" {...props} />;
}

export function AnimatedLock(props: AnimatedIconProps) {
  return <Animated icon={Lock} animation={shake} color="#ef4444" {...props} />;
}

export function AnimatedCompass(props: AnimatedIconProps) {
  return <Animated icon={Compass} animation={spin} color="var(--primary)" {...props} />;
}

export function AnimatedHandshake(props: AnimatedIconProps) {
  return <Animated icon={Handshake} animation={pulse} color="#10b981" {...props} />;
}

export function AnimatedMegaphone(props: AnimatedIconProps) {
  return <Animated icon={Megaphone} animation={bounce} color="var(--primary)" {...props} />;
}

export function AnimatedBlocks(props: AnimatedIconProps) {
  return <Animated icon={Blocks} animation={float} color="#3b82f6" {...props} />;
}

export function AnimatedTrees(props: AnimatedIconProps) {
  return <Animated icon={Trees} animation={float} color="#10b981" {...props} />;
}

export function AnimatedZap(props: AnimatedIconProps) {
  return <Animated icon={Zap} animation={shimmer} color="#f59e0b" {...props} />;
}

export function AnimatedEye(props: AnimatedIconProps) {
  return <Animated icon={Eye} animation={pulse} color="var(--primary)" {...props} />;
}

export function AnimatedMessageCircle(props: AnimatedIconProps) {
  return <Animated icon={MessageCircle} animation={bounce} color="var(--primary)" {...props} />;
}

export function AnimatedDownload(props: AnimatedIconProps) {
  return <Animated icon={Download} animation={float} color="#3b82f6" {...props} />;
}

export function AnimatedCreditCard(props: AnimatedIconProps) {
  return <Animated icon={CreditCard} animation={pulse} color="var(--primary)" {...props} />;
}

export function AnimatedUser(props: AnimatedIconProps) {
  return <Animated icon={User} animation={pulse} color="var(--primary)" {...props} />;
}

export function AnimatedTarget(props: AnimatedIconProps) {
  return <Animated icon={Target} animation={pulse} color="#10b981" {...props} />;
}

export function AnimatedUpload(props: AnimatedIconProps) {
  return <Animated icon={Upload} animation={float} color="var(--primary)" {...props} />;
}

export function AnimatedRefresh(props: AnimatedIconProps) {
  return <Animated icon={RefreshCw} animation={spin} color="var(--primary)" {...props} />;
}

export function AnimatedPalette(props: AnimatedIconProps) {
  return <Animated icon={Palette} animation={spin} color="var(--primary)" {...props} />;
}

export function AnimatedGraduationCap(props: AnimatedIconProps) {
  return <Animated icon={GraduationCap} animation={float} color="#8b5cf6" {...props} />;
}

export function AnimatedCode(props: AnimatedIconProps) {
  return <Animated icon={Code2} animation={pulse} color="var(--primary)" {...props} />;
}

export function AnimatedMic(props: AnimatedIconProps) {
  return <Animated icon={Mic} animation={pulse} color="var(--primary)" {...props} />;
}

export function AnimatedBriefcase(props: AnimatedIconProps) {
  return <Animated icon={Briefcase} animation={float} color="#3b82f6" {...props} />;
}

export function AnimatedBookOpen(props: AnimatedIconProps) {
  return <Animated icon={BookOpen} animation={float} color="var(--primary)" {...props} />;
}

export function AnimatedWand(props: AnimatedIconProps) {
  return <Animated icon={Wand2} animation={shimmer} color="var(--primary)" {...props} />;
}

export function AnimatedStar(props: AnimatedIconProps) {
  return <Animated icon={Star} animation={glow} color="#f59e0b" {...props} />;
}

export function AnimatedCrown(props: AnimatedIconProps) {
  return <Animated icon={Crown} animation={glow} color="#f59e0b" {...props} />;
}

export function AnimatedArrowUpRight(props: AnimatedIconProps) {
  return <Animated icon={ArrowUpRight} animation={float} color="#10b981" {...props} />;
}

export function AnimatedBell(props: AnimatedIconProps) {
  return <Animated icon={Bell} animation={wiggle} color="var(--primary)" {...props} />;
}

export function AnimatedAlertTriangle(props: AnimatedIconProps) {
  return <Animated icon={AlertTriangle} animation={shimmer} color="#f59e0b" {...props} />;
}

export function AnimatedLoader(props: AnimatedIconProps) {
  return <Animated icon={Loader2} animation={spin} {...props} />;
}

export function AnimatedShoppingCart(props: AnimatedIconProps) {
  return <Animated icon={ShoppingCart} animation={bounce} color="var(--primary)" {...props} />;
}

export function AnimatedDollar(props: AnimatedIconProps) {
  return <Animated icon={DollarSign} animation={pulse} color="#10b981" {...props} />;
}

export function AnimatedShield(props: AnimatedIconProps) {
  return <Animated icon={Shield} animation={pulse} color="var(--primary)" {...props} />;
}

export function AnimatedTerminal(props: AnimatedIconProps) {
  return <Animated icon={Terminal} animation={pulse} color="#10b981" {...props} />;
}

export function AnimatedHardDrive(props: AnimatedIconProps) {
  return <Animated icon={HardDrive} animation={float} color="var(--primary)" {...props} />;
}

export function AnimatedCpu(props: AnimatedIconProps) {
  return <Animated icon={Cpu} animation={pulse} color="var(--primary)" {...props} />;
}

export function AnimatedSmartphone(props: AnimatedIconProps) {
  return <Animated icon={Smartphone} animation={wiggle} color="var(--primary)" {...props} />;
}

export function AnimatedBan(props: AnimatedIconProps) {
  return <Animated icon={Ban} animation={shake} color="#ef4444" {...props} />;
}

export function AnimatedFlag(props: AnimatedIconProps) {
  return <Animated icon={Flag} animation={float} color="#ef4444" {...props} />;
}

export function AnimatedUsers(props: AnimatedIconProps) {
  return <Animated icon={UsersRound} animation={pulse} color="var(--primary)" {...props} />;
}

export function AnimatedBot(props: AnimatedIconProps) {
  return <Animated icon={Bot} animation={pulse} color="var(--primary)" {...props} />;
}

export function AnimatedPen(props: AnimatedIconProps) {
  return <Animated icon={Pen} animation={bounce} color="var(--primary)" {...props} />;
}

export function AnimatedActivity(props: AnimatedIconProps) {
  return <Animated icon={Activity} animation={pulse} color="#10b981" {...props} />;
}

export function AnimatedServer(props: AnimatedIconProps) {
  return <Animated icon={Server} animation={pulse} color="var(--primary)" {...props} />;
}

export function AnimatedLink(props: AnimatedIconProps) {
  return <Animated icon={Link} animation={pulse} color="#3b82f6" {...props} />;
}

export function AnimatedBookMarked(props: AnimatedIconProps) {
  return <Animated icon={BookMarked} animation={float} color="var(--primary)" {...props} />;
}
