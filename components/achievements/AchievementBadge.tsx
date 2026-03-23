"use client";

import { FantasyCard } from "@/components/ui/FantasyCard";
import { FantasyIcon } from "@/components/icons/FantasyIcon";
import { ProgressBar } from "@/components/animations/ProgressBar";
import { Lock } from "lucide-react";
import { getAchievementIcon } from "./achievement-icon-map";
import type {
  AchievementDisplay,
  AchievementProgressValue,
  StandardProgress,
} from "@/hooks/useAchievements";
import { cn } from "@/lib/utils";
import type {
  FantasyCardVariant,
  FantasyCardGlow,
} from "@/components/ui/FantasyCard";

export type AchievementBadgeState =
  | "unlocked"
  | "locked-progress"
  | "locked"
  | "hidden";

function isStandardProgress(
  p: AchievementProgressValue,
): p is StandardProgress {
  return "current" in p;
}

export function progressCurrent(p: AchievementProgressValue): number {
  if (isStandardProgress(p)) return p.current;
  return p.conditions.filter((c) => c.met).length;
}

export function progressMax(p: AchievementProgressValue): number {
  if (isStandardProgress(p)) return p.threshold;
  return p.conditions.length;
}

export function getAchievementState(
  achievement: AchievementDisplay,
): AchievementBadgeState {
  // Hidden achievement that's unlocked displays as normal unlocked
  if (achievement.unlocked_at) return "unlocked";
  if (achievement.is_hidden) return "hidden";
  if (achievement.progress && progressCurrent(achievement.progress) > 0) {
    return "locked-progress";
  }
  return "locked";
}

interface AchievementBadgeProps {
  achievement: AchievementDisplay;
  onClick?: (achievement: AchievementDisplay) => void;
}

export function AchievementBadge({
  achievement,
  onClick,
}: AchievementBadgeProps) {
  const state = getAchievementState(achievement);

  const variantMap: Record<AchievementBadgeState, FantasyCardVariant> = {
    unlocked: "gold",
    "locked-progress": "default",
    locked: "default",
    hidden: "default",
  };

  const glowMap: Record<AchievementBadgeState, FantasyCardGlow> = {
    unlocked: "strong",
    "locked-progress": "none",
    locked: "none",
    hidden: "none",
  };

  const isUnlocked = state === "unlocked";
  const isHidden = state === "hidden";
  const isDimmed = state === "locked";

  const IconComponent = isHidden ? Lock : getAchievementIcon(achievement.icon);

  return (
    <FantasyCard
      variant={variantMap[state]}
      glow={glowMap[state]}
      hoverable
      onClick={() => onClick?.(achievement)}
      className={cn("p-4", isDimmed && "opacity-50")}
      data-testid={`achievement-badge-${achievement.id}`}
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
            aria-label={isHidden ? "Hidden achievement" : achievement.name}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "font-fantasy text-sm leading-tight truncate",
              isUnlocked ? "text-gold-300" : "text-gray-200",
            )}
          >
            {isHidden ? "???" : achievement.name}
          </h3>
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
            current={progressCurrent(achievement.progress)}
            max={progressMax(achievement.progress)}
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
