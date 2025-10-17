'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import AuthForm from '@/components/auth/AuthForm';

export default function CreateFamilyPage() {
  const router = useRouter();
  const { user, family, createFamily, isLoading, error, setCharacterName } = useAuth();

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleCreateFamily = async (data: Record<string, string>) => {
    try {
      // Extract and validate required fields (already validated by Zod in AuthForm)
      const { name, email, password, userName } = data;
      if (!name || !email || !password || !userName) {
        throw new Error('Missing required fields for family creation');
      }
      await createFamily({ name, email, password, userName });
      // Store character name for pre-filling in character creation
      setCharacterName(userName);
      // Also persist to sessionStorage since we're doing a full page navigation
      sessionStorage.setItem('pendingCharacterName', userName);
      // Navigate to character creation after successful family creation
      // New Guild Masters need to create their character before accessing dashboard
      window.location.href = '/character/create';
    } catch (err) {
      // Error will be handled by createFamily function
      console.error('CreateFamily - Family creation failed:', err);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Redirecting to your realm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthForm
          type="create-family"
          onSubmit={handleCreateFamily}
          isLoading={isLoading}
          error={error}
        />

        {family && (
          <div className="mt-6 p-4 bg-gold-900/20 border border-gold-500/30 rounded-lg">
            <p className="text-gold-400 text-sm font-semibold mb-2">🏰 Guild Successfully Founded!</p>
            <p className="text-gray-300 text-sm">
              Your guild code: <span className="font-mono text-gold-300">{family.code}</span>
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Share this code with family members so they can join your guild!
            </p>
          </div>
        )}

        <div className="mt-8 text-center space-y-4">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary-400 hover:text-primary-300 font-semibold">
              Enter the Realm
            </Link>
          </p>
          <p className="text-gray-400">
            Want to join an existing guild?{' '}
            <Link href="/auth/register" className="text-gem-400 hover:text-gem-300 font-semibold">
              Join Guild
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}