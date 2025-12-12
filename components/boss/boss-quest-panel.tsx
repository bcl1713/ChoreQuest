"use client";

import { useCallback, useState } from "react";
import { bossQuestApiService } from "@/lib/boss-quest-api-service";
import { useAuth } from "@/lib/auth-context";
import { Button, LoadingSpinner } from "@/components/ui";
import { Swords, RefreshCw } from "lucide-react";
import { useBossQuests } from "@/hooks/useBossQuests";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { supabase } from "@/lib/supabase";
import { BossQuestCreateModal } from "./boss-quest-create-modal";
import { BossQuestActiveCard } from "./boss-quest-active-card";
import {
  useActiveBossQuest,
  type BossQuestWithParticipants,
} from "./useActiveBossQuest";

export type BossQuestForm = {
  name: string;
  description: string;
  reward_gold: number;
  reward_xp: number;
  join_window_minutes: number;
};

export type BossParticipantDecision = {
  status: "APPROVED" | "PARTIAL" | "DENIED";
  gold: number;
  xp: number;
  honor: number;
};

const defaultForm: BossQuestForm = {
  name: "",
  description: "",
  reward_gold: 50,
  reward_xp: 100,
  join_window_minutes: 60,
};

export function BossQuestPanel() {
  const { user, profile } = useAuth();
  const { bossQuests, loading, error: bossError, reload } = useBossQuests();
  const { familyMembers } = useFamilyMembers();
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<BossQuestForm>(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const isGuildMaster = profile?.role === "GUILD_MASTER";
  const {
    activeBossQuest,
    alreadyJoined,
    joinWindowOpen,
    decisions,
    updateDecision,
  } = useActiveBossQuest(bossQuests as BossQuestWithParticipants[], user?.id);

  const handleCreate = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    setStatusMessage(null);
    try {
      const payload = {
        ...form,
        join_window_minutes: form.join_window_minutes || 60,
      };
      await bossQuestApiService.createBossQuest(payload);
      setForm(defaultForm);
      setStatusMessage(
        "Boss quest created. Rally your family before the join window closes!",
      );
      setError(null);
      setShowCreateModal(false);
      await reload();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create boss quest";
      setError(message);
      setStatusMessage(null);
    } finally {
      setSubmitting(false);
    }
  }, [form, reload]);

  const handleJoin = useCallback(async () => {
    if (!activeBossQuest) return;
    setSubmitting(true);
    setError(null);
    setStatusMessage(null);
    try {
      await bossQuestApiService.joinBossQuest(activeBossQuest.id);
      setStatusMessage("You joined the boss quest!");
      setError(null);
      await reload();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to join boss quest";
      setError(message);
      setStatusMessage(null);
    } finally {
      setSubmitting(false);
    }
  }, [activeBossQuest, reload]);

  const handleComplete = useCallback(async () => {
    if (!activeBossQuest) return;
    setSubmitting(true);
    setError(null);
    setStatusMessage(null);
    try {
      const decisionPayload = Object.entries(decisions).map(
        ([userId, decision]) => ({
          userId,
          status: decision.status,
          gold: decision.gold,
          xp: decision.xp,
          honor: decision.honor,
        }),
      );
      await bossQuestApiService.completeBossQuestWithDecisions(
        activeBossQuest.id,
        decisionPayload,
      );
      setStatusMessage("Boss defeated! Rewards are being distributed.");
      setError(null);
      await reload();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to complete boss quest";
      setError(message);
      setStatusMessage(null);
    } finally {
      setSubmitting(false);
    }
  }, [activeBossQuest, decisions, reload]);

  const handleCancelBoss = useCallback(async () => {
    if (!activeBossQuest) return;
    if (!profile?.family_id) return;
    if (
      !window.confirm(
        "Cancel this boss quest? Participants will see it closed.",
      )
    )
      return;
    setSubmitting(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from("boss_battles")
        .update({ status: "EXPIRED" })
        .eq("id", activeBossQuest.id)
        .eq("family_id", profile.family_id);
      if (updateError) throw new Error(updateError.message);
      setStatusMessage("Boss quest canceled.");
      await reload();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to cancel boss quest";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [activeBossQuest, profile?.family_id, reload]);

  const handleReopenJoinWindow = useCallback(async () => {
    if (!activeBossQuest) return;
    setSubmitting(true);
    setError(null);
    try {
      await bossQuestApiService.reopenJoinWindow(
        activeBossQuest.id,
        activeBossQuest.join_window_minutes || 60,
      );
      setStatusMessage("Join window reopened.");
      await reload();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reopen join window";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [activeBossQuest, reload]);
  if (!user || !profile) return null;

  return (
    <div className="fantasy-card p-4 sm:p-5 space-y-4 relative">
      {/* Create modal */}
      <BossQuestCreateModal
        isOpen={showCreateModal}
        form={form}
        submitting={submitting}
        onClose={() => setShowCreateModal(false)}
        onChange={(next) => setForm((prev) => ({ ...prev, ...next }))}
        onSubmit={() => void handleCreate()}
        onReset={() => setForm(defaultForm)}
      />

      <div className="flex items-center gap-3">
        <Swords className="text-gold-400" size={24} />
        <div>
          <h3 className="text-xl font-fantasy text-gray-100">Boss Quest</h3>
          <p className="text-sm text-gray-400">
            Rally the family, beat the boss, and claim honor.
          </p>
        </div>
        {isGuildMaster && (
          <div className="ml-auto flex gap-2">
            <Button
              variant="gold"
              size="sm"
              onClick={() => setShowCreateModal(true)}
            >
              New Boss Quest
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void reload()}
              startIcon={<RefreshCw size={16} />}
            >
              Refresh
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-300">
          <LoadingSpinner size="sm" />
          <span>Loading boss quests…</span>
        </div>
      ) : (
        <>
          {(bossError || error) && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {bossError || error}
            </div>
          )}
          {statusMessage && (
            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
              {statusMessage}
            </div>
          )}

          {activeBossQuest ? (
            <BossQuestActiveCard
              bossQuest={activeBossQuest}
              alreadyJoined={alreadyJoined}
              joinWindowOpen={joinWindowOpen}
              isGuildMaster={isGuildMaster}
              decisions={decisions}
              familyMembers={familyMembers}
              submitting={submitting}
              onJoin={handleJoin}
              onComplete={handleComplete}
              onCancelBoss={handleCancelBoss}
              onReopenJoinWindow={handleReopenJoinWindow}
              onDecisionChange={updateDecision}
            />
          ) : (
            <div className="rounded-lg border border-dark-600 bg-dark-800/40 p-4 text-sm text-gray-400">
              No active boss quest. Rally the family with a new challenge!
            </div>
          )}
        </>
      )}
    </div>
  );
}
