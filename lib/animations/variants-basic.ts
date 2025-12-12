import { Variants } from "framer-motion";
import { ANIMATION_DURATION, EASING, STAGGER } from "./constants";

// Core motion primitives used across the app.
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: ANIMATION_DURATION.MEDIUM / 1000, ease: EASING.EASE_OUT },
  },
  reduced: { opacity: 1, transition: { duration: 0 } },
};

export const slideIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: ANIMATION_DURATION.MEDIUM / 1000, ease: EASING.EASE_OUT },
  },
  reduced: { opacity: 1, y: 0, transition: { duration: 0 } },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: ANIMATION_DURATION.MEDIUM / 1000, ease: EASING.EASE_OUT },
  },
  reduced: { opacity: 1, x: 0, transition: { duration: 0 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: ANIMATION_DURATION.MEDIUM / 1000, ease: EASING.EASE_OUT },
  },
  reduced: { opacity: 1, scale: 1, transition: { duration: 0 } },
};

export const bounceIn: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: ANIMATION_DURATION.MEDIUM / 1000, ease: EASING.BOUNCE },
  },
  reduced: { opacity: 1, scale: 1, transition: { duration: 0 } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: STAGGER.DELAY / 1000, delayChildren: 0.1 },
  },
  reduced: { opacity: 1, transition: { staggerChildren: 0, delayChildren: 0 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: ANIMATION_DURATION.QUICK / 1000, ease: EASING.EASE_OUT },
  },
  reduced: { opacity: 1, y: 0, transition: { duration: 0 } },
};
