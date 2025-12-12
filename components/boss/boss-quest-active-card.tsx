"use client";

import { Button } from "@/components/ui";
import { Clock, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { BossQuestParticipants } from "./boss-quest-participants";
import { formatCountdown } from "./boss-quest-utils";
import type { BossParticipantDecision } from "./boss-quest-panel";
import type { BossQuest } from "@/lib/boss-quest-api-service";

type BossQuestParticipant = {
  user_id: string | null;
  participation_status?: string | null;
  awarded_gold?: number | null;
  awarded_xp?: number | null;
  honor_awarded?: number | null;
  user_profiles?: { name?: string | null } | null;
};

type BossQuestWithParticipants = BossQuest & {
  boss_battle_participants: BossQuestParticipant[];
  honor_reward?: number | null;
};

type BossQuestActiveCardProps = {
  bossQuest: BossQuestWithParticipants;
  alreadyJoined: boolean;
  joinWindowOpen: boolean;
  isGuildMaster: boolean;
  decisions: Record<string, BossParticipantDecision>;
  familyMembers?: { id: string; name: string | null }[];
  submitting: boolean;
  onJoin: () => Promise<void>;
  onComplete: () => Promise<void>;
  onCancelBoss: () => Promise<void>;
  onReopenJoinWindow: () => Promise<void>;
  onDecisionChange: (userId: string, partial: Partial<BossParticipantDecision>) => void;
};

export function BossQuestActiveCard({
  bossQuest,
  alreadyJoined,
  joinWindowOpen,
  isGuildMaster,
  decisions,
  familyMembers,
  submitting,
  onJoin,
  onComplete,
  onCancelBoss,
  onReopenJoinWindow,
  onDecisionChange,
}: BossQuestActiveCardProps) {
  return (
    <div className="rounded-lg border border-dark-600 bg-dark-800/60 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold text-gray-100">{bossQuest.name}</h4>
          <p className="text-sm text-gray-400">{bossQuest.description}</p>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 text-sm px-2 py-1 rounded-md border",
            joinWindowOpen ? "border-gold-500/60 text-gold-300" : "border-gray-600 text-gray-400"
          )}
        >
          <Clock size={16} />
          <span>{formatCountdown(bossQuest.join_window_expires_at)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-gold-400" />
          <span>{bossQuest.reward_xp} XP</span>
          <span className="text-gray-500">•</span>
          <span>{bossQuest.reward_gold} Gold</span>
          <span className="text-gray-500">•</span>
          <span>+1 Honor</span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={16} className="text-emerald-400" />
          <span>{bossQuest.boss_battle_participants?.length || 0} joined</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {!alreadyJoined && joinWindowOpen && (
          <Button onClick={onJoin} disabled={submitting} variant="gold" className="w-full sm:w-auto">
            Join Boss Quest
          </Button>
        )}
        {alreadyJoined && <div className="text-sm text-emerald-300">You are enlisted for this boss quest.</div>}
        {!joinWindowOpen && <div className="text-sm text-amber-300">Join window closed.</div>}
        {isGuildMaster && (
          <Button onClick={onComplete} disabled={submitting} variant="secondary" className="w-full sm:w-auto">
            Declare Boss Defeated
          </Button>
        )}
      </div>

      {isGuildMaster && (
        <div className="flex flex-wrap gap-2">
          <Button variant="destructive" size="sm" onClick={onCancelBoss} disabled={submitting}>
            Cancel Boss
          </Button>
          {!joinWindowOpen && (
            <Button variant="outline" size="sm" onClick={onReopenJoinWindow} disabled={submitting}>
              Reopen Join Window
            </Button>
          )}
        </div>
      )}

      {isGuildMaster && (
        <BossQuestParticipants
          bossQuest={bossQuest}
          familyMembers={familyMembers}
          decisions={decisions}
          onDecisionChange={onDecisionChange}
          submitting={submitting}
        />
      )}
    </div>
  );
}
