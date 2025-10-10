'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ANIMATION_DURATION, PARTICLE_LIMITS } from '@/lib/animations/constants';

export interface ParticleEffectProps {
  /** Number of particles to render */
  count?: number;
  /** Colors for particles (randomly selected for each particle) */
  colors?: string[];
  /** Duration of particle animation in milliseconds */
  duration?: number;
  /** Whether the effect is currently active */
  active?: boolean;
  /** Optional className for the container */
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  delay: number;
}

/**
 * ParticleEffect component - renders animated particles that float up and fade out.
 * Used for celebration effects like quest completions and level ups.
 */
export function ParticleEffect({
  count = PARTICLE_LIMITS.DEFAULT,
  colors = ['#fbbf24', '#f59e0b', '#f97316', '#fb923c', '#fdba74'],
  duration = ANIMATION_DURATION.CELEBRATION,
  active = true,
  className = '',
}: ParticleEffectProps) {
  const prefersReducedMotion = useReducedMotion();

  // Don't render anything if reduced motion is preferred or not active
  if (prefersReducedMotion || !active) {
    return null;
  }

  // Limit particle count for performance
  const particleCount = Math.min(count, PARTICLE_LIMITS.MAX_DESKTOP);

  // Generate random particles
  const particles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    x: Math.random() * 100, // Random horizontal position (0-100%)
    y: 0, // Start at bottom
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360, // Random initial rotation
    scale: 0.5 + Math.random() * 0.5, // Random scale (0.5-1.0)
    delay: Math.random() * 0.3, // Random delay (0-300ms)
  }));

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute bottom-0"
          style={{
            left: `${particle.x}%`,
            width: '12px',
            height: '12px',
          }}
          initial={{
            y: 0,
            opacity: 0,
            scale: particle.scale,
            rotate: particle.rotation,
          }}
          animate={{
            y: -window.innerHeight - 100, // Float up past the top
            opacity: [0, 1, 1, 0], // Fade in, stay visible, fade out
            rotate: particle.rotation + 360, // Full rotation
          }}
          transition={{
            duration: duration / 1000,
            delay: particle.delay,
            ease: 'easeOut',
            opacity: {
              times: [0, 0.1, 0.7, 1], // Quick fade in, long visible, fade out
            },
          }}
        >
          {/* Particle visual - simple circle with glow */}
          <div
            className="h-full w-full rounded-full"
            style={{
              backgroundColor: particle.color,
              boxShadow: `0 0 8px ${particle.color}, 0 0 16px ${particle.color}`,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}
