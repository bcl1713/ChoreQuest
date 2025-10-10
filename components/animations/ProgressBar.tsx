'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ANIMATION_DURATION, EASING } from '@/lib/animations/constants';

export interface ProgressBarProps {
  /** Current XP value */
  current: number;
  /** Maximum XP value for this level */
  max: number;
  /** Optional label to display above the bar */
  label?: string;
  /** Whether to show the numeric values (current/max) */
  showValues?: boolean;
  /** Whether to show percentage */
  showPercentage?: boolean;
  /** Optional className for styling */
  className?: string;
  /** Color scheme for the progress bar */
  variant?: 'default' | 'gold' | 'success' | 'danger';
}

const variantStyles = {
  default: {
    bg: 'bg-gray-700',
    fill: 'bg-gradient-to-r from-blue-500 to-purple-500',
    glow: 'shadow-[0_0_10px_rgba(147,51,234,0.5)]',
  },
  gold: {
    bg: 'bg-gray-700',
    fill: 'bg-gradient-to-r from-yellow-400 to-amber-500',
    glow: 'shadow-[0_0_10px_rgba(245,158,11,0.5)]',
  },
  success: {
    bg: 'bg-gray-700',
    fill: 'bg-gradient-to-r from-green-400 to-emerald-500',
    glow: 'shadow-[0_0_10px_rgba(16,185,129,0.5)]',
  },
  danger: {
    bg: 'bg-gray-700',
    fill: 'bg-gradient-to-r from-red-500 to-rose-600',
    glow: 'shadow-[0_0_10px_rgba(239,68,68,0.5)]',
  },
};

/**
 * ProgressBar component - displays animated XP or progress with smooth transitions.
 * Shows current/max values, percentage, and has a fantasy-themed glow effect.
 */
export function ProgressBar({
  current,
  max,
  label,
  showValues = true,
  showPercentage = true,
  className = '',
  variant = 'default',
}: ProgressBarProps) {
  const prefersReducedMotion = useReducedMotion();

  // Calculate percentage (0-100)
  const percentage = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;

  const styles = variantStyles[variant];

  return (
    <div className={`w-full ${className}`}>
      {/* Label and values row */}
      {(label || showValues || showPercentage) && (
        <div className="mb-2 flex items-center justify-between text-sm">
          {label && <span className="font-semibold text-gray-200">{label}</span>}
          <div className="flex items-center gap-3">
            {showValues && (
              <span className="text-gray-400">
                {current.toLocaleString()} / {max.toLocaleString()}
              </span>
            )}
            {showPercentage && (
              <span className="font-bold text-gray-200">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Progress bar container */}
      <div
        className={`relative h-6 overflow-hidden rounded-full border border-gray-600 ${styles.bg}`}
      >
        {/* Animated fill */}
        <motion.div
          className={`h-full ${styles.fill} ${styles.glow}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: prefersReducedMotion
              ? 0
              : ANIMATION_DURATION.MEDIUM / 1000,
            ease: prefersReducedMotion ? 'linear' : EASING.EASE_OUT,
          }}
        />

        {/* Shine effect overlay */}
        {!prefersReducedMotion && percentage > 0 && (
          <motion.div
            className="absolute inset-y-0 left-0 w-full"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
              width: '30%',
            }}
            animate={{
              x: ['-100%', '400%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
              ease: 'linear',
            }}
          />
        )}
      </div>
    </div>
  );
}
