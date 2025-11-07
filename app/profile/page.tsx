'use client';

import { useAuth } from '@/lib/auth-context';
import { useCharacter } from '@/lib/character-context';
import { LoadingSpinner } from '@/components/ui';
import ProfileSettings from '@/components/profile/ProfileSettings';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { character, isLoading: characterLoading, error: characterError } = useCharacter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || characterLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (characterError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-6">
        <div className="fantasy-card p-8 max-w-md w-full">
          <div className="text-center">
            <h1 className="text-2xl font-fantasy text-gold-400 mb-4">Error Loading Profile</h1>
            <p className="text-gray-300 mb-6">{characterError}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn btn-primary"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-6">
        <div className="fantasy-card p-8 max-w-md w-full">
          <div className="text-center">
            <h1 className="text-2xl font-fantasy text-gold-400 mb-4">No Character Found</h1>
            <p className="text-gray-300 mb-6">You need to create a character first.</p>
            <button
              onClick={() => router.push('/character/create')}
              className="btn btn-primary"
            >
              Create Character
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <ProfileSettings character={character} />
      </div>
    </div>
  );
}
