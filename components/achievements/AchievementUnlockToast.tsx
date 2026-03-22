"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Star } from "lucide-react";
import type { AchievementNotification } from "@/hooks/useAchievementNotifications";

type AchievementUnlockToastProps = {
  notification: AchievementNotification | null;
  onDismiss: () => void;
};

const AUTO_DISMISS_MS = 5000;

export function AchievementUnlockToast({
  notification,
  onDismiss,
}: AchievementUnlockToastProps) {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, y: -60, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="fixed top-6 right-6 z-50 w-80 bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 text-white rounded-xl shadow-2xl border border-yellow-300 overflow-hidden"
          role="alert"
          aria-live="assertive"
        >
          {/* Celebratory shimmer bar */}
          <div className="h-1 bg-gradient-to-r from-white/0 via-white/60 to-white/0 animate-pulse" />

          <div className="p-4 flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
              {notification.icon ?? <Star className="h-6 w-6" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-yellow-100 mb-0.5">
                Achievement Unlocked!
              </p>
              <p className="font-bold text-base leading-tight truncate">
                {notification.name}
              </p>
              <p className="text-sm text-yellow-50 mt-0.5 line-clamp-2">
                {notification.description}
              </p>

              {/* Rewards */}
              {(notification.xpReward || notification.goldReward) && (
                <div className="flex gap-3 mt-2">
                  {notification.xpReward != null && (
                    <span className="text-xs font-semibold bg-white/20 rounded px-2 py-0.5">
                      +{notification.xpReward} XP
                    </span>
                  )}
                  {notification.goldReward != null && (
                    <span className="text-xs font-semibold bg-white/20 rounded px-2 py-0.5">
                      +{notification.goldReward} Gold
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Dismiss button */}
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss achievement notification"
              className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
