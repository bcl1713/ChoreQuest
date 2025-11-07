'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { FantasyButton } from '@/components/ui';
import { Eye, EyeOff, AlertCircle, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordChangeFormProps {
  onSuccess: (message: string) => void;
}

type PasswordStrength = 'weak' | 'medium' | 'strong';

export default function PasswordChangeForm({
  onSuccess,
}: PasswordChangeFormProps) {
  const { updatePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluatePasswordStrength = (password: string): PasswordStrength => {
    if (password.length < 8) return 'weak';
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (hasUppercase && (hasNumber || hasSpecial)) return 'strong';
    if (hasUppercase || hasNumber || hasSpecial) return 'medium';
    return 'weak';
  };

  const passwordStrength = evaluatePasswordStrength(newPassword);

  const getStrengthColor = (strength: PasswordStrength) => {
    switch (strength) {
      case 'weak':
        return 'text-red-400';
      case 'medium':
        return 'text-amber-400';
      case 'strong':
        return 'text-green-400';
    }
  };

  const getStrengthBgColor = (strength: PasswordStrength) => {
    switch (strength) {
      case 'weak':
        return 'bg-red-900/30 border-red-500/30';
      case 'medium':
        return 'bg-amber-900/30 border-amber-500/30';
      case 'strong':
        return 'bg-green-900/30 border-green-500/30';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!currentPassword) {
      setError('Current password is required');
      return;
    }

    if (!newPassword) {
      setError('New password is required');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      setError('Password must contain at least one number or special character');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Trim whitespace from passwords before sending
      await updatePassword(currentPassword.trim(), newPassword.trim());
      onSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update password';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Password */}
        <div>
          <label
            htmlFor="currentPassword"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="fantasy-input w-full px-4 py-3 pr-12 bg-dark-800/50 border border-gold-700/30 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-white placeholder-gray-400"
              placeholder="Enter current password..."
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              tabIndex={-1}
            >
              {showCurrentPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            New Password
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="fantasy-input w-full px-4 py-3 pr-12 bg-dark-800/50 border border-gold-700/30 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-white placeholder-gray-400"
              placeholder="Enter new password..."
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              tabIndex={-1}
            >
              {showNewPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {newPassword && (
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
          )}

          {/* Password Requirements */}
          <div className="mt-3 space-y-2">
            <div className="text-xs font-medium text-gray-400 mb-2">
              Password must contain:
            </div>
            <div className="space-y-1 text-xs">
              <div
                className={cn(
                  'flex items-center gap-2',
                  newPassword.length >= 8
                    ? 'text-green-400'
                    : 'text-gray-400'
                )}
              >
                {newPassword.length >= 8 ? (
                  <Check size={14} />
                ) : (
                  <X size={14} />
                )}
                At least 8 characters
              </div>
              <div
                className={cn(
                  'flex items-center gap-2',
                  /[A-Z]/.test(newPassword)
                    ? 'text-green-400'
                    : 'text-gray-400'
                )}
              >
                {/[A-Z]/.test(newPassword) ? (
                  <Check size={14} />
                ) : (
                  <X size={14} />
                )}
                One uppercase letter (A-Z)
              </div>
              <div
                className={cn(
                  'flex items-center gap-2',
                  /[\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
                    newPassword
                  )
                    ? 'text-green-400'
                    : 'text-gray-400'
                )}
              >
                {/[\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
                  newPassword
                ) ? (
                  <Check size={14} />
                ) : (
                  <X size={14} />
                )}
                One number or special character
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="fantasy-input w-full px-4 py-3 pr-12 bg-dark-800/50 border border-gold-700/30 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-white placeholder-gray-400"
              placeholder="Confirm new password..."
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-red-400 text-xs mt-2">Passwords do not match</p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex gap-3 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <FantasyButton
          type="submit"
          disabled={
            isLoading ||
            !currentPassword ||
            !newPassword ||
            !confirmPassword ||
            newPassword !== confirmPassword ||
            newPassword.length < 8 ||
            !/[A-Z]/.test(newPassword) ||
            !/[\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)
          }
          isLoading={isLoading}
          className="w-full justify-center"
        >
          {isLoading ? 'Updating Password...' : 'Update Password'}
        </FantasyButton>
      </form>
    </div>
  );
}
