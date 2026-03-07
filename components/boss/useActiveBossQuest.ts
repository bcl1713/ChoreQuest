"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BossQuest } from "@/lib/boss-quest-api-service";
import type { BossParticipantDecision } from "./boss-quest-panel";

type BossQuestParticipant = {
  user_id: string | null;
  participation_status?: string | null;
  awarded_gold?: number | null;
  awarded_xp?: number | null;
  honor_awarded?: number | null;
  user_profiles?: { name?: string | null } | null;
};

export type BossQuestWithParticipants = BossQuest & {
  boss_battle_participants: BossQuestParticipant[];
  honor_reward?: number | null;
};

export function useActiveBossQuest(
  bossQuests: BossQuestWithParticipants[],
  userId?: string | null
) {
  const [now, setNow] = useState(Date.now());
  const [decisions, setDecisions] = useState<Record<string, BossParticipantDecision>>({});

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeBossQuest = useMemo(
    () => bossQuests.find((quest) => quest.status === "ACTIVE"),
    [bossQuests]
  );

  const alreadyJoined = useMemo(() => {
    if (!activeBossQuest || !userId) return false;
    return activeBossQuest.boss_battle_participants?.some((p) => p.user_id === userId);
  }, [activeBossQuest, userId]);

  const joinWindowOpen = useMemo(() => {
    if (!activeBossQuest?.join_window_expires_at) return false;
    return new Date(activeBossQuest.join_window_expires_at).getTime() > now;
  }, [activeBossQuest?.join_window_expires_at, now]);

  useEffect(() => {
    if (!activeBossQuest) {
      setDecisions({});
      return;
    }
    const next: Record<string, BossParticipantDecision> = {};
    activeBossQuest.boss_battle_participants?.forEach((participant) => {
      if (!participant.user_id) return;
      const baseGold = activeBossQuest.reward_gold ?? 0;
      const baseXp = activeBossQuest.reward_xp ?? 0;
      const baseHonor = activeBossQuest.honor_reward ?? 1;
      const status =
        (participant.participation_status as BossParticipantDecision["status"] | undefined) ?? "APPROVED";
      next[participant.user_id] = {
        status,
        gold: participant.awarded_gold ?? baseGold,
        xp: participant.awarded_xp ?? baseXp,
        honor: participant.honor_awarded ?? baseHonor,
      };
    });
    setDecisions(next);
  }, [activeBossQuest]);

  const updateDecision = useCallback(
    (userId: string, partial: Partial<BossParticipantDecision>) => {
      setDecisions((prev) => {
        const existing = prev[userId] ?? {
          status: "APPROVED" as const,
          gold: activeBossQuest?.reward_gold ?? 0,
          xp: activeBossQuest?.reward_xp ?? 0,
          honor: activeBossQuest?.honor_reward ?? 1,
        };
        return {
          ...prev,
          [userId]: { ...existing, ...partial },
        };
      });
    },
    [activeBossQuest?.honor_reward, activeBossQuest?.reward_gold, activeBossQuest?.reward_xp]
  );

  return { activeBossQuest, alreadyJoined, joinWindowOpen, decisions, updateDecision };
}
