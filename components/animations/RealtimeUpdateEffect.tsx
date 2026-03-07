"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface RealtimeUpdateEffectProps {
  /** Type of effect to display */
  type?: "glow" | "flash" | "pulse";
  /** Color of the effect */
  color?: string;
  /** Duration of the effect in milliseconds */
  duration?: number;
  /** Whether the effect is currently active */
  active?: boolean;
  /** Optional className for the container */
  className?: string;
}

/**
 * RealtimeUpdateEffect component - provides subtle visual feedback for realtime updates.
 *
 * Uses subtle glow, flash, or pulse effects to indicate when data has been updated
 * through realtime subscriptions. Effects are brief (500-800ms) and non-intrusive.
 *
 * - Glow: Soft, expanding glow effect (good for quest updates)
 * - Flash: Quick brightness change (good for stat updates)
 * - Pulse: Subtle size/opacity pulse (good for role changes)
 *
 * @example
 * const [showEffect, setShowEffect] = useState(false);
 *
 * useEffect(() => {
 *   const unsubscribe = onQuestUpdate((event) => {
 *     setShowEffect(true);
 *     setTimeout(() => setShowEffect(false), 600);
 *   });
 *   return unsubscribe;
 * }, []);
 *
 * return (
 *   <div className="relative">
 *     <RealtimeUpdateEffect active={showEffect} type="glow" />
 *     <QuestCard />
 *   </div>
 * );
 */
export function RealtimeUpdateEffect({
  type = "glow",
  color = "#fbbf24", // Gold color
  duration = 600,
  active = true,
  className = "",
}: RealtimeUpdateEffectProps) {
  const prefersReducedMotion = useReducedMotion();

  // Don't render anything if reduced motion is preferred or not active
  if (prefersReducedMotion || !active) {
    return null;
  }

  const durationInSeconds = duration / 1000;

  if (type === "glow") {
    return (
      <motion.div
        className={`pointer-events-none absolute inset-0 rounded-lg ${className}`}
        initial={{
          boxShadow: `0 0 0px ${color}`,
          opacity: 1,
        }}
        animate={{
          boxShadow: [
            `0 0 0px ${color}`,
            `0 0 12px ${color}`,
            `0 0 20px ${color}`,
            `0 0 0px ${color}`,
          ],
          opacity: [1, 1, 1, 0],
        }}
        transition={{
          duration: durationInSeconds,
          ease: "easeOut",
          times: [0, 0.3, 0.7, 1],
        }}
      />
    );
  }

  if (type === "flash") {
    return (
      <motion.div
        className={`pointer-events-none absolute inset-0 rounded-lg ${className}`}
        style={{
          backgroundColor: color,
        }}
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: [0.4, 0.1, 0],
        }}
        transition={{
          duration: durationInSeconds,
          ease: "easeOut",
          times: [0, 0.4, 1],
        }}
      />
    );
  }

  // type === 'pulse'
  return (
    <motion.div
      className={`pointer-events-none absolute inset-0 rounded-lg border-2 ${className}`}
      style={{
        borderColor: color,
      }}
      initial={{
        scale: 1,
        opacity: 0,
      }}
      animate={{
        scale: [1, 1.05, 1],
        opacity: [0.8, 0.4, 0],
      }}
      transition={{
        duration: durationInSeconds,
        ease: "easeOut",
        times: [0, 0.5, 1],
      }}
    />
  );
}
