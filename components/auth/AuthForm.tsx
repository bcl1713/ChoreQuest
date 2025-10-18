'use client';

import { useState } from 'react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  familyCode: z.string().min(1, 'Family code is required')
});

const createFamilySchema = z.object({
  name: z.string().min(1, 'Family name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  userName: z.string().min(2, 'Your name must be at least 2 characters')
});

interface AuthFormProps {
  type: 'login' | 'register' | 'create-family';
  onSubmit: (data: Record<string, string>) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export default function AuthForm({ type, onSubmit, isLoading = false, error }: AuthFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const getSchema = () => {
    switch (type) {
      case 'login': return loginSchema;
      case 'register': return registerSchema;
      case 'create-family': return createFamilySchema;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'login': return 'Enter the Realm';
      case 'register': return 'Join the Guild';
      case 'create-family': return 'Found New Guild';
    }
  };

  const getFields = () => {
    const common = [
      { name: 'email', label: 'Email Address', type: 'email', placeholder: 'hero@example.com' }
    ];

    switch (type) {
      case 'login':
        return [
          ...common,
          { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' }
        ];
      case 'register':
        return [
          { name: 'name', label: 'Hero Name', type: 'text', placeholder: 'Sir Galahad' },
          ...common,
          { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
          { name: 'familyCode', label: 'Guild Code', type: 'text', placeholder: 'BraveKnights123' }
        ];
      case 'create-family':
        return [
          { name: 'name', label: 'Guild Name', type: 'text', placeholder: 'The Brave Knights' },
          { name: 'userName', label: 'Your Hero Name', type: 'text', placeholder: 'Sir Galahad' },
          ...common,
          { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' }
        ];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    console.log('AuthForm handleSubmit called, type:', type, 'formData:', formData);

    try {
      const schema = getSchema();
      const validatedData = schema.parse(formData);
      console.log('AuthForm calling onSubmit with:', validatedData);
      await onSubmit(validatedData);
      console.log('AuthForm onSubmit completed');
    } catch (error) {
      console.log('AuthForm onSubmit error:', error);
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setValidationErrors(errors);
      }
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="fantasy-card p-4 sm:p-8 w-full max-w-md mx-auto">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-fantasy text-transparent bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text font-bold mb-2">
          {getTitle()}
        </h2>
        {type === 'create-family' && (
          <p className="text-gray-400 text-sm">
            Establish your family&apos;s legendary guild and become the Guild Master
          </p>
        )}
        {type === 'register' && (
          <p className="text-gray-400 text-sm">
            Join an existing guild with your family code
          </p>
        )}
        {type === 'login' && (
          <p className="text-gray-400 text-sm">
            Welcome back, noble hero!
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {getFields().map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-300 mb-2">
              {field.label}
            </label>
            <input
              type={field.type}
              id={field.name}
              name={field.name}
              data-testid={`input-${field.name}`}
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="w-full px-4 py-4 bg-dark-700 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-base touch-target"
              disabled={isLoading}
            />
            {validationErrors[field.name] && (
              <p className="mt-1 text-sm text-red-400">{validationErrors[field.name]}</p>
            )}
          </div>
        ))}

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          data-testid="auth-submit-button"
          disabled={isLoading}
          className="w-full fantasy-button py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed touch-target"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            <>
              {type === 'login' && '🏰 Enter Realm'}
              {type === 'register' && '⚔️ Join Guild'}
              {type === 'create-family' && '👑 Found Guild'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}