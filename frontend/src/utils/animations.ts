import type { Variants, Transition } from "framer-motion";

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.07, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.07, duration: 0.4 },
  }),
  exit: { opacity: 0, x: 24, transition: { duration: 0.2 } },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.07, duration: 0.4 },
  }),
  exit: { opacity: 0, x: -24, transition: { duration: 0.2 } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number = 0) => ({
    opacity: 1,
    transition: { delay: i * 0.05, duration: 0.35 },
  }),
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -24, transition: { duration: 0.25 } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export const springConfig: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 20,
};

export const smoothConfig: Transition = {
  duration: 0.35,
  ease: [0.25, 0.46, 0.45, 0.94],
};

export const hoverLift = {
  whileHover: { y: -3, scale: 1.008 },
  whileTap: { scale: 0.98 },
};

export const hoverGlow = {
  whileHover: { boxShadow: "0 0 20px rgba(245,158,11,0.15)" },
};

export const buttonHover = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 },
};
