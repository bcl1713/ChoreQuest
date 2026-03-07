"use client";

import type { BossQuest } from "@/lib/boss-quest-api-service";
import type { BossParticipantDecision } from "./boss-quest-panel";

type BossParticipant = {
  user_id: string | null;
  participation_status?: string | null;
  awarded_gold?: number | null;
  awarded_xp?: number | null;
  honor_awarded?: number | null;
  user_profiles?: { name?: string | null } | null;
};

type BossQuestWithParticipants = BossQuest & {
  boss_battle_participants: BossParticipant[];
};

type BossQuestParticipantsProps = {
  bossQuest: BossQuestWithParticipants;
  familyMembers?: { id: string; name: string | null }[];
  decisions: Record<string, BossParticipantDecision>;
  onDecisionChange: (userId: string, partial: Partial<BossParticipantDecision>) => void;
  submitting: boolean;
};

export function BossQuestParticipants({
  bossQuest,
  familyMembers,
  decisions,
  onDecisionChange,
  submitting,
}: BossQuestParticipantsProps) {
  if (!bossQuest.boss_battle_participants?.length) return null;

  return (
    <div className="mt-4 space-y-3">
      <div className="text-sm text-gray-300 font-semibold">Approve participation</div>
      <div className="grid gap-2">
        {bossQuest.boss_battle_participants.map((participant) => {
          if (!participant.user_id) return null;
          const decision =
            decisions[participant.user_id] ?? {
              status: "APPROVED" as const,
              gold: bossQuest.reward_gold ?? 0,
              xp: bossQuest.reward_xp ?? 0,
              honor: bossQuest.honor_reward ?? 1,
            };
          const member = familyMembers?.find((m) => m.id === participant.user_id);
          const derivedName =
            member?.name && member.name.trim()
              ? member.name
              : participant.user_profiles?.name && participant.user_profiles.name.trim()
                ? participant.user_profiles.name
                : undefined;
          const name = derivedName ?? `Player ${participant.user_id.slice(0, 6)}`;

          return (
            <div key={participant.user_id} className="border border-dark-600 rounded-lg p-3 bg-dark-900/60">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-sm text-gray-100 font-semibold">{name}</div>
                  <div className="text-xs text-gray-400">Choose reward outcome for this participant.</div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <select
                    value={decision.status}
                    onChange={(e) =>
                      onDecisionChange(participant.user_id!, { status: e.target.value as BossParticipantDecision["status"] })
                    }
                    className="bg-dark-800 border border-dark-600 rounded px-2 py-1 text-sm text-gray-100"
                    disabled={submitting}
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
                          onChange={(e) => onDecisionChange(participant.user_id!, { gold: Number(e.target.value) })}
                          disabled={submitting}
                        />
                      </label>
                      <label className="flex items-center gap-1 text-xs text-gray-400">
                        XP
                        <input
                          type="number"
                          className="w-20 bg-dark-800 border border-dark-600 rounded px-2 py-1 text-sm text-gray-100"
                          value={decision.xp}
                          min={0}
                          onChange={(e) => onDecisionChange(participant.user_id!, { xp: Number(e.target.value) })}
                          disabled={submitting}
                        />
                      </label>
                      <label className="flex items-center gap-1 text-xs text-gray-400">
                        Honor
                        <input
                          type="number"
                          className="w-16 bg-dark-800 border border-dark-600 rounded px-2 py-1 text-sm text-gray-100"
                          value={decision.honor}
                          min={0}
                          onChange={(e) => onDecisionChange(participant.user_id!, { honor: Number(e.target.value) })}
                          disabled={submitting}
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
  );
}
