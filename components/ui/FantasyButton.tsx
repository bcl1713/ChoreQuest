'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ANIMATION_DURATION } from '@/lib/animations/constants';
import { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type FantasyButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';
export type FantasyButtonSize = 'sm' | 'md' | 'lg';

export interface FantasyButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  /** Button visual variant */
  variant?: FantasyButtonVariant;
  /** Button size */
  size?: FantasyButtonSize;
  /** Loading state - shows spinner and disables button */
  isLoading?: boolean;
  /** Optional icon to display before text */
  icon?: ReactNode;
  /** Children to render inside button */
  children: ReactNode;
}

/**
 * Fantasy-themed button component with animations and variants.
 * Supports multiple variants, sizes, loading states, and hover animations.
 * Respects user's motion preferences for accessibility.
 *
 * @deprecated Use the `Button` component from `@/components/ui/button` instead.
 * This component will be removed in v1.0.0. See the migration guide:
 * https://github.com/chore-quest/chore-quest/wiki/Button-Migration-Guide
 *
 * Migration path:
 * - Replace `<FantasyButton>` with `<Button>`
 * - The `Button` component has similar props and better accessibility
 * - `icon` prop → use `startIcon` prop instead
 * - `variant` prop works the same way
 *
 * Example:
 * ```tsx
 * // Before
 * <FantasyButton variant="primary" icon={<IconComponent />}>Click me</FantasyButton>
 *
 * // After
 * <Button variant="primary" startIcon={<IconComponent />}>Click me</Button>
 * ```
 */
export const FantasyButton = forwardRef<HTMLButtonElement, FantasyButtonProps>(function FantasyButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  disabled,
  className,
  ...props
}, ref) {
  // Development warning for deprecated component
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[DEPRECATION] FantasyButton is deprecated and will be removed in v1.0.0. ' +
      'Please use the Button component from @/components/ui/button instead. ' +
      'See https://github.com/chore-quest/chore-quest/wiki/Button-Migration-Guide for migration details.'
    );
  }

  const prefersReducedMotion = useReducedMotion();

  // Variant styles
  const variantClasses = {
    primary: 'fantasy-button-primary',
    secondary: 'fantasy-button-secondary',
    danger: 'fantasy-button-danger',
    success: 'fantasy-button-success',
  };

  // Size styles
  const sizeClasses = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-6 text-base',
    lg: 'py-4 px-8 text-lg',
  };

  const isDisabled = disabled || isLoading;

  // Animation variants
  const buttonAnimation = prefersReducedMotion
    ? {}
    : {
        whileHover: isDisabled ? {} : { scale: 1.05 },
        whileTap: isDisabled ? {} : { scale: 0.95 },
        transition: {
          duration: ANIMATION_DURATION.QUICK / 1000,
        },
      };

  return (
    <motion.button
      ref={ref}
      {...buttonAnimation}
      disabled={isDisabled}
      className={cn(
        variantClasses[variant],
        sizeClasses[size],
        'relative inline-flex items-center justify-center gap-2 touch-target',
        isLoading && 'cursor-wait',
        className
      )}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!isLoading && icon && <span className="inline-flex">{icon}</span>}
      <span>{children}</span>
    </motion.button>
  );
});
