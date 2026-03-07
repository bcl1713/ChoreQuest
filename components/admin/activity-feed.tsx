"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Wifi, RefreshCw, VolumeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import { ActivityService, ActivityEvent } from "@/lib/activity-service";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";
import {
  EVENT_CONFIG,
  EVENT_ICONS,
  formatRelativeTime,
  getEventDescription,
} from "./activity-feed-config";

const activityService = new ActivityService();

export default function ActivityFeed() {
  const { profile } = useAuth();
  const realtime = useRealtime();
  const onQuestUpdate = realtime.onQuestUpdate;
  const onRewardRedemptionUpdate = realtime.onRewardRedemptionUpdate;
  const onCharacterUpdate = realtime.onCharacterUpdate;
  const onBossQuestUpdate = useMemo(
    () =>
      typeof realtime.onBossQuestUpdate === "function"
        ? realtime.onBossQuestUpdate
        : () => () => {},
    [realtime.onBossQuestUpdate],
  );
  const onBossParticipantUpdate = useMemo(
    () =>
      typeof realtime.onBossParticipantUpdate === "function"
        ? realtime.onBossParticipantUpdate
        : () => () => {},
    [realtime.onBossParticipantUpdate],
  );
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
      const activityEvents = await activityService.getRecentActivity(
        profile.family_id,
        50,
      );
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

    const unsubscribeBoss = onBossQuestUpdate(() => {
      loadActivity();
    });

    const unsubscribeBossParticipants = onBossParticipantUpdate(() => {
      loadActivity();
    });

    return () => {
      unsubscribeQuest();
      unsubscribeRedemption();
      unsubscribeCharacter();
      unsubscribeBoss();
      unsubscribeBossParticipants();
    };
  }, [
    onQuestUpdate,
    onRewardRedemptionUpdate,
    onCharacterUpdate,
    onBossQuestUpdate,
    onBossParticipantUpdate,
    loadActivity,
  ]);

  // Manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadActivity();
  };

  if (loading) {
    return (
      <div
        className="bg-gray-800/50 border border-gray-700 rounded-lg p-6"
        data-testid="activity-feed"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">
            <Wifi size={20} /> Recent Activity
          </h3>
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
      <div
        className="bg-gray-800/50 border border-gray-700 rounded-lg p-6"
        data-testid="activity-feed"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">
            <Wifi size={20} /> Recent Activity
          </h3>
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            data-testid="activity-feed-refresh-button"
            startIcon={<RefreshCw size={16} />}
          >
            Retry
          </Button>
        </div>
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-200">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-gray-800/50 border border-gray-700 rounded-lg p-6"
      data-testid="activity-feed"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">
          <Wifi size={20} /> Recent Activity
        </h3>
        <Button
          onClick={handleRefresh}
          isLoading={refreshing}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
          data-testid="activity-feed-refresh-button"
          startIcon={<RefreshCw size={16} />}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Activity List */}
      {events.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2 flex justify-center">
            <VolumeOff size={48} className="text-gray-500" />
          </div>
          <p>No recent activity</p>
          <p className="text-sm mt-1">
            Complete quests and redeem rewards to see activity here
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          <AnimatePresence initial={false}>
            {events.map((event, index) => {
              const config = EVENT_CONFIG[event.type];
              const IconComponent = EVENT_ICONS[config.icon];

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
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.bgColor}`}
                  >
                    <IconComponent size={20} className={config.color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200">
                      <span className={`font-semibold ${config.color}`}>
                        {event.characterName}
                      </span>{" "}
                      {getEventDescription(event)}
                    </p>
                    {(event.type === "BOSS_CREATED" ||
                      event.type === "BOSS_DEFEATED") && (
                      <p className="text-xs text-gray-400">
                        {event.bossParticipants ?? 0} participants
                        {event.bossRewards
                          ? ` • ${event.bossRewards.xp} XP, ${event.bossRewards.gold} Gold, +${event.bossRewards.honor} Honor`
                          : ""}
                      </p>
                    )}
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
