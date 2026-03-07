import { Eye, EyeOff } from 'lucide-react';

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  showPassword: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function PasswordField({
  id,
  label,
  value,
  placeholder,
  showPassword,
  onToggle,
  onChange,
  disabled = false,
}: PasswordFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-300 mb-2"
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="fantasy-input w-full px-4 py-3 pr-12 bg-dark-800/50 border border-gold-700/30 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-white placeholder-gray-400"
          placeholder={placeholder}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
