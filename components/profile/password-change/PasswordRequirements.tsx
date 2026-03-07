import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordRequirementsProps {
  password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  return (
    <div className="mt-3 space-y-2">
      <div className="text-xs font-medium text-gray-400 mb-2">
        Password must contain:
      </div>
      <div className="space-y-1 text-xs">
        <div
          className={cn(
            'flex items-center gap-2',
            password.length >= 8 ? 'text-green-400' : 'text-gray-400'
          )}
        >
          {password.length >= 8 ? <Check size={14} /> : <X size={14} />}
          At least 8 characters
        </div>
        <div
          className={cn(
            'flex items-center gap-2',
            /[A-Z]/.test(password) ? 'text-green-400' : 'text-gray-400'
          )}
        >
          {/[A-Z]/.test(password) ? <Check size={14} /> : <X size={14} />}
          One uppercase letter (A-Z)
        </div>
        <div
          className={cn(
            'flex items-center gap-2',
            /[\d!@#$%^&*()_+\-=[\]{};':\"\\|,.<>/?]/.test(password)
              ? 'text-green-400'
              : 'text-gray-400'
          )}
        >
          {/[\d!@#$%^&*()_+\-=[\]{};':\"\\|,.<>/?]/.test(password) ? (
            <Check size={14} />
          ) : (
            <X size={14} />
          )}
          One number or special character
        </div>
      </div>
    </div>
  );
}
