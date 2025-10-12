'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FantasyIconType = 'gold' | 'xp' | 'gem' | 'default';
export type FantasyIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface FantasyIconProps {
  /** Lucide icon component to render */
  icon: LucideIcon;
  /** Icon type for color theming */
  type?: FantasyIconType;
  /** Icon size */
  size?: FantasyIconSize;
  /** Enable glow effect */
  glow?: boolean;
  /** Custom className */
  className?: string;
  /** ARIA label for accessibility */
  'aria-label'?: string;
}

/**
 * Fantasy-themed icon wrapper for Lucide icons.
 * Provides consistent sizing, coloring by type, and optional glow effects.
 * Accessible with proper ARIA attributes.
 */
export function FantasyIcon({
  icon: Icon,
  type = 'default',
  size = 'md',
  glow = false,
  className,
  'aria-label': ariaLabel,
}: FantasyIconProps) {
  // Size classes
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
  };

  // Color classes by type
  const typeClasses = {
    gold: 'text-gold-500',
    xp: 'text-xp-500',
    gem: 'text-gem-500',
    default: 'text-current',
  };

  // Glow classes by type
  const glowClasses = {
    gold: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]',
    xp: 'drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]',
    gem: 'drop-shadow-[0_0_8px_rgba(14,165,233,0.6)]',
    default: 'drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]',
  };

  return (
    <Icon
      className={cn(
        sizeClasses[size],
        typeClasses[type],
        glow && glowClasses[type],
        className
      )}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
    />
  );
}
