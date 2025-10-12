'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import { Loader2, Sword } from 'lucide-react';

export type LoadingSpinnerSize = 'sm' | 'md' | 'lg';
export type LoadingSpinnerVariant = 'default' | 'sword';

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: LoadingSpinnerSize;
  /** Visual variant */
  variant?: LoadingSpinnerVariant;
  /** Custom className */
  className?: string;
  /** Accessible label for screen readers */
  'aria-label'?: string;
}

/**
 * Fantasy-themed loading spinner component.
 * Uses spinning sword animation by default, with pulse fallback for reduced motion.
 * Accessible with proper ARIA attributes.
 */
export function LoadingSpinner({
  size = 'md',
  variant = 'sword',
  className,
  'aria-label': ariaLabel = 'Loading',
}: LoadingSpinnerProps) {
  const prefersReducedMotion = useReducedMotion();

  // Size classes
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const Icon = variant === 'sword' ? Sword : Loader2;

  // Animation for non-reduced motion
  const spinAnimation = {
    animate: {
      rotate: 360,
    },
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear' as const,
    },
  };

  // Pulse animation for reduced motion
  const pulseAnimation = {
    animate: {
      opacity: [1, 0.5, 1],
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  };

  const animation = prefersReducedMotion ? pulseAnimation : spinAnimation;

  return (
    <div
      className={cn('inline-flex items-center justify-center', className)}
      role="status"
      aria-label={ariaLabel}
    >
      <motion.div {...animation}>
        <Icon className={cn(sizeClasses[size], 'text-primary-500')} aria-hidden="true" />
      </motion.div>
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}
