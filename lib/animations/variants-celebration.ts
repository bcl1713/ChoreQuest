import { Variants } from "framer-motion";
import { ANIMATION_DURATION, EASING } from "./constants";

// Celebration and overlay motions extracted from the main preset file.
export const celebrationBurst: Variants = {
  hidden: { opacity: 0, scale: 0, rotate: -180 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { duration: ANIMATION_DURATION.CELEBRATION / 1000, ease: EASING.ELASTIC },
  },
  reduced: { opacity: 1, scale: 1, rotate: 0, transition: { duration: 0 } },
};

export const celebrationFloat: Variants = {
  hidden: { opacity: 0, y: 0 },
  visible: {
    opacity: [0, 1, 1, 0],
    y: -100,
    transition: {
      duration: ANIMATION_DURATION.CELEBRATION / 1000,
      ease: EASING.EASE_OUT,
      opacity: { times: [0, 0.2, 0.8, 1] },
    },
  },
  reduced: { opacity: 0, y: 0, transition: { duration: 0 } },
};

export const pulse: Variants = {
  hidden: { scale: 1 },
  visible: {
    scale: [1, 1.05, 1],
    transition: {
      duration: ANIMATION_DURATION.SLOW / 1000,
      repeat: Infinity,
      ease: EASING.EASE_IN_OUT,
    },
  },
  reduced: { scale: 1, transition: { duration: 0 } },
};

export const glow: Variants = {
  hidden: { opacity: 0.5 },
  visible: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: ANIMATION_DURATION.CELEBRATION / 1000,
      repeat: Infinity,
      ease: EASING.EASE_IN_OUT,
    },
  },
  reduced: { opacity: 1, transition: { duration: 0 } },
};

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: ANIMATION_DURATION.QUICK / 1000 } },
  reduced: { opacity: 1, transition: { duration: 0 } },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: ANIMATION_DURATION.MEDIUM / 1000, ease: EASING.EASE_OUT },
  },
  reduced: { opacity: 1, scale: 1, y: 0, transition: { duration: 0 } },
};
