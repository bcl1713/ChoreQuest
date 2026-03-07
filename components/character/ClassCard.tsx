"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { CharacterClass } from "@/lib/types/database";
import { formatBonusPercentage } from "@/lib/constants/character-classes";
import { FantasyIcon } from "@/components/icons/FantasyIcon";
import {
  Sparkles,
  Sword,
  Shield,
  Heart,
  Target,
  Zap,
  Coins,
  Medal,
  Gem,
} from "lucide-react";

// Map character class icon names to Lucide icon components
const CLASS_ICON_MAP = {
  Sparkles: Sparkles,
  Sword: Sword,
  Shield: Shield,
  Heart: Heart,
  Target: Target,
};

interface ClassCardProps {
  characterClass: {
    id: CharacterClass;
    name: string;
    description: string;
    icon: string;
    bonuses: {
      xp: number;
      gold: number;
      honor: number;
      gems: number;
    };
  };
  isSelected: boolean;
  onSelect: (classId: CharacterClass) => void;
}

export function ClassCard({
  characterClass,
  isSelected,
  onSelect,
}: ClassCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      data-testid={`class-${characterClass.name.toLowerCase()}`}
      className={`fantasy-card p-4 cursor-pointer min-w-[280px] md:min-w-0 snap-center flex-shrink-0 md:flex-shrink ${
        isSelected
          ? "ring-4 ring-gold-500 bg-gold-900/40 border-gold-500/50 glow-effect-gold"
          : "hover:border-gold-500/30"
      }`}
      onClick={() => onSelect(characterClass.id)}
      whileHover={
        prefersReducedMotion
          ? {}
          : {
              scale: 1.05,
              boxShadow: "0 10px 30px rgba(251, 191, 36, 0.2)",
            }
      }
      whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <div className="text-center">
        <div className="flex justify-center mb-2">
          <FantasyIcon
            icon={
              CLASS_ICON_MAP[characterClass.icon as keyof typeof CLASS_ICON_MAP]
            }
            size="xl"
            aria-label={`${characterClass.name} class icon`}
          />
        </div>
        <h3 className="text-lg font-semibold text-gold-300 mb-2">
          {characterClass.name}
        </h3>
        <p className="text-sm text-gray-400 mb-3">
          {characterClass.description}
        </p>
        <div className="text-xs space-y-1">
          <div className="font-semibold text-gold-400 mb-2">
            Bonuses on ALL quests:
          </div>
          {characterClass.bonuses.xp > 1.0 && (
            <div className="text-primary-400 flex items-center justify-center gap-1">
              <Zap size={14} />{" "}
              {formatBonusPercentage(characterClass.bonuses.xp)} XP
            </div>
          )}
          {characterClass.bonuses.gold > 1.0 && (
            <div className="text-gold-400 flex items-center justify-center gap-1">
              <Coins size={14} />{" "}
              {formatBonusPercentage(characterClass.bonuses.gold)} Gold
            </div>
          )}
          {characterClass.bonuses.honor > 1.0 && (
            <div className="text-purple-400 flex items-center justify-center gap-1">
              <Medal size={14} />{" "}
              {formatBonusPercentage(characterClass.bonuses.honor)} Honor
            </div>
          )}
          {characterClass.bonuses.gems > 1.0 && (
            <div className="text-gem-400 flex items-center justify-center gap-1">
              <Gem size={14} />{" "}
              {formatBonusPercentage(characterClass.bonuses.gems)} Gems
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
