'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import AuthForm from '@/components/auth/AuthForm';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, isLoading, error } = useAuth();

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleLogin = async (data: Record<string, string>) => {
    const { email, password } = data;
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    await login({ email, password });
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
          type="login"
          onSubmit={handleLogin}
          isLoading={isLoading}
          error={error}
        />

        <div className="mt-8 text-center space-y-4">
          <p className="text-gray-400">
            Don&apos;t have an account yet?{' '}
            <Link href="/auth/register" className="text-primary-400 hover:text-primary-300 font-semibold">
              Join a Guild
            </Link>
          </p>
          <p className="text-gray-400">
            Want to start your own family guild?{' '}
            <Link href="/auth/create-family" className="text-gold-400 hover:text-gold-300 font-semibold">
              Found New Guild
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}