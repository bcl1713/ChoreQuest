import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AuthenticatedUser,
} from "@/lib/api-auth-helpers";
import type {
  CharacterClass,
  QuestStatus,
  UserRole,
} from "@/lib/types/database";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";

export type AdminUserDetailUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole | null;
  familyId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminUserDetailCharacter = {
  id: string;
  name: string;
  class: CharacterClass | null;
  level: number;
  xp: number;
  gold: number;
  gems: number;
  honor: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminUserQuestSummary = {
  active: number;
  pendingApproval: number;
  approved: number;
  missed: number;
  total: number;
};

export type AdminUserRecentQuest = {
  id: string;
  title: string;
  status: QuestStatus | null;
  dueDate: string | null;
  completedAt: string | null;
  approvedAt: string | null;
  goldReward: number;
  xpReward: number;
};

export type AdminUserDetail = {
  user: AdminUserDetailUser;
  character: AdminUserDetailCharacter | null;
  questSummary: AdminUserQuestSummary;
  recentQuests: AdminUserRecentQuest[];
  goldLedgerNotice: string;
};

type RawCharacter = {
  id: string;
  name: string;
  class: CharacterClass | null;
  level: number | null;
  xp: number | null;
  gold: number | null;
  gems: number | null;
  honor_points: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type RawUserProfile = {
  id: string;
  name: string;
  email: string;
  role: UserRole | null;
  family_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  characters: RawCharacter | RawCharacter[] | null;
};

type RawQuest = {
  id: string;
  title: string;
  status: QuestStatus | null;
  due_date: string | null;
  completed_at: string | null;
  approved_at: string | null;
  gold_reward: number | null;
  xp_reward: number | null;
};

const GOLD_LEDGER_NOTICE =
  "Current gold is shown from the character record. Full ledger and audit history will land in a separate audit slice.";

function firstCharacter(
  characters: RawCharacter | RawCharacter[] | null,
): RawCharacter | null {
  if (Array.isArray(characters)) {
    return characters[0] ?? null;
  }
  return characters ?? null;
}

function emptyQuestSummary(): AdminUserQuestSummary {
  return {
    active: 0,
    pendingApproval: 0,
    approved: 0,
    missed: 0,
    total: 0,
  };
}

function summarizeQuests(quests: RawQuest[]): AdminUserQuestSummary {
  return quests.reduce((summary, quest) => {
    summary.total += 1;

    if (
      quest.status === "IN_PROGRESS" ||
      quest.status === "CLAIMED" ||
      quest.status === "PENDING" ||
      quest.status === "AVAILABLE"
    ) {
      summary.active += 1;
    } else if (quest.status === "COMPLETED") {
      summary.pendingApproval += 1;
    } else if (quest.status === "APPROVED") {
      summary.approved += 1;
    } else if (quest.status === "MISSED" || quest.status === "EXPIRED") {
      summary.missed += 1;
    }

    return summary;
  }, emptyQuestSummary());
}

function mapRecentQuest(quest: RawQuest): AdminUserRecentQuest {
  return {
    id: quest.id,
    title: quest.title,
    status: quest.status,
    dueDate: quest.due_date,
    completedAt: quest.completed_at,
    approvedAt: quest.approved_at,
    goldReward: quest.gold_reward ?? 0,
    xpReward: quest.xp_reward ?? 0,
  };
}

function isApprovedQuest(quest: RawQuest): boolean {
  return quest.status === "APPROVED";
}

function mapCharacter(
  character: RawCharacter | null,
): AdminUserDetailCharacter | null {
  if (!character) return null;

  return {
    id: character.id,
    name: character.name,
    class: character.class,
    level: character.level ?? 1,
    xp: character.xp ?? 0,
    gold: character.gold ?? 0,
    gems: character.gems ?? 0,
    honor: character.honor_points ?? 0,
    createdAt: character.created_at,
    updatedAt: character.updated_at,
  };
}

export class AdminUserDetailService {
  async getUserDetail(
    supabase: SupabaseClient,
    requesterProfile: AuthenticatedUser,
    targetUserId: string,
  ): Promise<AdminUserDetail> {
    if (requesterProfile.role !== "GUILD_MASTER") {
      throw new ForbiddenError(
        "Only Guild Masters can view admin user details",
        "ADMIN_USER_DETAIL_FORBIDDEN",
      );
    }

    const { data: targetProfile, error: targetError } = await supabase
      .from("user_profiles")
      .select(
        `
        id,
        name,
        email,
        role,
        family_id,
        created_at,
        updated_at,
        characters (
          id,
          name,
          class,
          level,
          xp,
          gold,
          gems,
          honor_points,
          created_at,
          updated_at
        )
      `,
      )
      .eq("id", targetUserId)
      .maybeSingle();

    if (targetError) {
      throw new AppError(
        "Failed to fetch user detail",
        500,
        "ADMIN_USER_DETAIL_FETCH_FAILED",
      );
    }

    const profile = targetProfile as RawUserProfile | null;
    if (!profile || profile.family_id !== requesterProfile.family_id) {
      throw new NotFoundError("User not found", "ADMIN_USER_DETAIL_NOT_FOUND");
    }

    const character = firstCharacter(profile.characters);
    const questTargetFilter = character?.id
      ? `assigned_to_id.eq.${targetUserId},volunteered_by.eq.${character.id}`
      : `assigned_to_id.eq.${targetUserId}`;

    const { data: questSummaryRows, error: questSummaryError } = await supabase
      .from("quest_instances")
      .select("id, status")
      .eq("family_id", requesterProfile.family_id)
      .or(questTargetFilter);

    if (questSummaryError) {
      throw new AppError(
        "Failed to fetch user progression",
        500,
        "ADMIN_USER_PROGRESSION_FETCH_FAILED",
      );
    }

    const { data: recentQuestRows, error: recentQuestError } = await supabase
      .from("quest_instances")
      .select(
        "id, title, status, due_date, completed_at, approved_at, gold_reward, xp_reward",
      )
      .eq("family_id", requesterProfile.family_id)
      .eq("status", "APPROVED")
      .or(questTargetFilter)
      .order("updated_at", { ascending: false })
      .limit(8);

    if (recentQuestError) {
      throw new AppError(
        "Failed to fetch user progression",
        500,
        "ADMIN_USER_PROGRESSION_FETCH_FAILED",
      );
    }

    const summaryQuests = (questSummaryRows ?? []) as RawQuest[];
    const recentQuests = ((recentQuestRows ?? []) as RawQuest[]).filter(isApprovedQuest);

    return {
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        familyId: profile.family_id,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      },
      character: mapCharacter(character),
      questSummary: summarizeQuests(summaryQuests),
      recentQuests: recentQuests.map(mapRecentQuest),
      goldLedgerNotice: GOLD_LEDGER_NOTICE,
    };
  }
}

export const adminUserDetailService = new AdminUserDetailService();
