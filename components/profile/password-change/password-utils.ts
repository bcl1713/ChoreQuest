export type PasswordStrength = 'weak' | 'medium' | 'strong';

export const evaluatePasswordStrength = (password: string): PasswordStrength => {
  if (password.length < 8) return 'weak';
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  if (hasUppercase && (hasNumber || hasSpecial)) return 'strong';
  if (hasUppercase || hasNumber || hasSpecial) return 'medium';
  return 'weak';
};

export const getStrengthColor = (strength: PasswordStrength) => {
  switch (strength) {
    case 'weak':
      return 'text-red-400';
    case 'medium':
      return 'text-amber-400';
    case 'strong':
      return 'text-green-400';
  }
};

export const getStrengthBgColor = (strength: PasswordStrength) => {
  switch (strength) {
    case 'weak':
      return 'bg-red-900/30 border-red-500/30';
    case 'medium':
      return 'bg-amber-900/30 border-amber-500/30';
    case 'strong':
      return 'bg-green-900/30 border-green-500/30';
  }
};
