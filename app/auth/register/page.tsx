'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import AuthForm from '@/components/auth/AuthForm';

export default function RegisterPage() {
  const router = useRouter();
  const { user, register, isLoading, error } = useAuth();

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

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
          type="register"
          onSubmit={register}
          isLoading={isLoading}
          error={error}
        />

        <div className="mt-8 text-center space-y-4">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary-400 hover:text-primary-300 font-semibold">
              Enter the Realm
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