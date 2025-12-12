import { cn } from '@/lib/utils';
import {
  PasswordStrength,
  getStrengthBgColor,
  getStrengthColor,
} from './password-utils';

interface PasswordStrengthIndicatorProps {
  passwordStrength: PasswordStrength;
}

export function PasswordStrengthIndicator({
  passwordStrength,
}: PasswordStrengthIndicatorProps) {
  return (
    <div
      className={cn(
        'mt-3 p-3 rounded-lg border',
        getStrengthBgColor(passwordStrength)
      )}
    >
      <div className={cn('font-semibold text-sm', getStrengthColor(passwordStrength))}>
        {passwordStrength === 'strong'
          ? '✓ Strong Password'
          : passwordStrength === 'medium'
            ? '◐ Medium Password'
            : '✗ Weak Password'}
      </div>
    </div>
  );
}
