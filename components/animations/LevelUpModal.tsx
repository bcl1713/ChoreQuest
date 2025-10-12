'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ParticleEffect } from './ParticleEffect';
import { FantasyButton } from '@/components/ui/FantasyButton';
import { Sparkles, ArrowRight } from 'lucide-react';
import { modalBackdrop, celebrationBurst } from '@/lib/animations/variants';
import { useEffect, useRef } from 'react';

export interface LevelUpModalProps {
  /** Whether the modal is visible */
  show: boolean;
  /** Old level (before level up) */
  oldLevel: number;
  /** New level (after level up) */
  newLevel: number;
  /** Character name */
  characterName?: string;
  /** Character class (e.g., Knight, Wizard, etc.) */
  characterClass?: string;
  /** Callback when modal is dismissed */
  onDismiss: () => void;
}

/**
 * LevelUpModal component - displays a celebration modal when character levels up.
 * Shows burst animation, level change (old → new), and character information.
 * Supports multi-level ups (e.g., Level 5 → Level 8).
 */
export function LevelUpModal({
  show,
  oldLevel,
  newLevel,
  characterName,
  characterClass,
  onDismiss,
}: LevelUpModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const dismissButtonRef = useRef<HTMLButtonElement>(null);

  // Calculate how many levels gained
  const levelsGained = newLevel - oldLevel;

  // Focus dismiss button when modal opens (for keyboard navigation)
  useEffect(() => {
    if (show && dismissButtonRef.current) {
      // Small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        dismissButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [show]);

  // Handle keyboard events (Escape to close)
  useEffect(() => {
    if (!show) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, onDismiss]);

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md"
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onDismiss}
            aria-hidden="true"
          />

          {/* Particle effects */}
          <ParticleEffect
            active={show}
            count={50}
            colors={[
              '#fbbf24',
              '#f59e0b',
              '#f97316',
              '#fb923c',
              '#a78bfa',
              '#8b5cf6',
            ]}
            duration={3000}
          />

          {/* Modal content */}
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="level-up-title"
          >
            <motion.div
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border-2 border-gold-500 bg-gradient-to-br from-dark-800 via-dark-900 to-dark-950 p-10 shadow-2xl"
              variants={prefersReducedMotion ? modalBackdrop : celebrationBurst}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {/* Glow effect background */}
              <div className="absolute inset-0 bg-gradient-radial from-gold-500/20 via-transparent to-transparent" />

              {/* Content */}
              <div className="relative z-10">
                {/* Sparkle icon */}
                <div className="mb-6 flex justify-center">
                  <motion.div
                    className="rounded-full bg-gradient-to-br from-gold-400 to-amber-600 p-6"
                    animate={
                      prefersReducedMotion
                        ? {}
                        : {
                            scale: [1, 1.1, 1],
                            rotate: [0, 10, -10, 0],
                          }
                    }
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <Sparkles className="h-20 w-20 text-white" />
                  </motion.div>
                </div>

                {/* Level Up Title */}
                <h2
                  id="level-up-title"
                  className="mb-2 text-center text-5xl font-bold text-gold-300"
                >
                  LEVEL UP!
                </h2>

                {/* Character info */}
                {(characterName || characterClass) && (
                  <p className="mb-6 text-center text-lg text-gray-300">
                    {characterName && <span className="font-semibold">{characterName}</span>}
                    {characterName && characterClass && <span> the </span>}
                    {characterClass && <span>{characterClass}</span>}
                  </p>
                )}

                {/* Level transition */}
                <div className="mb-8 flex items-center justify-center gap-6">
                  <motion.div
                    className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-gray-600 bg-gradient-to-br from-gray-700 to-gray-800"
                    initial={{ opacity: 1, scale: 1 }}
                    animate={
                      prefersReducedMotion
                        ? {}
                        : {
                            opacity: 0.5,
                            scale: 0.9,
                          }
                    }
                    transition={{ duration: 0.5 }}
                  >
                    <span className="text-3xl font-bold text-gray-400">{oldLevel}</span>
                  </motion.div>

                  <ArrowRight className="h-10 w-10 text-gold-400" />

                  <motion.div
                    className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-gold-500 bg-gradient-to-br from-gold-400 to-amber-600 shadow-lg shadow-gold-500/50"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : {
                            duration: 0.5,
                            delay: 0.3,
                            type: 'spring',
                            stiffness: 200,
                            damping: 15,
                          }
                    }
                  >
                    <span className="text-4xl font-bold text-white">{newLevel}</span>
                  </motion.div>
                </div>

                {/* Multiple levels message */}
                {levelsGained > 1 && (
                  <p className="mb-6 text-center text-xl font-semibold text-gold-300">
                    You gained {levelsGained} levels!
                  </p>
                )}

                {/* Congratulations message */}
                <p className="mb-8 text-center text-lg text-gray-300">
                  Congratulations! You&apos;ve grown stronger on your quest!
                </p>

                {/* Dismiss button */}
                <FantasyButton
                  ref={dismissButtonRef}
                  variant="primary"
                  size="lg"
                  onClick={onDismiss}
                  className="w-full"
                >
                  Continue Your Journey
                </FantasyButton>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
