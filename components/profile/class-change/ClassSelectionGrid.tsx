import { FantasyIcon } from '@/components/icons/FantasyIcon';
import {
  CHARACTER_CLASSES,
  formatBonusPercentage,
} from '@/lib/constants/character-classes';
import { CharacterClass } from '@/lib/types/database';
import { cn } from '@/lib/utils';
import { CLASS_ICON_MAP } from './utils';

interface ClassSelectionGridProps {
  selectedClass: string | null;
  currentClass: CharacterClass | null;
  cost: number;
  currentGold: number;
  isLoading: boolean;
  onSelect: (classId: string) => void;
}

export function ClassSelectionGrid({
  selectedClass,
  currentClass,
  cost,
  currentGold,
  isLoading,
  onSelect,
}: ClassSelectionGridProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gold-400 mb-4">Choose New Class</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CHARACTER_CLASSES.map((classInfo) => (
          <button
            key={classInfo.id}
            type="button"
            onClick={() => onSelect(classInfo.id)}
            disabled={
              classInfo.id === currentClass || isLoading || currentGold < cost
            }
            className={cn(
              'fantasy-card p-4 text-left transition-all relative',
              selectedClass === classInfo.id
                ? 'ring-4 ring-gold-500 bg-gold-900/40 border-gold-500/50'
                : 'hover:border-gold-500/30',
              (classInfo.id === currentClass || currentGold < cost) &&
                'opacity-50 cursor-not-allowed'
            )}
          >
            {classInfo.id === currentClass && (
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
  );
}
