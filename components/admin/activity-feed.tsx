"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import { ActivityService, ActivityEvent } from "@/lib/activity-service";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";

const activityService = new ActivityService();

// Event type icons and colors
const EVENT_CONFIG = {
  QUEST_COMPLETED: {
    icon: "✅",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
  QUEST_SUBMITTED: {
    icon: "⏳",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
  },
  REWARD_REDEEMED: {
    icon: "🎁",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  REWARD_APPROVED: {
    icon: "✨",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
  },
  REWARD_DENIED: {
    icon: "❌",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
  },
  LEVEL_UP: {
    icon: "🎉",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
  },
  CHARACTER_CREATED: {
    icon: "🆕",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
};

// Format relative time (e.g., "5 minutes ago")
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const eventTime = new Date(timestamp);
  const diffMs = now.getTime() - eventTime.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return "just now";
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour !== 1 ? "s" : ""} ago`;
  } else if (diffDay < 7) {
    return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
  } else {
    return eventTime.toLocaleDateString();
  }
}

// Format event description
function getEventDescription(event: ActivityEvent): string {
  switch (event.type) {
    case "QUEST_COMPLETED":
      return `completed quest "${event.questTitle}"`;
    case "QUEST_SUBMITTED":
      return `submitted quest "${event.questTitle}" for approval`;
    case "REWARD_REDEEMED":
      return `redeemed reward "${event.rewardName}"`;
    case "REWARD_APPROVED":
      return `reward "${event.rewardName}" was approved`;
    case "REWARD_DENIED":
      return `reward "${event.rewardName}" was denied`;
    case "LEVEL_UP":
      return `leveled up to level ${event.newLevel}!`;
    case "CHARACTER_CREATED":
      return `joined the family`;
    default:
      return "unknown activity";
  }
}

export default function ActivityFeed() {
  const { profile } = useAuth();
  const { onQuestUpdate, onRewardRedemptionUpdate, onCharacterUpdate } = useRealtime();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load activity events
  const loadActivity = useCallback(async () => {
    if (!profile?.family_id) return;

    try {
      setLoading(true);
      setError(null);
      const activityEvents = await activityService.getRecentActivity(profile.family_id, 50);
      setEvents(activityEvents);
    } catch (err) {
      console.error("Failed to load activity:", err);
      setError("Failed to load activity feed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.family_id]);

  // Initial load
  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  // Subscribe to realtime updates and refresh activity
  useEffect(() => {
    const unsubscribeQuest = onQuestUpdate(() => {
      loadActivity();
    });

    const unsubscribeRedemption = onRewardRedemptionUpdate(() => {
      loadActivity();
    });

    const unsubscribeCharacter = onCharacterUpdate(() => {
      loadActivity();
    });

    return () => {
      unsubscribeQuest();
      unsubscribeRedemption();
      unsubscribeCharacter();
    };
  }, [onQuestUpdate, onRewardRedemptionUpdate, onCharacterUpdate, loadActivity]);

  // Manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadActivity();
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6" data-testid="activity-feed">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">📡 Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6" data-testid="activity-feed">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">📡 Recent Activity</h3>
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            data-testid="activity-feed-refresh-button"
          >
            🔄 Retry
          </Button>
        </div>
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-200">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6" data-testid="activity-feed">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">📡 Recent Activity</h3>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
          data-testid="activity-feed-refresh-button"
        >
          {refreshing ? "⟳ Refreshing..." : "🔄 Refresh"}
        </Button>
      </div>

      {/* Activity List */}
      {events.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">🔇</p>
          <p>No recent activity</p>
          <p className="text-sm mt-1">Complete quests and redeem rewards to see activity here</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          <AnimatePresence initial={false}>
            {events.map((event, index) => {
              const config = EVENT_CONFIG[event.type];

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${config.bgColor} ${config.borderColor} hover:bg-opacity-20 transition-colors`}
                >
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${config.bgColor}`}
                  >
                    {config.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200">
                      <span className={`font-semibold ${config.color}`}>
                        {event.characterName}
                      </span>
                      {" "}
                      {getEventDescription(event)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatRelativeTime(event.timestamp)}
                    </p>
                  </div>

                  {/* Quick Action for Pending Approvals */}
                  {event.type === "QUEST_SUBMITTED" && event.questId && (
                    <div className="flex-shrink-0">
                      <Button
                        onClick={() => {
                          // Navigate to quest approval
                          window.location.href = `/dashboard?highlight=${event.questId}`;
                        }}
                        variant="gold"
                        size="sm"
                        className="text-xs px-3 py-1 rounded bg-orange-500 hover:bg-orange-600"
                      >
                        Review
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Event Count */}
      {events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            Showing {events.length} recent event{events.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
