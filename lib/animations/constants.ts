/**
 * Animation timing constants for consistent motion design across the app.
 * All durations are in milliseconds.
 */
export const ANIMATION_DURATION = {
  /** Quick, subtle animations (200ms) - for hover states, small transitions */
  QUICK: 200,
  /** Medium-length animations (400ms) - for most UI transitions */
  MEDIUM: 400,
  /** Celebration animations (1000ms) - for achievements, level ups, quest completions */
  CELEBRATION: 1000,
  /** Slow animations (600ms) - for more dramatic transitions */
  SLOW: 600,
} as const;

/**
 * Easing functions for natural motion.
 * Using cubic-bezier values that work well for fantasy-themed UI.
 */
export const EASING = {
  /** Smooth ease out - starts fast, ends slow */
  EASE_OUT: [0.16, 1, 0.3, 1],
  /** Smooth ease in - starts slow, ends fast */
  EASE_IN: [0.87, 0, 0.13, 1],
  /** Balanced ease in-out */
  EASE_IN_OUT: [0.65, 0, 0.35, 1],
  /** Bouncy easing for playful effects */
  BOUNCE: [0.68, -0.55, 0.265, 1.55],
  /** Elastic easing for celebration effects */
  ELASTIC: [0.68, -0.6, 0.32, 1.6],
} as const;

/**
 * Particle effect limits to maintain performance.
 */
export const PARTICLE_LIMITS = {
  /** Maximum number of particles for mobile devices */
  MAX_MOBILE: 15,
  /** Maximum number of particles for desktop devices */
  MAX_DESKTOP: 30,
  /** Default particle count for celebrations */
  DEFAULT: 20,
  /** Reduced particle count for lower-end devices */
  REDUCED: 8,
} as const;

/**
 * Stagger timing for list animations.
 * Used when animating multiple items in sequence.
 */
export const STAGGER = {
  /** Time between each item animation (ms) */
  DELAY: 50,
  /** Maximum total stagger duration to prevent long waits */
  MAX_DURATION: 500,
} as const;

/**
 * Spring animation configurations for Framer Motion.
 */
export const SPRING = {
  /** Bouncy spring for playful interactions */
  BOUNCY: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 17,
  },
  /** Smooth spring for most UI transitions */
  SMOOTH: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  },
  /** Gentle spring for subtle movements */
  GENTLE: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 25,
  },
} as const;
