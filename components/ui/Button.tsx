import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'destructive'
  | 'gold'
  | 'outline'
  | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style of the button */
  variant?: ButtonVariant;
  /** Padding and typography sizing */
  size?: ButtonSize;
  /** Displays a spinner and disables the button */
  isLoading?: boolean;
  /** Expands button to full width */
  fullWidth?: boolean;
  /** Optional icon rendered before the label */
  startIcon?: ReactNode;
  /** Optional icon rendered after the label */
  endIcon?: ReactNode;
}

const baseFocus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md focus-visible:ring-blue-400',
  secondary:
    'bg-dark-700 text-gray-200 border border-dark-500 hover:bg-dark-600 focus-visible:ring-gray-500',
  success:
    'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md focus-visible:ring-emerald-400',
  destructive:
    'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md focus-visible:ring-red-500',
  gold:
    'bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white shadow-md focus-visible:ring-gold-400',
  outline:
    'border border-gray-600 text-gray-200 hover:bg-gray-800 focus-visible:ring-gray-500',
  ghost:
    'text-gray-200 hover:bg-dark-800 focus-visible:ring-gray-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm min-h-[44px]',
  md: 'px-4 py-2.5 text-base min-h-[48px]',
  lg: 'px-6 py-3 text-lg min-h-[52px]',
  icon: 'h-10 w-10 p-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    fullWidth = false,
    startIcon,
    endIcon,
    disabled,
    type = 'button',
    className,
    children,
    ...props
  },
  ref
) {
  const isDisabled = disabled || isLoading;
  const isIconButton = size === 'icon';
  const showStartSlot = Boolean(startIcon) || isLoading;
  const showEndSlot = Boolean(endIcon);
  const applyGap = !isIconButton && (showStartSlot || showEndSlot);

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      className={cn(
        'relative inline-flex items-center justify-center rounded-lg font-semibold transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed',
        baseFocus,
        variantClasses[variant],
        sizeClasses[size],
        applyGap ? 'gap-2' : 'gap-0',
        fullWidth && 'w-full',
        isLoading && 'cursor-wait',
        className
      )}
      {...props}
    >
      {showStartSlot && (
        <span
          className={cn(
            'flex items-center justify-center transition-[width] duration-150',
            isIconButton ? 'absolute inset-0' : '',
            isLoading ? 'w-5' : 'w-4'
          )}
          aria-hidden={!isLoading && !startIcon}
        >
          {isLoading ? (
            <svg
              className="h-5 w-5 animate-spin text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
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
          ) : (
            startIcon
          )}
        </span>
      )}

      <span
        className={cn(
          'inline-flex items-center justify-center',
          isIconButton && !showEndSlot && 'h-full w-full'
        )}
      >
        {children}
      </span>

      {showEndSlot && (
        <span className="flex items-center justify-center">
          {endIcon}
        </span>
      )}
    </button>
  );
});
