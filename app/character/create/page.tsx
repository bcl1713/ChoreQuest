'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import CharacterCreation from '@/components/character/CharacterCreation';

interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  xp: number;
  gold: number;
  gems: number;
  honorPoints: number;
}

export default function CreateCharacterPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  const handleCharacterCreated = (character: Character) => {
    console.log('Character created:', character);
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

  return <CharacterCreation onCharacterCreated={handleCharacterCreated} />;
}