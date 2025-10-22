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
  sm: 'px-3 text-[0.95rem] leading-tight min-w-[2.5rem] [--btn-height:2.1rem] [--btn-icon-size:1.1rem] [--btn-gap:0.5rem]',
  md: 'px-4 text-[1.05rem] leading-snug min-w-[3rem] [--btn-height:2.35rem] [--btn-icon-size:1.3rem] [--btn-gap:0.6rem]',
  lg: 'px-5 text-[1.2rem] leading-snug min-w-[3.5rem] [--btn-height:2.6rem] [--btn-icon-size:1.55rem] [--btn-gap:0.75rem]',
  icon: 'h-10 w-10 p-0',
};

const renderIconContent = (icon: ReactNode) =>
  icon ? (
    <span
      className="flex h-full w-full items-center justify-center [&>svg]:h-full [&>svg]:w-full [&>svg]:shrink-0 [&>*]:max-h-full [&>*]:max-w-full"
      style={{ fontSize: 'var(--btn-icon-size, 1.25rem)' }}
    >
      {icon}
    </span>
  ) : null;

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
  const hasStartVisual = Boolean(startIcon) || isLoading;
  const hasEndVisual = Boolean(endIcon);
  const shouldRenderStartSlot = !isIconButton || hasStartVisual;
  const shouldRenderEndSlot = !isIconButton || hasEndVisual;
  const usesGridLayout = !isIconButton;
  const iconDimensionClass = 'h-[var(--btn-icon-size,1.25rem)] w-[var(--btn-icon-size,1.25rem)]';
  const spinnerSizeClass = isIconButton ? 'h-5 w-5' : iconDimensionClass;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      className={cn(
        'relative rounded-lg font-semibold transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed',
        usesGridLayout
          ? 'inline-grid grid-cols-[var(--btn-icon-size,1.25rem),1fr,var(--btn-icon-size,1.25rem)] items-center gap-x-[var(--btn-gap,0.5rem)] py-0 min-h-[var(--btn-height,2.35rem)]'
          : 'inline-flex items-center justify-center',
        baseFocus,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        isLoading && 'cursor-wait',
        className
      )}
      {...props}
    >
      {shouldRenderStartSlot && (
        <span
          className={cn(
            'pointer-events-none flex items-center justify-center overflow-hidden transition-opacity duration-150',
            isIconButton
              ? 'absolute inset-0'
              : cn(iconDimensionClass, 'justify-self-start'),
            hasStartVisual ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden={!hasStartVisual}
        >
          {isLoading ? (
            <svg
              className={cn(spinnerSizeClass, 'animate-spin text-current')}
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
          ) : renderIconContent(startIcon)}
        </span>
      )}

      <span
        className={cn(
          'inline-flex items-center justify-center',
          usesGridLayout && 'justify-self-center text-center',
          isIconButton && !hasEndVisual && 'h-full w-full'
        )}
      >
        {children}
      </span>

      {shouldRenderEndSlot && (
        <span
          className={cn(
            'pointer-events-none flex items-center justify-center overflow-hidden transition-opacity duration-150',
            usesGridLayout ? cn(iconDimensionClass, 'justify-self-end') : '',
            hasEndVisual ? 'opacity-100' : 'opacity-0',
            isIconButton && !hasEndVisual && 'hidden'
          )}
          aria-hidden={!hasEndVisual}
        >
          {hasEndVisual ? renderIconContent(endIcon) : null}
        </span>
      )}
    </button>
  );
});
