'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Castle, Swords, Zap, Trophy, Coins, Gem, Award } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Header */}
      <header className="p-6 text-center border-b border-dark-600">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-fantasy text-transparent bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text font-bold">
          ChoreQuest
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-300 mt-2 font-game">
          Transform Chores into Epic Adventures
        </p>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-fantasy text-gray-100 mb-6">
            Welcome to Your Family&apos;s Quest Board
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Join the legendary guild where household tasks become heroic quests, 
            family members become mighty heroes, and every chore completed brings 
            honor to your family name.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {user ? (
              <Link href="/dashboard" className="fantasy-button text-lg px-8 py-3 inline-flex items-center gap-2" data-testid="enter-realm-button">
                <Castle size={20} aria-hidden="true" /> Enter Your Realm
              </Link>
            ) : (
              <>
                <Link href="/auth/create-family" className="fantasy-button text-lg px-8 py-3 inline-flex items-center gap-2" data-testid="create-family-button">
                  <Castle size={20} aria-hidden="true" /> Create Family Guild
                </Link>
                <Link href="/auth/register" className="bg-gradient-to-r from-gem-600 to-gem-700 hover:from-gem-700 hover:to-gem-800 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 inline-flex items-center gap-2" data-testid="join-guild-button">
                  <Swords size={20} aria-hidden="true" /> Join Existing Guild
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="fantasy-card p-6 text-center">
            <div className="mb-4 flex justify-center">
              <Swords size={32} aria-hidden="true" className="text-gold-400" />
            </div>
            <h3 className="text-xl font-fantasy text-gray-100 mb-3">Epic Quests</h3>
            <p className="text-gray-400">
              Transform daily chores into heroic adventures. Earn XP and gold for every task completed.
            </p>
          </div>
          <div className="fantasy-card p-6 text-center">
            <div className="mb-4 flex justify-center">
              <Zap size={32} aria-hidden="true" className="text-primary-400" />
            </div>
            <h3 className="text-xl font-fantasy text-gray-100 mb-3">Character Classes</h3>
            <p className="text-gray-400">
              Choose your path: Knight, Mage, Ranger, Rogue, or Healer. Each class offers unique bonuses.
            </p>
          </div>
          <div className="fantasy-card p-6 text-center">
            <div className="mb-4 flex justify-center">
              <Trophy size={32} aria-hidden="true" className="text-gold-400" />
            </div>
            <h3 className="text-xl font-fantasy text-gray-100 mb-3">Boss Battles</h3>
            <p className="text-gray-400">
              Unite your family against epic boss challenges. Teamwork brings the greatest rewards.
            </p>
          </div>
        </div>

        {/* Stats Display */}
        <div className="fantasy-card p-8 mb-16">
          <h3 className="text-2xl font-fantasy text-gray-100 mb-6 text-center">
            Heroes&apos; Treasury
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Coins size={24} aria-hidden="true" className="text-gold-400" />
                <span className="text-3xl gold-text">1,250</span>
              </div>
              <div className="text-sm text-gray-400">Gold Earned</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap size={24} aria-hidden="true" className="text-xp-500" />
                <span className="text-3xl xp-text">3,450</span>
              </div>
              <div className="text-sm text-gray-400">Experience Points</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gem size={24} aria-hidden="true" className="text-gem-400" />
                <span className="text-3xl gem-text">45</span>
              </div>
              <div className="text-sm text-gray-400">Gems Collected</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award size={24} aria-hidden="true" className="text-primary-400" />
                <span className="text-3xl text-primary-400">128</span>
              </div>
              <div className="text-sm text-gray-400">Honor Points</div>
            </div>
          </div>
        </div>

        {/* Development Status */}
        <div className="fantasy-card p-6 text-center">
          <h3 className="text-xl font-fantasy text-gray-100 mb-3">Under Construction</h3>
          <p className="text-gray-400 mb-4">
            The great ChoreQuest is being forged by skilled developers. Current progress:
          </p>
          <div className="max-w-md mx-auto">
            <div className="bg-dark-700 rounded-full h-4 mb-2">
              <div className="bg-gradient-to-r from-xp-500 to-xp-600 h-4 rounded-full" style={{width: '15%'}}></div>
            </div>
            <p className="text-sm text-gray-500">Foundation Complete • Phase 1 MVP: In Development</p>
          </div>
        </div>
      </main>

      {!user && (
        <div className="text-center px-6 pb-10">
          <p className="text-sm text-gray-400">
            <Link href="/auth/login" className="text-primary-400 hover:text-primary-300" data-testid="login-link">
              Already have an account? Login here
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
