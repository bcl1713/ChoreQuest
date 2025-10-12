'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ANIMATION_DURATION } from '@/lib/animations/constants';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type FantasyCardVariant = 'default' | 'primary' | 'gold' | 'gem' | 'xp';
export type FantasyCardGlow = 'none' | 'subtle' | 'strong';

export interface FantasyCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Card visual variant */
  variant?: FantasyCardVariant;
  /** Glow effect intensity */
  glow?: FantasyCardGlow;
  /** Enable hover lift animation */
  hoverable?: boolean;
  /** Children to render inside card */
  children: ReactNode;
}

/**
 * Fantasy-themed card component with gradient backgrounds and optional glow effects.
 * Supports multiple color variants, hover animations, and respects reduced motion preferences.
 */
export function FantasyCard({
  variant = 'default',
  glow = 'none',
  hoverable = false,
  children,
  className,
  ...props
}: FantasyCardProps) {
  const prefersReducedMotion = useReducedMotion();

  // Variant styles
  const variantClasses = {
    default: 'bg-gradient-to-br from-dark-800 to-dark-900 border-dark-600',
    primary: 'bg-gradient-to-br from-primary-900 to-primary-950 border-primary-700',
    gold: 'bg-gradient-to-br from-gold-900 to-gold-950 border-gold-700',
    gem: 'bg-gradient-to-br from-gem-900 to-gem-950 border-gem-700',
    xp: 'bg-gradient-to-br from-xp-900 to-xp-950 border-xp-700',
  };

  // Glow effect classes
  const glowClasses = {
    none: '',
    subtle: (() => {
      switch (variant) {
        case 'gold':
          return 'glow-gold';
        case 'gem':
          return 'glow-gem';
        case 'xp':
          return 'glow-xp';
        default:
          return '';
      }
    })(),
    strong: (() => {
      switch (variant) {
        case 'gold':
          return 'glow-effect-gold';
        case 'gem':
          return 'glow-effect-gem';
        case 'xp':
          return 'glow-effect-xp';
        default:
          return 'glow-effect';
      }
    })(),
  };

  // Animation variants
  const cardAnimation = prefersReducedMotion || !hoverable
    ? {}
    : {
        whileHover: {
          y: -4,
          scale: 1.02,
        },
        transition: {
          duration: ANIMATION_DURATION.QUICK / 1000,
        },
      };

  return (
    <motion.div
      {...cardAnimation}
      className={cn(
        'border rounded-lg shadow-lg p-6',
        variantClasses[variant],
        glowClasses[glow],
        hoverable && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
