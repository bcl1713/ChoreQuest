'use client';

import { useState } from 'react';
import { CharacterClass } from '@/lib/generated/prisma';

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

interface CharacterCreationProps {
  onCharacterCreated: (character: Character) => void;
}

const CHARACTER_CLASSES = {
  KNIGHT: {
    name: 'Knight',
    emoji: '🛡️',
    description: 'Masters of cleaning and organizing. Bonus XP for tidying quests.',
    bonus: 'Cleaning & Organizing'
  },
  MAGE: {
    name: 'Mage',
    emoji: '🔮',
    description: 'Scholars of wisdom and learning. Bonus XP for homework and study quests.',
    bonus: 'Learning & Study'
  },
  RANGER: {
    name: 'Ranger',
    emoji: '🏹',
    description: 'Guardians of the outdoors. Bonus XP for outdoor and maintenance quests.',
    bonus: 'Outdoor & Maintenance'
  },
  ROGUE: {
    name: 'Rogue',
    emoji: '🗡️',
    description: 'Quick and efficient taskmasters. Bonus XP for fast completion quests.',
    bonus: 'Speed & Efficiency'
  },
  HEALER: {
    name: 'Healer',
    emoji: '💚',
    description: 'Champions of helping others. Bonus XP for family assistance quests.',
    bonus: 'Helping Others'
  }
};

export default function CharacterCreation({ onCharacterCreated }: CharacterCreationProps) {
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !selectedClass) {
      setError('Please enter a character name and select a class');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/character/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          characterClass: selectedClass,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create character');
      }

      onCharacterCreated(data.character);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create character');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-6">
      <div className="fantasy-card p-8 max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-fantasy text-transparent bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text font-bold mb-4">
            Create Your Hero
          </h1>
          <p className="text-lg text-gray-300">
            Choose your path and begin your legendary journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Character Name */}
          <div>
            <label htmlFor="characterName" className="block text-sm font-medium text-gray-300 mb-3">
              Hero Name
            </label>
            <input
              type="text"
              id="characterName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
              placeholder="Enter your hero's name..."
              maxLength={50}
              required
            />
          </div>

          {/* Character Class Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Choose Your Class
            </label>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(CHARACTER_CLASSES).map(([classKey, classInfo]) => (
                <div
                  key={classKey}
                  className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedClass === classKey
                      ? 'border-gold-500 bg-gold-500/10'
                      : 'border-dark-500 hover:border-dark-400 bg-dark-700'
                  }`}
                  onClick={() => setSelectedClass(classKey as CharacterClass)}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">{classInfo.emoji}</div>
                    <h3 className="text-lg font-fantasy text-white mb-2">{classInfo.name}</h3>
                    <p className="text-sm text-gray-400 mb-2">{classInfo.description}</p>
                    <div className="text-xs text-gold-400 font-medium">
                      Specialty: {classInfo.bonus}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="text-center">
            <button
              type="submit"
              disabled={isLoading || !name.trim() || !selectedClass}
              className="fantasy-button text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Forging Hero...' : 'Begin Adventure'}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>💡 Tip: Each class provides bonus XP for specific quest types!</p>
        </div>
      </div>
    </div>
  );
}