import { QuestInstance, QuestStatus, UserProfile, Character } from "@/lib/types/database";

export interface AssignmentOption {
  id: string;
  label: string;
  disabled: boolean;
}

/**
 * Filter quests by their assigned user
 */
export function filterQuestsByUser(quests: QuestInstance[], userId: string | undefined): QuestInstance[] {
  return quests.filter((quest) => quest.assigned_to_id === userId);
}

/**
 * Filter quests by active statuses (PENDING, IN_PROGRESS, CLAIMED)
 */
export function filterActiveQuests(quests: QuestInstance[]): QuestInstance[] {
  const activeStatuses: QuestStatus[] = ["PENDING", "IN_PROGRESS", "CLAIMED"];
  const activeSet = new Set<QuestStatus>(activeStatuses);

  return quests.filter((quest) => {
    if (!quest.status) return true;
    return activeSet.has(quest.status);
  });
}

/**
 * Filter quests by historical statuses (COMPLETED, APPROVED, EXPIRED, MISSED)
 * and sort by timestamp (newest first)
 */
export function filterHistoricalQuests(quests: QuestInstance[]): QuestInstance[] {
  const historicalStatuses: QuestStatus[] = ["COMPLETED", "APPROVED", "EXPIRED", "MISSED"];
  const historySet = new Set<QuestStatus>(historicalStatuses);

  return quests
    .filter((quest) => quest.status && historySet.has(quest.status))
    .sort((a, b) => {
      const getTimestamp = (q: QuestInstance) => {
        const timestamp = q.completed_at ?? q.updated_at ?? q.created_at ?? new Date().toISOString();
        return new Date(timestamp).getTime();
      };
      return getTimestamp(b) - getTimestamp(a);
    });
}

/**
 * Filter unassigned individual quests - these should only appear if they were created manually
 * and not auto-assigned by the cron job. In most cases, this list should be empty.
 */
export function filterUnassignedIndividualQuests(quests: QuestInstance[]): QuestInstance[] {
  return quests.filter((quest) => !quest.assigned_to_id && quest.quest_type !== "FAMILY");
}

/**
 * Filter unassigned family quests (excluding MISSED and EXPIRED)
 */
export function filterUnassignedFamilyQuests(quests: QuestInstance[]): QuestInstance[] {
  return quests.filter(
    (quest) =>
      quest.quest_type === "FAMILY" &&
      !quest.assigned_to_id &&
      quest.status !== "MISSED" &&
      quest.status !== "EXPIRED"
  );
}

/**
 * Filter quests awaiting approval (COMPLETED status)
 */
export function filterQuestsAwaitingApproval(quests: QuestInstance[]): QuestInstance[] {
  return quests.filter((quest) => quest.status === "COMPLETED");
}

/**
 * Filter claimable family quests (AVAILABLE status)
 */
export function filterClaimableFamilyQuests(quests: QuestInstance[]): QuestInstance[] {
  return quests.filter((quest) => quest.quest_type === "FAMILY" && quest.status === "AVAILABLE");
}

/**
 * Filter other users' quests (for Guild Master view)
 */
export function filterOtherQuests(quests: QuestInstance[], userId: string | undefined): QuestInstance[] {
  return quests.filter((quest) => quest.assigned_to_id && quest.assigned_to_id !== userId);
}

/**
 * Check if user can update quest status
 */
export function canUpdateStatus(
  quest: QuestInstance,
  newStatus: QuestStatus,
  userId: string | undefined,
  userRole: string | null | undefined
): boolean {
  if (!userId) return false;

  if (newStatus === "APPROVED") {
    return userRole === "GUILD_MASTER";
  }

  if (quest.assigned_to_id === userId) {
    if (newStatus === "IN_PROGRESS" && (quest.status === "PENDING" || quest.status === "CLAIMED" || quest.status === "AVAILABLE" || !quest.status)) {
      return true;
    }
    if (newStatus === "COMPLETED" && quest.status === "IN_PROGRESS") {
      return true;
    }
  }

  return false;
}

/**
 * Get assigned hero name for a quest
 * Works with both characters and user profiles
 */
export function getAssignedHeroName(
  quest: QuestInstance,
  characters: Character[]
): string | undefined {
  // Find character by matching against the quest's assigned_to_id (which stores user_id)
  // In family quests, assigned_to_id is the user_id of the assigned character owner
  const assignedCharacter = characters.find((char) => char.user_id === quest.assigned_to_id);
  if (assignedCharacter?.name?.trim()) {
    return assignedCharacter.name;
  }
  // Fallback to shortened character ID if name is empty
  return assignedCharacter ? `Hero (${assignedCharacter.id.substring(0, 8)})` : undefined;
}

/**
 * Get assignment options for a quest (either family characters or family members)
 */
export function getAssignmentOptions(
  quest: QuestInstance,
  familyMembers: UserProfile[],
  familyCharacters: Character[]
): AssignmentOption[] {
  if (quest.quest_type === "FAMILY") {
    return familyCharacters.map((char) => {
      const owner = familyMembers.find((member) => member.id === char.user_id);
      const disabled = Boolean(char.active_family_quest_id && char.active_family_quest_id !== quest.id);
      return {
        id: char.id,
        label: `${char.name}${owner ? ` (${owner.name})` : ""}${disabled ? " — already on a family quest" : ""}`,
        disabled,
      };
    });
  } else {
    return familyMembers
      .filter((member) => member.role !== "GUILD_MASTER")
      .map((member) => ({
        id: member.id,
        label: member.name,
        disabled: false,
      }));
  }
}

/**
 * Filter quests pending approval (COMPLETED status)
 */
export function filterPendingApprovalQuests(quests: QuestInstance[]): QuestInstance[] {
  return quests.filter((quest) => quest.status === "COMPLETED");
}

/**
 * Map family characters to lightweight assignment display objects.
 * Returns characterId (used by API) alongside user_id information.
 * The quest.assigned_to_id references user_profiles.id, but API expects character ID.
 * Ensures every character has a readable label, falling back to a shortened id.
 *
 * @param familyCharacters - Array of Character objects to map
 * @returns Array of objects with characterId and character name for assignment lookup
 * @description Returns the actual character ID so the API receives the correct identifier.
 */
export function mapFamilyCharactersToAssignmentDisplay(
  familyCharacters: Character[]
): Array<{ id: string; name: string }> {
  return familyCharacters.map((char) => {
    const displayName = (char.name && char.name.trim()) || `Hero (${char.id.substring(0, 8)})`;
    // Return the character ID (the API expects this to look up the character)
    return {
      id: char.id,
      name: displayName,
    };
  });
}

/**
 * Filter unassigned active quests (no assigned_to_id and active statuses)
 */
export function filterUnassignedActiveQuests(quests: QuestInstance[]): QuestInstance[] {
  const activeStatuses: QuestStatus[] = ["PENDING", "IN_PROGRESS", "CLAIMED", "AVAILABLE"];
  const activeSet = new Set<QuestStatus>(activeStatuses);

  return quests.filter((quest) => {
    const isUnassigned = !quest.assigned_to_id;
    const hasActiveStatus = quest.status && activeSet.has(quest.status);
    return isUnassigned && hasActiveStatus;
  });
}

/**
 * Filter in-progress quests (assigned and IN_PROGRESS, CLAIMED, or PENDING status)
 * PENDING quests are included to show GM-denied quests that are awaiting hero action
 */
export function filterInProgressQuests(quests: QuestInstance[]): QuestInstance[] {
  const inProgressStatuses: QuestStatus[] = ["IN_PROGRESS", "CLAIMED", "PENDING"];
  const inProgressSet = new Set<QuestStatus>(inProgressStatuses);

  return quests.filter((quest) => {
    const isAssigned = Boolean(quest.assigned_to_id);
    const hasInProgressStatus = quest.status && inProgressSet.has(quest.status);
    return isAssigned && hasInProgressStatus;
  });
}
