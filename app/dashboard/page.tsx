'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCharacter } from '@/lib/character-context';

export default function Dashboard() {
  const router = useRouter();
  const { user, family, logout, isLoading } = useAuth();
  const { character, isLoading: characterLoading } = useCharacter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!isLoading && !characterLoading && user && character === null) {
      router.push('/character/create');
    }
  }, [user, character, isLoading, characterLoading, router]);

  if (isLoading || characterLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your realm...</p>
        </div>
      </div>
    );
  }

  if (!user || !character) {
    return null;
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'GUILD_MASTER': return '👑 Guild Master';
      case 'HERO': return '⚔️ Hero';
      case 'YOUNG_HERO': return '🛡️ Young Hero';
      default: return role;
    }
  };

  const getClassDisplay = (characterClass: string) => {
    switch (characterClass) {
      case 'KNIGHT': return '🛡️ Knight';
      case 'MAGE': return '🔮 Mage';
      case 'RANGER': return '🏹 Ranger';
      case 'ROGUE': return '🗡️ Rogue';
      case 'HEALER': return '💚 Healer';
      default: return characterClass;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Header */}
      <header className="border-b border-dark-600 bg-dark-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-fantasy text-transparent bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text font-bold">
              ChoreQuest
            </h1>
            {family && (
              <p className="text-sm text-gray-400">
                Guild: <span className="text-gold-400">{family.name}</span> ({family.code})
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-gray-300 font-medium">{character.name}</p>
              <p className="text-sm text-gray-400">{getClassDisplay(character.class)} • Level {character.level}</p>
              <p className="text-xs text-gray-500">{getRoleDisplay(user.role)}</p>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-fantasy text-gray-100 mb-4">
            Welcome back, {character.name}!
          </h2>
          <p className="text-lg text-gray-400">
            Your heroic dashboard awaits. Ready for new quests?
          </p>
        </div>

        {/* Character Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="fantasy-card p-6 text-center">
            <div className="text-3xl gold-text mb-2">💰 {character.gold}</div>
            <div className="text-sm text-gray-400">Gold</div>
          </div>
          <div className="fantasy-card p-6 text-center">
            <div className="text-3xl xp-text mb-2">⚡ {character.xp}</div>
            <div className="text-sm text-gray-400">Experience</div>
          </div>
          <div className="fantasy-card p-6 text-center">
            <div className="text-3xl gem-text mb-2">💎 {character.gems}</div>
            <div className="text-sm text-gray-400">Gems</div>
          </div>
          <div className="fantasy-card p-6 text-center">
            <div className="text-3xl text-primary-400 mb-2">🏅 {character.honorPoints}</div>
            <div className="text-sm text-gray-400">Honor Points</div>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="fantasy-card p-8 text-center">
          <h3 className="text-2xl font-fantasy text-gray-100 mb-4">🚧 Dashboard Under Construction 🚧</h3>
          <p className="text-gray-400 mb-6">
            Your heroic control center is being forged by our finest developers.
            Soon you&apos;ll be able to:
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <div className="space-y-2">
              <p className="text-gray-300">🗡️ View and complete quests</p>
              <p className="text-gray-300">👥 Manage family members</p>
              <p className="text-gray-300">🏆 Track achievements</p>
            </div>
            <div className="space-y-2">
              <p className="text-gray-300">🛒 Visit the reward store</p>
              <p className="text-gray-300">🐉 Battle epic bosses</p>
              <p className="text-gray-300">📊 View family leaderboards</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}