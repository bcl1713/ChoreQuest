'use client';

import { useState } from 'react';
import { Character } from '@/lib/types/database';
import { ProfileService } from '@/lib/profile-service';
import { FantasyButton } from '@/components/ui';
import { AlertCircle } from 'lucide-react';

interface CharacterNameFormProps {
  character: Character;
  onSuccess: (message: string) => void;
}

export default function CharacterNameForm({
  character,
  onSuccess,
}: CharacterNameFormProps) {
  const [name, setName] = useState(character.name);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(character.name.length);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    setCharCount(newName.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Character name cannot be empty');
      return;
    }

    if (name === character.name) {
      setError('Please enter a different name');
      return;
    }

    setIsLoading(true);

    try {
      await ProfileService.changeCharacterName(character.id, name);
      onSuccess('Character name updated successfully!');
      // Note: In a real app, you'd refresh the character context here
      // For now, just show success message
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update character name';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Name Display */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Current Name
          </label>
          <div className="px-4 py-3 bg-dark-700/50 border border-gold-700/20 rounded-lg text-gold-300 font-semibold">
            {character.name}
          </div>
        </div>

        {/* Name Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="newName"
              className="block text-sm font-medium text-gray-300"
            >
              New Name
            </label>
            <span className="text-xs text-gray-400">
              {charCount}/50 characters
            </span>
          </div>
          <input
            type="text"
            id="newName"
            value={name}
            onChange={handleNameChange}
            maxLength={50}
            className="fantasy-input w-full px-4 py-3 bg-dark-800/50 border border-gold-700/30 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-white placeholder-gray-400"
            placeholder="Enter new character name..."
          />
          <p className="text-xs text-gray-400 mt-2">
            Character names must be between 1 and 50 characters.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex gap-3 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <FantasyButton
          type="submit"
          disabled={isLoading || !name.trim() || name === character.name}
          isLoading={isLoading}
          className="w-full justify-center"
        >
          {isLoading ? 'Updating Name...' : 'Update Character Name'}
        </FantasyButton>
      </form>
    </div>
  );
}
