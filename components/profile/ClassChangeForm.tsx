'use client';

import { useState, useEffect } from 'react';
import { Character, CharacterClass } from '@/lib/types/database';
import { ProfileService } from '@/lib/profile-service';
import { FantasyButton } from '@/components/ui';
import {
  CHARACTER_CLASSES,
  formatBonusPercentage,
  getCharacterClassInfo,
} from '@/lib/constants/character-classes';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { FantasyIcon } from '@/components/icons/FantasyIcon';
import {
  Sparkles,
  Sword,
  Shield,
  Heart,
  Target,
  Coins,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClassChangeFormProps {
  character: Character;
  onSuccess: (message: string) => void;
}

const CLASS_ICON_MAP = {
  Sparkles: Sparkles,
  Sword: Sword,
  Shield: Shield,
  Heart: Heart,
  Target: Target,
};

export default function ClassChangeForm({
  character,
  onSuccess,
}: ClassChangeFormProps) {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canChange, setCanChange] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const cost = character.level ? ProfileService.getClassChangeCost(character.level) : 0;
  const currentClassInfo = character.class
    ? getCharacterClassInfo(character.class)
    : null;
  const selectedClassInfo = selectedClass
    ? getCharacterClassInfo(selectedClass as CharacterClass)
    : null;

  // Check if class change is possible
  useEffect(() => {
    const checkCanChange = async () => {
      try {
        const canChangeClass = await ProfileService.canChangeClass(character.id);
        setCanChange(canChangeClass);

        if (!canChangeClass) {
          const remaining = await ProfileService.getClassChangeCooldownRemaining(
            character.id
          );
          setCooldownRemaining(remaining);
        } else {
          setCooldownRemaining(null);
        }
      } catch (err) {
        console.error('Failed to check class change availability:', err);
      }
    };

    checkCanChange();
    const interval = setInterval(checkCanChange, 1000);
    return () => clearInterval(interval);
  }, [character.id]);

  const handleClassSelect = (classId: string) => {
    setError(null);
    setSelectedClass(classId);
  };

  const handleConfirmChange = async () => {
    if (!selectedClass) return;

    setShowConfirmation(false);
    setError(null);
    setIsLoading(true);

    try {
      // Check gold
      const currentGold = character.gold ?? 0;
      if (currentGold < cost) {
        setError(
          `Insufficient gold. You need ${cost} gold but only have ${currentGold}.`
        );
        setIsLoading(false);
        return;
      }

      // Check cooldown again
      const canChangeClass = await ProfileService.canChangeClass(character.id);
      if (!canChangeClass) {
        setError(
          'You are still on cooldown. Please wait before changing classes again.'
        );
        setIsLoading(false);
        return;
      }

      await ProfileService.changeCharacterClass(character.id, selectedClass);
      onSuccess(`Successfully changed class to ${selectedClassInfo?.name}!`);
      setSelectedClass(null);

      // Refresh cooldown status
      const newCanChange = await ProfileService.canChangeClass(character.id);
      setCanChange(newCanChange);
      if (!newCanChange) {
        const remaining = await ProfileService.getClassChangeCooldownRemaining(
          character.id
        );
        setCooldownRemaining(remaining);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to change class';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCooldown = (ms: number): string => {
    const totalSeconds = Math.ceil(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="space-y-8">
      {/* Current Class Info */}
      <div>
        <h3 className="text-lg font-semibold text-gold-400 mb-4">Current Class</h3>
        <div className="fantasy-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {currentClassInfo && (
                <FantasyIcon
                  icon={
                    CLASS_ICON_MAP[
                      currentClassInfo.icon as keyof typeof CLASS_ICON_MAP
                    ]
                  }
                  size="xl"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xl font-semibold text-gold-300 mb-2">
                {currentClassInfo?.name}
              </h4>
              <p className="text-gray-400 mb-3">{currentClassInfo?.description}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {currentClassInfo && currentClassInfo.bonuses.xp > 1.0 && (
                  <div className="text-primary-400">
                    +{formatBonusPercentage(currentClassInfo.bonuses.xp)} XP
                  </div>
                )}
                {currentClassInfo && currentClassInfo.bonuses.gold > 1.0 && (
                  <div className="text-gold-400">
                    +{formatBonusPercentage(currentClassInfo.bonuses.gold)} Gold
                  </div>
                )}
                {currentClassInfo && currentClassInfo.bonuses.honor > 1.0 && (
                  <div className="text-purple-400">
                    +{formatBonusPercentage(currentClassInfo.bonuses.honor)} Honor
                  </div>
                )}
                {currentClassInfo && currentClassInfo.bonuses.gems > 1.0 && (
                  <div className="text-gem-400">
                    +{formatBonusPercentage(currentClassInfo.bonuses.gems)} Gems
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cooldown Warning */}
      {!canChange && cooldownRemaining !== null && (
        <div className="flex gap-3 p-4 bg-amber-900/30 border border-amber-500/30 rounded-lg">
          <Clock size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 font-semibold mb-1">On Cooldown</p>
            <p className="text-amber-300/80 text-sm">
              You can change your class again in {formatCooldown(cooldownRemaining)}
            </p>
          </div>
        </div>
      )}

      {/* Cost Info */}
      <div className="p-4 bg-dark-800/50 border border-gold-700/20 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-gray-300 flex items-center gap-2">
            <Coins size={18} className="text-gold-400" />
            Class Change Cost:
          </span>
          <span className="text-2xl font-bold text-gold-400">{cost} Gold</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Current balance: {character.gold ?? 0} gold
          {(character.gold ?? 0) < cost && (
            <span className="text-red-400 ml-2">
              (Need {cost - (character.gold ?? 0)} more gold)
            </span>
          )}
        </p>
      </div>

      {/* Class Selection Grid */}
      {canChange ? (
        <div>
          <h3 className="text-lg font-semibold text-gold-400 mb-4">
            Choose New Class
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CHARACTER_CLASSES.map((classInfo) => (
              <button
                key={classInfo.id}
                type="button"
                onClick={() => handleClassSelect(classInfo.id)}
                disabled={
                  classInfo.id === character.class || isLoading || (character.gold ?? 0) < cost
                }
                className={cn(
                  'fantasy-card p-4 text-left transition-all relative',
                  selectedClass === classInfo.id
                    ? 'ring-4 ring-gold-500 bg-gold-900/40 border-gold-500/50'
                    : 'hover:border-gold-500/30',
                  (classInfo.id === character.class || (character.gold ?? 0) < cost) &&
                    'opacity-50 cursor-not-allowed'
                )}
              >
                {classInfo.id === character.class && (
                  <div className="absolute top-2 right-2 bg-gold-500 text-dark-900 px-2 py-1 rounded text-xs font-bold">
                    Current
                  </div>
                )}
                <div className="flex justify-center mb-2">
                  <FantasyIcon
                    icon={CLASS_ICON_MAP[classInfo.icon as keyof typeof CLASS_ICON_MAP]}
                    size="lg"
                  />
                </div>
                <h4 className="text-center font-semibold text-gold-300 mb-2">
                  {classInfo.name}
                </h4>
                <p className="text-xs text-gray-400 text-center mb-3">
                  {classInfo.description}
                </p>
                <div className="text-xs space-y-1 border-t border-gold-700/20 pt-3">
                  {classInfo.bonuses.xp > 1.0 && (
                    <div className="text-primary-400">
                      +{formatBonusPercentage(classInfo.bonuses.xp)} XP
                    </div>
                  )}
                  {classInfo.bonuses.gold > 1.0 && (
                    <div className="text-gold-400">
                      +{formatBonusPercentage(classInfo.bonuses.gold)} Gold
                    </div>
                  )}
                  {classInfo.bonuses.honor > 1.0 && (
                    <div className="text-purple-400">
                      +{formatBonusPercentage(classInfo.bonuses.honor)} Honor
                    </div>
                  )}
                  {classInfo.bonuses.gems > 1.0 && (
                    <div className="text-gem-400">
                      +{formatBonusPercentage(classInfo.bonuses.gems)} Gems
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-dark-800/50 border border-gold-700/20 rounded-lg text-center text-gray-300">
          Class changes are currently unavailable due to cooldown. Please try again later.
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex gap-3 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      {canChange && selectedClass && selectedClass !== character.class && (
        <FantasyButton
          onClick={() => setShowConfirmation(true)}
          disabled={isLoading || (character.gold ?? 0) < cost}
          isLoading={isLoading}
          className="w-full justify-center"
        >
          {isLoading ? 'Changing Class...' : 'Confirm Class Change'}
        </FantasyButton>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        title="Confirm Class Change"
        message={`Change your class from ${currentClassInfo?.name} to ${selectedClassInfo?.name} for ${cost} gold?`}
        confirmText="Change Class"
        cancelText="Cancel"
        onConfirm={handleConfirmChange}
        onCancel={() => setShowConfirmation(false)}
        isLoading={isLoading}
        isDangerous={true}
      />
    </div>
  );
}
