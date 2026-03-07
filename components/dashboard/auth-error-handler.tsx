'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type AuthErrorHandlerProps = {
  onAuthError: (error: string | null) => void;
};

export function AuthErrorHandler({ onAuthError }: AuthErrorHandlerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'unauthorized') {
      onAuthError('You are not authorized to access the admin dashboard. Only Guild Masters have access.');
      setTimeout(() => onAuthError(null), 5000);
      router.replace('/dashboard', { scroll: false });
    }
  }, [searchParams, router, onAuthError]);

  return null;
}
