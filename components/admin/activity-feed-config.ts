"use client";

import {
  CheckCircle,
  Clock,
  Gift,
  Sparkles,
  XCircle,
  PartyPopper,
  Plus,
  Swords,
  Shield,
} from "lucide-react";
import type { ActivityEvent } from "@/lib/activity-service";

export const EVENT_ICONS = {
  CheckCircle,
  Clock,
  Gift,
  Sparkles,
  XCircle,
  PartyPopper,
  Plus,
  Swords,
  Shield,
};

export const EVENT_CONFIG: Record<
  string,
  {
    icon: keyof typeof EVENT_ICONS;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  QUEST_COMPLETED: {
    icon: "CheckCircle",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
  QUEST_SUBMITTED: {
    icon: "Clock",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
  },
  REWARD_REDEEMED: {
    icon: "Gift",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  REWARD_APPROVED: {
    icon: "Sparkles",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
  },
  REWARD_DENIED: {
    icon: "XCircle",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
  },
  LEVEL_UP: {
    icon: "PartyPopper",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
  },
  CHARACTER_CREATED: {
    icon: "Plus",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  BOSS_CREATED: {
    icon: "Swords",
    color: "text-indigo-300",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/30",
  },
  BOSS_DEFEATED: {
    icon: "Shield",
    color: "text-emerald-300",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
  },
};

export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const eventTime = new Date(timestamp);
  const diffMs = now.getTime() - eventTime.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? "s" : ""} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
  return eventTime.toLocaleDateString();
}

export function getEventDescription(event: ActivityEvent): string {
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
    case "BOSS_CREATED":
      return `rallied boss quest "${event.bossTitle}"`;
    case "BOSS_DEFEATED":
      return `defeated boss quest "${event.bossTitle}"`;
    default:
      return "unknown activity";
  }
}
