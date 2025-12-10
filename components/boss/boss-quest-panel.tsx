"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { bossQuestApiService, type BossQuest } from "@/lib/boss-quest-api-service";
import { useAuth } from "@/lib/auth-context";
import { Button, LoadingSpinner } from "@/components/ui";
import { Clock, Swords, Trophy, Users, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBossQuests } from "@/hooks/useBossQuests";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { supabase } from "@/lib/supabase";

type BossQuestWithParticipants = BossQuest & {
  boss_battle_participants: {
    user_id: string | null;
    participation_status?: string | null;
    awarded_gold?: number | null;
    awarded_xp?: number | null;
    honor_awarded?: number | null;
  }[];
};

type BossQuestForm = {
  name: string;
  description: string;
  reward_gold: number;
  reward_xp: number;
  join_window_minutes: number;
};

const defaultForm: BossQuestForm = {
  name: "",
  description: "",
  reward_gold: 50,
  reward_xp: 100,
  join_window_minutes: 60,
};

const formatCountdown = (expiresAt?: string) => {
  if (!expiresAt) return "Join window closed";
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (remainingMs <= 0) return "Join window closed";

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s left`;
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
  const [now, setNow] = useState(Date.now());
  const [decisions, setDecisions] = useState<Record<string, {
    status: "APPROVED" | "PARTIAL" | "DENIED";
    gold: number;
    xp: number;
    honor: number;
  }>>({});

  const isGuildMaster = profile?.role === "GUILD_MASTER";

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeBossQuest = useMemo(
    () => bossQuests.find((quest) => quest.status === "ACTIVE"),
    [bossQuests]
  );

  const alreadyJoined = useMemo(() => {
    if (!activeBossQuest || !user?.id) return false;
    return activeBossQuest.boss_battle_participants?.some((p) => p.user_id === user.id);
  }, [activeBossQuest, user?.id]);

  const joinWindowOpen = useMemo(() => {
    if (!activeBossQuest?.join_window_expires_at) return false;
    return new Date(activeBossQuest.join_window_expires_at).getTime() > now;
  }, [activeBossQuest?.join_window_expires_at, now]);

  useEffect(() => {
    if (!activeBossQuest) {
      setDecisions({});
      return;
    }
    const next: Record<string, { status: "APPROVED" | "PARTIAL" | "DENIED"; gold: number; xp: number; honor: number }> = {};
    activeBossQuest.boss_battle_participants?.forEach((p) => {
      if (!p.user_id) return;
      const baseGold = activeBossQuest.reward_gold ?? 0;
      const baseXp = activeBossQuest.reward_xp ?? 0;
      const baseHonor = activeBossQuest.honor_reward ?? 1;
      const status = (p.participation_status as "APPROVED" | "PARTIAL" | "DENIED" | undefined) ?? "APPROVED";
      next[p.user_id] = {
        status,
        gold: p.awarded_gold ?? baseGold,
        xp: p.awarded_xp ?? baseXp,
        honor: p.honor_awarded ?? baseHonor,
      };
    });
    setDecisions(next);
  }, [activeBossQuest]);

  const updateDecision = useCallback((userId: string, partial: Partial<{ status: "APPROVED" | "PARTIAL" | "DENIED"; gold: number; xp: number; honor: number }>) => {
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
  }, [activeBossQuest?.honor_reward, activeBossQuest?.reward_gold, activeBossQuest?.reward_xp]);

  const handleCreate = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    setStatusMessage(null);
    try {
      const payload = { ...form, join_window_minutes: form.join_window_minutes || 60 };
      await bossQuestApiService.createBossQuest(payload);
      setForm(defaultForm);
      setStatusMessage("Boss quest created. Rally your family before the join window closes!");
      setError(null);
      setShowCreateModal(false);
      await reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create boss quest";
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
      const message = err instanceof Error ? err.message : "Failed to join boss quest";
      setError(message);
      setStatusMessage(null);
    } finally {
      setSubmitting(false);
    }
  }, [activeBossQuest, decisions, reload]);

  const handleComplete = useCallback(async () => {
    if (!activeBossQuest) return;
    setSubmitting(true);
    setError(null);
    setStatusMessage(null);
    try {
      const decisionPayload = Object.entries(decisions).map(([userId, decision]) => ({
        userId,
        status: decision.status,
        gold: decision.gold,
        xp: decision.xp,
        honor: decision.honor,
      }));
      await bossQuestApiService.completeBossQuestWithDecisions(activeBossQuest.id, decisionPayload);
      setStatusMessage("Boss defeated! Rewards are being distributed.");
      setError(null);
      await reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to complete boss quest";
      setError(message);
      setStatusMessage(null);
    } finally {
      setSubmitting(false);
    }
  }, [activeBossQuest, decisions, reload]);

  const handleCancelBoss = useCallback(async () => {
    if (!activeBossQuest) return;
    if (!window.confirm("Cancel this boss quest? Participants will see it closed.")) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from("boss_battles")
        .update({ status: "EXPIRED" })
        .eq("id", activeBossQuest.id)
        .eq("family_id", profile?.family_id);
      if (updateError) throw new Error(updateError.message);
      setStatusMessage("Boss quest canceled.");
      await reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to cancel boss quest";
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
        activeBossQuest.join_window_minutes || 60
      );
      setStatusMessage("Join window reopened.");
      await reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reopen join window";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [activeBossQuest, reload]);
  if (!user || !profile) return null;

  return (
    <div className="fantasy-card p-4 sm:p-5 space-y-4 relative">
      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl bg-dark-900 border border-dark-600 rounded-xl p-5 shadow-2xl space-y-4 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
              onClick={() => setShowCreateModal(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <Swords className="text-gold-400" size={22} />
              <div>
                <h4 className="text-lg font-semibold text-gray-100">Create Boss Quest</h4>
                <p className="text-sm text-gray-400">Use default rewards (50 gold / 100 XP) or customize.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm text-gray-400">Title</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-md border border-dark-600 bg-dark-900 px-3 py-2 text-gray-100 focus:border-gold-500 focus:outline-none"
                  placeholder="E.g., Shadow Dragon"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-400">Join window (minutes)</label>
                <input
                  type="number"
                  min={5}
                  max={1440}
                  value={form.join_window_minutes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      join_window_minutes: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-md border border-dark-600 bg-dark-900 px-3 py-2 text-gray-100 focus:border-gold-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm text-gray-400">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-md border border-dark-600 bg-dark-900 px-3 py-2 text-gray-100 focus:border-gold-500 focus:outline-none"
                  rows={2}
                  placeholder="Describe the boss and objectives"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-400">Gold reward (per participant)</label>
                <input
                  type="number"
                  min={0}
                  value={form.reward_gold}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, reward_gold: Number(e.target.value) }))
                  }
                  className="w-full rounded-md border border-dark-600 bg-dark-900 px-3 py-2 text-gray-100 focus:border-gold-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-400">XP reward (per participant)</label>
                <input
                  type="number"
                  min={0}
                  value={form.reward_xp}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, reward_xp: Number(e.target.value) }))
                  }
                  className="w-full rounded-md border border-dark-600 bg-dark-900 px-3 py-2 text-gray-100 focus:border-gold-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setForm(defaultForm)}
              >
                Reset defaults
              </Button>
              <Button
                onClick={() => void handleCreate()}
                disabled={submitting || !form.name || !form.description}
                variant="gold"
              >
                Launch Boss Quest
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Swords className="text-gold-400" size={24} />
        <div>
          <h3 className="text-xl font-fantasy text-gray-100">Boss Quest</h3>
          <p className="text-sm text-gray-400">Rally the family, beat the boss, and claim honor.</p>
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
            <div className="rounded-lg border border-dark-600 bg-dark-800/60 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-gray-100">{activeBossQuest.name}</h4>
                  <p className="text-sm text-gray-400">{activeBossQuest.description}</p>
                </div>
                <div className={cn(
                  "flex items-center gap-2 text-sm px-2 py-1 rounded-md border",
                  joinWindowOpen ? "border-gold-500/60 text-gold-300" : "border-gray-600 text-gray-400"
                )}>
                  <Clock size={16} />
                  <span>{formatCountdown(activeBossQuest.join_window_expires_at)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Trophy size={16} className="text-gold-400" />
                  <span>{activeBossQuest.reward_xp} XP</span>
                  <span className="text-gray-500">•</span>
                  <span>{activeBossQuest.reward_gold} Gold</span>
                  <span className="text-gray-500">•</span>
                  <span>+1 Honor</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-emerald-400" />
                  <span>{activeBossQuest.boss_battle_participants?.length || 0} joined</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {!alreadyJoined && joinWindowOpen && (
                  <Button
                    onClick={handleJoin}
                    disabled={submitting}
                    variant="gold"
                    className="w-full sm:w-auto"
                  >
                    Join Boss Quest
                  </Button>
                )}
                {alreadyJoined && (
                  <div className="text-sm text-emerald-300">You are enlisted for this boss quest.</div>
                )}
                {!joinWindowOpen && (
                  <div className="text-sm text-amber-300">Join window closed.</div>
                )}
                {isGuildMaster && (
                  <Button
                    onClick={handleComplete}
                    disabled={submitting}
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    Declare Boss Defeated
                  </Button>
                )}
              </div>
              {isGuildMaster && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancelBoss}
                    disabled={submitting}
                  >
                    Cancel Boss
                  </Button>
                  {!joinWindowOpen && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReopenJoinWindow}
                      disabled={submitting}
                    >
                      Reopen Join Window
                    </Button>
                  )}
                </div>
              )}

                {isGuildMaster && activeBossQuest.boss_battle_participants?.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="text-sm text-gray-300 font-semibold">Approve participation</div>
                  <div className="grid gap-2">
                    {activeBossQuest.boss_battle_participants.map((p) => {
                      if (!p.user_id) return null;
                      const decision = decisions[p.user_id] ?? {
                        status: "APPROVED" as const,
                        gold: activeBossQuest.reward_gold ?? 0,
                        xp: activeBossQuest.reward_xp ?? 0,
                        honor: activeBossQuest.honor_reward ?? 1,
                      };
                      const member = familyMembers?.find((m) => m.id === p.user_id);
                      const derivedName =
                        member?.name && member.name.trim()
                          ? member.name
                          : (p as any).user_profiles?.name && (p as any).user_profiles?.name.trim()
                            ? (p as any).user_profiles?.name
                            : undefined;
                      const name = derivedName ?? `Player ${p.user_id.slice(0, 6)}`;
                      return (
                        <div key={p.user_id} className="border border-dark-600 rounded-lg p-3 bg-dark-900/60">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <div className="text-sm text-gray-100 font-semibold">{name}</div>
                              <div className="text-xs text-gray-400">Choose reward outcome for this participant.</div>
                            </div>
                            <div className="flex flex-wrap gap-2 items-center">
                              <select
                                value={decision.status}
                                onChange={(e) => updateDecision(p.user_id!, { status: e.target.value as "APPROVED" | "PARTIAL" | "DENIED" })}
                                className="bg-dark-800 border border-dark-600 rounded px-2 py-1 text-sm text-gray-100"
                              >
                                <option value="APPROVED">Approve (full rewards)</option>
                                <option value="PARTIAL">Partial credit</option>
                                <option value="DENIED">Deny</option>
                              </select>
                              {decision.status === "PARTIAL" && (
                                <div className="flex flex-wrap gap-2">
                                  <label className="flex items-center gap-1 text-xs text-gray-400">
                                    Gold
                                    <input
                                      type="number"
                                      className="w-20 bg-dark-800 border border-dark-600 rounded px-2 py-1 text-sm text-gray-100"
                                      value={decision.gold}
                                      min={0}
                                      onChange={(e) => updateDecision(p.user_id!, { gold: Number(e.target.value) })}
                                    />
                                  </label>
                                  <label className="flex items-center gap-1 text-xs text-gray-400">
                                    XP
                                    <input
                                      type="number"
                                      className="w-20 bg-dark-800 border border-dark-600 rounded px-2 py-1 text-sm text-gray-100"
                                      value={decision.xp}
                                      min={0}
                                      onChange={(e) => updateDecision(p.user_id!, { xp: Number(e.target.value) })}
                                    />
                                  </label>
                                  <label className="flex items-center gap-1 text-xs text-gray-400">
                                    Honor
                                    <input
                                      type="number"
                                      className="w-16 bg-dark-800 border border-dark-600 rounded px-2 py-1 text-sm text-gray-100"
                                      value={decision.honor}
                                      min={0}
                                      onChange={(e) => updateDecision(p.user_id!, { honor: Number(e.target.value) })}
                                    />
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
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
