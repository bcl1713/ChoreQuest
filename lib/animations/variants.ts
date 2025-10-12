import { Variants } from 'framer-motion';
import { ANIMATION_DURATION, EASING, STAGGER } from './constants';

/**
 * Framer Motion animation variants for consistent motion design.
 * Each variant includes a 'reduced' option for accessibility.
 */

/**
 * Fade in animation - element becomes visible
 */
export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: ANIMATION_DURATION.MEDIUM / 1000,
      ease: EASING.EASE_OUT,
    },
  },
  reduced: {
    opacity: 1,
    transition: {
      duration: 0,
    },
  },
};

/**
 * Slide in from bottom - element slides up and fades in
 */
export const slideIn: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION.MEDIUM / 1000,
      ease: EASING.EASE_OUT,
    },
  },
  reduced: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0,
    },
  },
};

/**
 * Slide in from left - element slides from left and fades in
 */
export const slideInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: ANIMATION_DURATION.MEDIUM / 1000,
      ease: EASING.EASE_OUT,
    },
  },
  reduced: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0,
    },
  },
};

/**
 * Scale in animation - element grows from small to full size
 */
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: ANIMATION_DURATION.MEDIUM / 1000,
      ease: EASING.EASE_OUT,
    },
  },
  reduced: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0,
    },
  },
};

/**
 * Bounce scale in - element bounces in with playful overshoot
 */
export const bounceIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: ANIMATION_DURATION.MEDIUM / 1000,
      ease: EASING.BOUNCE,
    },
  },
  reduced: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0,
    },
  },
};

/**
 * Stagger container - delays children animations in sequence
 */
export const staggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: STAGGER.DELAY / 1000,
      delayChildren: 0.1,
    },
  },
  reduced: {
    opacity: 1,
    transition: {
      staggerChildren: 0,
      delayChildren: 0,
    },
  },
};

/**
 * Stagger item - child element for stagger animations
 */
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION.QUICK / 1000,
      ease: EASING.EASE_OUT,
    },
  },
  reduced: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0,
    },
  },
};

/**
 * Celebration burst - large scale animation with rotation
 */
export const celebrationBurst: Variants = {
  hidden: {
    opacity: 0,
    scale: 0,
    rotate: -180,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: ANIMATION_DURATION.CELEBRATION / 1000,
      ease: EASING.ELASTIC,
    },
  },
  reduced: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0,
    },
  },
};

/**
 * Celebration float - element floats up and fades out
 */
export const celebrationFloat: Variants = {
  hidden: {
    opacity: 0,
    y: 0,
  },
  visible: {
    opacity: [0, 1, 1, 0],
    y: -100,
    transition: {
      duration: ANIMATION_DURATION.CELEBRATION / 1000,
      ease: EASING.EASE_OUT,
      opacity: {
        times: [0, 0.2, 0.8, 1],
      },
    },
  },
  reduced: {
    opacity: 0,
    y: 0,
    transition: {
      duration: 0,
    },
  },
};

/**
 * Pulse animation - gentle scale pulse for attention
 */
export const pulse: Variants = {
  hidden: {
    scale: 1,
  },
  visible: {
    scale: [1, 1.05, 1],
    transition: {
      duration: ANIMATION_DURATION.SLOW / 1000,
      repeat: Infinity,
      ease: EASING.EASE_IN_OUT,
    },
  },
  reduced: {
    scale: 1,
    transition: {
      duration: 0,
    },
  },
};

/**
 * Glow effect - opacity pulse for glowing elements
 */
export const glow: Variants = {
  hidden: {
    opacity: 0.5,
  },
  visible: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: ANIMATION_DURATION.CELEBRATION / 1000,
      repeat: Infinity,
      ease: EASING.EASE_IN_OUT,
    },
  },
  reduced: {
    opacity: 1,
    transition: {
      duration: 0,
    },
  },
};

/**
 * Modal backdrop - fades in background overlay
 */
export const modalBackdrop: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: ANIMATION_DURATION.QUICK / 1000,
    },
  },
  reduced: {
    opacity: 1,
    transition: {
      duration: 0,
    },
  },
};

/**
 * Modal content - scales in from center
 */
export const modalContent: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION.MEDIUM / 1000,
      ease: EASING.EASE_OUT,
    },
  },
  reduced: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0,
    },
  },
};
