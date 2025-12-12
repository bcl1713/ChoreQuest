import { FantasyIcon } from '@/components/icons/FantasyIcon';
import {
  formatBonusPercentage,
  getCharacterClassInfo,
} from '@/lib/constants/character-classes';
import { CLASS_ICON_MAP } from './utils';

interface CurrentClassCardProps {
  classInfo: ReturnType<typeof getCharacterClassInfo> | null;
}

export function CurrentClassCard({ classInfo }: CurrentClassCardProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gold-400 mb-4">Current Class</h3>
      <div className="fantasy-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {classInfo && (
              <FantasyIcon
                icon={CLASS_ICON_MAP[classInfo.icon as keyof typeof CLASS_ICON_MAP]}
                size="xl"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xl font-semibold text-gold-300 mb-2">
              {classInfo?.name}
            </h4>
            <p className="text-gray-400 mb-3">{classInfo?.description}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {classInfo && classInfo.bonuses.xp > 1.0 && (
                <div className="text-primary-400">
                  +{formatBonusPercentage(classInfo.bonuses.xp)} XP
                </div>
              )}
              {classInfo && classInfo.bonuses.gold > 1.0 && (
                <div className="text-gold-400">
                  +{formatBonusPercentage(classInfo.bonuses.gold)} Gold
                </div>
              )}
              {classInfo && classInfo.bonuses.honor > 1.0 && (
                <div className="text-purple-400">
                  +{formatBonusPercentage(classInfo.bonuses.honor)} Honor
                </div>
              )}
              {classInfo && classInfo.bonuses.gems > 1.0 && (
                <div className="text-gem-400">
                  +{formatBonusPercentage(classInfo.bonuses.gems)} Gems
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
