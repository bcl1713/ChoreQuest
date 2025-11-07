'use client';

import { useState } from 'react';
import { Character } from '@/lib/types/database';
import CharacterNameForm from './CharacterNameForm';
import ClassChangeForm from './ClassChangeForm';
import PasswordChangeForm from './PasswordChangeForm';
import ChangeHistoryList from './ChangeHistoryList';
import { User, Wand2, Lock, History, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileSettingsProps {
  character: Character;
}

type TabType = 'name' | 'class' | 'password' | 'history';

interface Tab {
  id: TabType;
  label: string;
  icon: LucideIcon;
}

export default function ProfileSettings({ character }: ProfileSettingsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('name');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const tabs: Tab[] = [
    { id: 'name', label: 'Character Name', icon: User },
    { id: 'class', label: 'Character Class', icon: Wand2 },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'history', label: 'Change History', icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-fantasy text-transparent bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text font-bold mb-2">
          Profile Settings
        </h1>
        <p className="text-gray-300">Manage your character&apos;s profile and preferences</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-900/50 border border-green-500/50 rounded-lg p-4 text-green-300 animate-pulse">
          {successMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="fantasy-card p-0 overflow-hidden">
        <div className="flex flex-wrap border-b border-gold-700/30 bg-dark-800/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 min-w-0 flex items-center justify-center gap-2 px-4 py-4 text-sm sm:text-base font-medium transition-colors border-b-2 -mb-[2px]',
                  activeTab === tab.id
                    ? 'text-gold-400 border-gold-500 bg-dark-700/50'
                    : 'text-gray-400 border-transparent hover:text-gold-300'
                )}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'name' && (
            <CharacterNameForm character={character} onSuccess={handleSuccess} />
          )}
          {activeTab === 'class' && (
            <ClassChangeForm character={character} onSuccess={handleSuccess} />
          )}
          {activeTab === 'password' && (
            <PasswordChangeForm onSuccess={handleSuccess} />
          )}
          {activeTab === 'history' && (
            <ChangeHistoryList character={character} />
          )}
        </div>
      </div>
    </div>
  );
}
