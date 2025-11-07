'use client';

import { useAuth } from '@/lib/auth-context';
import { useCharacter } from '@/lib/character-context';
import { LoadingSpinner, Button, IconWithLabel } from '@/components/ui';
import ProfileSettings from '@/components/profile/ProfileSettings';
import ProfileErrorBoundary from '@/components/profile/ProfileErrorBoundary';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Crown, Swords, Shield, Sparkles, Target, Sword, Heart, Clock } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, family, logout, isLoading: authLoading } = useAuth();
  const { character, isLoading: characterLoading, error: characterError, refreshCharacter } = useCharacter();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || characterLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" aria-label="Loading your profile" />
          <p className="text-gray-400">Loading your profile...</p>
        </div>
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

  if (!user || !character) {
    return null;
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'GUILD_MASTER': return { icon: Crown, label: 'Guild Master' };
      case 'HERO': return { icon: Swords, label: 'Hero' };
      case 'YOUNG_HERO': return { icon: Shield, label: 'Young Hero' };
      default: return { icon: Shield, label: role };
    }
  };

  const getClassDisplay = (characterClass: string) => {
    switch (characterClass) {
      case 'KNIGHT': return { icon: Shield, label: 'Knight' };
      case 'MAGE': return { icon: Sparkles, label: 'Mage' };
      case 'RANGER': return { icon: Target, label: 'Ranger' };
      case 'ROGUE': return { icon: Sword, label: 'Rogue' };
      case 'HEALER': return { icon: Heart, label: 'Healer' };
      default: return { icon: Shield, label: characterClass };
    }
  };

  return (
    <ProfileErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
        {/* Header - Same as Dashboard */}
        <header className="border-b border-dark-600 bg-dark-800/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            {/* Mobile-first header layout */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-fantasy text-transparent bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text font-bold">
                  ChoreQuest
                </h1>
                {family && (
                  <p className="text-sm text-gray-400">
                    Guild: <span className="text-gold-400">{family.name}</span> ({family.code})
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Clock size={14} />
                  {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
                </p>
              </div>

              {/* Character info - responsive layout */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="text-left sm:text-right">
                  <p className="text-gray-300 font-medium">{character.name}</p>
                  {character.class ? (
                    <p className="text-sm text-gray-400 flex sm:justify-end items-center gap-1">
                      <IconWithLabel
                        icon={getClassDisplay(character.class).icon}
                        label={getClassDisplay(character.class).label}
                        size={16}
                      />
                      • Level {character.level}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">Unknown Class • Level {character.level}</p>
                  )}
                  {profile?.role && (
                    <p className="text-xs text-gray-500 flex sm:justify-end items-center gap-1">
                      <IconWithLabel
                        icon={getRoleDisplay(profile.role).icon}
                        label={getRoleDisplay(profile.role).label}
                        size={14}
                      />
                    </p>
                  )}
                </div>

                {/* Action buttons - mobile-optimized */}
                <div className="flex gap-2 sm:gap-3">
                  <Button
                    onClick={() => router.push('/dashboard')}
                    variant="primary"
                    size="sm"
                    className="touch-target"
                    data-testid="back-to-dashboard-button"
                  >
                    <span className="hidden sm:inline">Back to Dashboard</span>
                    <span className="sm:hidden">Dashboard</span>
                  </Button>
                  <Button
                    onClick={logout}
                    variant="destructive"
                    size="sm"
                    className="touch-target"
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl font-fantasy text-gray-100 mb-4">
              Profile Settings
            </h2>
            <p className="text-base sm:text-lg text-gray-400">
              Manage your character and account settings
            </p>
          </div>

          {/* Profile Settings Component */}
          <div className="max-w-4xl mx-auto">
            <ProfileSettings character={character} onRefreshNeeded={refreshCharacter} />
          </div>
        </main>
      </div>
    </ProfileErrorBoundary>
  );
}
