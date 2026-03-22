"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Coins, Zap } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { FantasyIcon } from "@/components/icons/FantasyIcon";
import { ProgressBar } from "@/components/animations/ProgressBar";
import { getAchievementIcon } from "./achievement-icon-map";
import { getAchievementState } from "./AchievementBadge";
import type { AchievementDisplay } from "@/hooks/useAchievements";

interface AchievementDetailModalProps {
  achievement: AchievementDisplay | null;
  onClose: () => void;
}

export function AchievementDetailModal({
  achievement,
  onClose,
}: AchievementDetailModalProps) {
  const prefersReducedMotion = useReducedMotion();

  if (!achievement) return null;

  const state = getAchievementState(achievement);
  const isUnlocked = state === "unlocked";
  const isHidden = state === "hidden";
  const hasProgress = state === "locked-progress" && achievement.progress;
  const IconComponent = isHidden
    ? getAchievementIcon("lock")
    : getAchievementIcon(achievement.icon);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
        data-testid="achievement-detail-overlay"
      >
        <motion.div
          initial={{ scale: prefersReducedMotion ? 1 : 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: prefersReducedMotion ? 1 : 0.95 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          className={`max-w-md w-full p-6 rounded-lg border shadow-xl ${
            isUnlocked
              ? "bg-gradient-to-br from-gold-900 to-gold-950 border-gold-700"
              : "bg-gradient-to-br from-dark-800 to-dark-900 border-dark-600"
          }`}
          onClick={(e) => e.stopPropagation()}
          data-testid="achievement-detail-modal"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isUnlocked ? "bg-gold-500/20" : "bg-dark-700"
                }`}
              >
                <FantasyIcon
                  icon={IconComponent}
                  type={isUnlocked ? "gold" : "default"}
                  size="lg"
                  glow={isUnlocked}
                />
              </div>
              <h3
                className={`font-fantasy text-lg ${
                  isUnlocked ? "text-gold-300" : "text-gray-100"
                }`}
              >
                {isHidden ? "???" : achievement.name}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close achievement details"
              className="text-gray-400 hover:text-gray-200 transition-colors"
              data-testid="achievement-detail-close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-300 mb-4">
            {isHidden
              ? "This achievement is hidden. Keep playing to discover it!"
              : achievement.description}
          </p>

          {/* Progress bar (for in-progress achievements) */}
          {hasProgress && achievement.progress && (
            <div className="mb-4">
              <ProgressBar
                current={achievement.progress.current}
                max={achievement.progress.threshold}
                showValues
                showPercentage
                variant="default"
                label="Progress"
              />
            </div>
          )}

          {/* Rewards (hidden for hidden-locked achievements) */}
          {!isHidden && (
            <div className="flex gap-4 mb-4">
              {achievement.xp_reward != null && (
                <div className="flex items-center gap-1.5 text-sm">
                  <FantasyIcon icon={Zap} type="xp" size="sm" />
                  <span className="text-xp-400 font-semibold">
                    +{achievement.xp_reward} XP
                  </span>
                </div>
              )}
              {achievement.gold_reward != null && (
                <div className="flex items-center gap-1.5 text-sm">
                  <FantasyIcon icon={Coins} type="gold" size="sm" />
                  <span className="text-gold-400 font-semibold">
                    +{achievement.gold_reward} Gold
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Unlock date */}
          {isUnlocked && achievement.unlocked_at && (
            <p
              className="text-xs text-gray-400"
              data-testid="achievement-unlock-date"
            >
              Unlocked on{" "}
              {new Date(achievement.unlocked_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
