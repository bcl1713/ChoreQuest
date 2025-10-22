'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ParticleEffect } from './ParticleEffect';
import { FantasyButton, Button } from '@/components/ui';
import { Trophy, Coins, Star, Gem, Sparkles, X } from 'lucide-react';
import { modalBackdrop, modalContent } from '@/lib/animations/variants';

export interface QuestReward {
  /** Gold coins earned */
  gold?: number;
  /** XP earned */
  xp?: number;
  /** Gems earned */
  gems?: number;
  /** Custom reward label */
  customReward?: string;
}

export interface QuestCompleteOverlayProps {
  /** Whether the overlay is visible */
  show: boolean;
  /** Quest title */
  questTitle?: string;
  /** Rewards earned from quest */
  rewards: QuestReward;
  /** Streak bonus percentage */
  streakBonus?: number;
  /** Volunteer bonus percentage */
  volunteerBonus?: number;
  /** Callback when overlay is dismissed */
  onDismiss: () => void;
  /** Auto-dismiss duration in milliseconds (default: 5000ms) */
  autoDismissDuration?: number;
}

/**
 * QuestCompleteOverlay component - displays a celebration overlay when a quest is completed.
 * Shows rewards with particle effects and auto-dismisses after a set duration.
 */
export function QuestCompleteOverlay({
  show,
  questTitle = 'Quest Complete!',
  rewards,
  streakBonus,
  volunteerBonus,
  onDismiss,
  autoDismissDuration = 5000,
}: QuestCompleteOverlayProps) {
  const prefersReducedMotion = useReducedMotion();

  // Auto-dismiss timer
  useEffect(() => {
    if (show && autoDismissDuration > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoDismissDuration);

      return () => clearTimeout(timer);
    }
  }, [show, autoDismissDuration, onDismiss]);

  const handleDismiss = () => {
    onDismiss();
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleDismiss}
            aria-hidden="true"
          />

          {/* Particle effects */}
          <ParticleEffect
            active={show}
            count={30}
            colors={['#fbbf24', '#f59e0b', '#f97316', '#fb923c', '#fdba74']}
            duration={2000}
          />

          {/* Content card */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              className="relative w-full max-w-md rounded-lg border border-gold-700 bg-gradient-to-br from-dark-800 to-dark-900 p-8 shadow-2xl pointer-events-auto"
              variants={prefersReducedMotion ? modalBackdrop : modalContent}
              initial="hidden"
              animate="visible"
              exit="hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="quest-complete-title"
            >
              {/* Close button */}
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="icon-sm"
                className="absolute right-4 top-4 rounded-full text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Trophy icon */}
              <div className="mb-6 flex justify-center">
                <motion.div
                  className="rounded-full bg-gold-500/20 p-6"
                  animate={
                    prefersReducedMotion
                      ? {}
                      : {
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0],
                        }
                  }
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 0.5,
                  }}
                >
                  <Trophy className="h-16 w-16 text-gold-400" />
                </motion.div>
              </div>

              {/* Title */}
              <h2 id="quest-complete-title" className="mb-2 text-center text-3xl font-bold text-gold-300">
                {questTitle}
              </h2>

              {/* Rewards section */}
              <div className="mt-6 space-y-3">
                <p className="text-center text-lg font-semibold text-gray-300">
                  Rewards Earned:
                </p>

                <div className="space-y-2">
                  {rewards.gold !== undefined && rewards.gold > 0 && (
                    <div className="flex items-center justify-center gap-3 rounded-md bg-gold-950/50 p-3">
                      <Coins className="h-6 w-6 text-gold-400" />
                      <span className="text-xl font-bold text-gold-300">
                        {rewards.gold.toLocaleString()} Gold
                      </span>
                    </div>
                  )}

                  {rewards.xp !== undefined && rewards.xp > 0 && (
                    <div className="flex items-center justify-center gap-3 rounded-md bg-xp-950/50 p-3">
                      <Sparkles className="h-6 w-6 text-xp-400" />
                      <span className="text-xl font-bold text-xp-300">
                        {rewards.xp.toLocaleString()} XP
                      </span>
                    </div>
                  )}

                  {rewards.gems !== undefined && rewards.gems > 0 && (
                    <div className="flex items-center justify-center gap-3 rounded-md bg-gem-950/50 p-3">
                      <Gem className="h-6 w-6 text-gem-400" />
                      <span className="text-xl font-bold text-gem-300">
                        {rewards.gems.toLocaleString()} Gems
                      </span>
                    </div>
                  )}

                  {rewards.customReward && (
                    <div className="flex items-center justify-center gap-3 rounded-md bg-primary-950/50 p-3">
                      <Star className="h-6 w-6 text-primary-400" />
                      <span className="text-lg font-semibold text-primary-300">
                        {rewards.customReward}
                      </span>
                    </div>
                  )}

                  {(streakBonus !== undefined && streakBonus > 0) && (
                    <div className="flex items-center justify-center gap-3 rounded-md bg-orange-950/50 p-3">
                      <Sparkles className="h-6 w-6 text-orange-400" />
                      <span className="text-lg font-semibold text-orange-300">
                        +{(streakBonus * 100).toFixed(0)}% Streak Bonus
                      </span>
                    </div>
                  )}

                  {(volunteerBonus !== undefined && volunteerBonus > 0) && (
                    <div className="flex items-center justify-center gap-3 rounded-md bg-green-950/50 p-3">
                      <Sparkles className="h-6 w-6 text-green-400" />
                      <span className="text-lg font-semibold text-green-300">
                        +{(volunteerBonus * 100).toFixed(0)}% Volunteer Bonus
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dismiss button */}
              <div className="mt-8">
                <FantasyButton
                  variant="primary"
                  size="lg"
                  onClick={handleDismiss}
                  className="w-full"
                >
                  Continue Adventure
                </FantasyButton>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
