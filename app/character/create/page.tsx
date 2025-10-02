'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCharacter } from '@/lib/character-context';
import CharacterCreation from '@/components/character/CharacterCreation';
import { Character } from '@/lib/types/database';

export default function CreateCharacterPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { refreshCharacter } = useCharacter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  const handleCharacterCreated = async (character: Character) => {
    console.log('Character created:', character);
    // Refresh character context to update the character data
    await refreshCharacter();
    // Now redirect to dashboard
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-fantasy text-transparent bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text font-bold mb-2">
            Create Your Hero
          </h1>
          <p className="text-gray-400">
            Choose your path and begin your legendary journey
          </p>
        </div>
        
        <CharacterCreation onCharacterCreated={handleCharacterCreated} />
      </div>
    </div>
  );
}