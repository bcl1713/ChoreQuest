"use client";

import { FantasyCard } from "@/components/ui/FantasyCard";
import { FantasyIcon } from "@/components/icons/FantasyIcon";
import { ProgressBar } from "@/components/animations/ProgressBar";
import { Lock, Users } from "lucide-react";
import { getAchievementIcon } from "./achievement-icon-map";
import { cn } from "@/lib/utils";
import type { FamilyAchievementDisplay } from "@/hooks/useFamilyAchievements";
import type {
  FantasyCardVariant,
  FantasyCardGlow,
} from "@/components/ui/FantasyCard";

export type FamilyAchievementBadgeState =
  | "unlocked"
  | "locked-progress"
  | "locked";

export function getFamilyAchievementState(
  achievement: FamilyAchievementDisplay,
): FamilyAchievementBadgeState {
  if (achievement.unlocked_at) return "unlocked";
  if (achievement.progress && achievement.progress.current > 0) {
    return "locked-progress";
  }
  return "locked";
}

interface FamilyAchievementBadgeProps {
  achievement: FamilyAchievementDisplay;
  onClick?: (achievement: FamilyAchievementDisplay) => void;
}

export function FamilyAchievementBadge({
  achievement,
  onClick,
}: FamilyAchievementBadgeProps) {
  const state = getFamilyAchievementState(achievement);

  const variantMap: Record<FamilyAchievementBadgeState, FantasyCardVariant> = {
    unlocked: "gold",
    "locked-progress": "default",
    locked: "default",
  };

  const glowMap: Record<FamilyAchievementBadgeState, FantasyCardGlow> = {
    unlocked: "strong",
    "locked-progress": "none",
    locked: "none",
  };

  const isUnlocked = state === "unlocked";
  const isDimmed = state === "locked";
  const isHidden = achievement.is_hidden && !achievement.unlocked_at;

  const IconComponent = isHidden ? Lock : getAchievementIcon(achievement.icon);

  return (
    <FantasyCard
      variant={variantMap[state]}
      glow={glowMap[state]}
      hoverable
      onClick={() => onClick?.(achievement)}
      className={cn("p-4", isDimmed && "opacity-50")}
      data-testid={`family-achievement-badge-${achievement.id}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
            isUnlocked ? "bg-gold-500/20" : "bg-dark-700",
          )}
        >
          <FantasyIcon
            icon={IconComponent}
            type={isUnlocked ? "gold" : "default"}
            size="md"
            glow={isUnlocked}
            aria-label={
              isHidden ? "Hidden family achievement" : achievement.name
            }
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3
              className={cn(
                "font-fantasy text-sm leading-tight truncate",
                isUnlocked ? "text-gold-300" : "text-gray-200",
              )}
            >
              {isHidden ? "???" : achievement.name}
            </h3>
            <Users
              className="h-3.5 w-3.5 flex-shrink-0 text-purple-400"
              aria-label="Family achievement"
            />
          </div>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
            {isHidden
              ? "This achievement is hidden. Keep playing to discover it!"
              : achievement.description}
          </p>
        </div>
      </div>

      {state === "locked-progress" && achievement.progress && (
        <div className="mt-3">
          <ProgressBar
            current={achievement.progress.current}
            max={achievement.progress.threshold}
            showValues
            showPercentage={false}
            variant="default"
            className="text-xs"
          />
        </div>
      )}
    </FantasyCard>
  );
}
