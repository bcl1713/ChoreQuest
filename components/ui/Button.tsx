import { forwardRef, ButtonHTMLAttributes, ReactNode, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'destructive'
  | 'gold'
  | 'gold-solid'
  | 'outline'
  | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon-sm' | 'icon';

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
  'gold-solid':
    'bg-gold-600 hover:bg-gold-700 text-dark-900 shadow-md focus-visible:ring-gold-500',
  outline:
    'border border-gray-600 text-gray-200 hover:bg-gray-800 focus-visible:ring-gray-500',
  ghost:
    'text-gray-200 hover:bg-dark-800 focus-visible:ring-gray-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm leading-tight [--btn-icon-size:1rem] [--btn-gap:0.5rem]',
  md: 'px-4 py-2.5 text-base leading-snug [--btn-icon-size:1rem] [--btn-gap:0.65rem]',
  lg: 'px-5 py-3 text-lg leading-snug [--btn-icon-size:1.25rem] [--btn-gap:0.75rem]',
  'icon-sm': 'h-10 w-10 p-2 [--btn-icon-size:1.25rem] [--btn-gap:0]',
  icon: 'h-11 w-11 p-0 [--btn-icon-size:1.5rem] [--btn-gap:0]',
};

const iconWrapperClass =
  'pointer-events-none flex items-center justify-center shrink-0 leading-none transition-opacity duration-150 [&>svg]:h-full [&>svg]:w-full [&>*]:max-h-full [&>*]:max-w-full';

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
  icon: 'h-full w-full',
  'icon-sm': 'h-full w-full',
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
  const showStartSlot = Boolean(startIcon) || isLoading;
  const showEndSlot = Boolean(endIcon);
  const iconSizeStyle: CSSProperties = {
    width: 'var(--btn-icon-size, 1.3rem)',
    height: 'var(--btn-icon-size, 1.3rem)',
  };
  const spinnerMarkup = (
    <svg
      className="h-full w-full animate-spin text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label="Loading"
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
  );

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      className={cn(
        'relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-[var(--btn-gap,0.65rem)] rounded-lg font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60',
        baseFocus,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        isLoading && 'cursor-wait',
        className
      )}
      {...props}
    >
      {showStartSlot && (
        <span
          className={cn(iconWrapperClass, iconSizeClasses[size])}
          style={iconSizeStyle}
          aria-hidden={isLoading ? undefined : true}
        >
          {isLoading ? spinnerMarkup : startIcon}
        </span>
      )}

      {children && (
        <span className="flex items-center justify-center whitespace-nowrap text-center">
          {children}
        </span>
      )}

      {showEndSlot && (
        <span
          className={cn(iconWrapperClass, iconSizeClasses[size])}
          style={iconSizeStyle}
          aria-hidden="true"
        >
          {endIcon}
        </span>
      )}
    </button>
  );
});
