'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { FantasyButton } from '@/components/ui';
import { ErrorAlert } from './shared/ErrorAlert';
import { PasswordField } from './password-change/PasswordField';
import { PasswordRequirements } from './password-change/PasswordRequirements';
import { PasswordStrengthIndicator } from './password-change/PasswordStrengthIndicator';
import { evaluatePasswordStrength } from './password-change/password-utils';

interface PasswordChangeFormProps {
  onSuccess: (message: string) => void;
}

export default function PasswordChangeForm({ onSuccess }: PasswordChangeFormProps) {
  const { updatePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordStrength = evaluatePasswordStrength(newPassword);

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
        <PasswordField
          id="currentPassword"
          label="Current Password"
          value={currentPassword}
          placeholder="Enter current password..."
          showPassword={showCurrentPassword}
          onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
          onChange={setCurrentPassword}
          disabled={isLoading}
        />

        <div>
          <PasswordField
            id="newPassword"
            label="New Password"
            value={newPassword}
            placeholder="Enter new password..."
            showPassword={showNewPassword}
            onToggle={() => setShowNewPassword(!showNewPassword)}
            onChange={setNewPassword}
            disabled={isLoading}
          />

          {newPassword && <PasswordStrengthIndicator passwordStrength={passwordStrength} />}
          <PasswordRequirements password={newPassword} />
        </div>

        <div>
          <PasswordField
            id="confirmPassword"
            label="Confirm Password"
            value={confirmPassword}
            placeholder="Confirm new password..."
            showPassword={showConfirmPassword}
            onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
            onChange={setConfirmPassword}
            disabled={isLoading}
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-red-400 text-xs mt-2">Passwords do not match</p>
          )}
        </div>

        {error && <ErrorAlert message={error} />}

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
