import { QuestInstanceService } from "../quest-instance-service";
import { supabase } from "../supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database-generated";

export const mockQuestId = "quest-123";
export const mockCharacterId = "character-456";
export const mockUserId = "user-789";
export const mockGMId = "gm-001";

export const mockFamilyQuest = {
  id: mockQuestId,
  title: "Clean the kitchen",
  description: "Wipe counters and sweep floor",
  xp_reward: 100,
  gold_reward: 50,
  difficulty: "MEDIUM",
  category: "DAILY",
  family_id: "family-123",
  quest_type: "FAMILY",
  status: "AVAILABLE",
  assigned_to_id: null,
  volunteered_by: null,
  volunteer_bonus: null,
  created_by_id: mockGMId,
};

export const mockClaimedQuest = {
  ...mockFamilyQuest,
  status: "CLAIMED",
  assigned_to_id: mockUserId,
  volunteered_by: mockCharacterId,
  volunteer_bonus: 0.2,
};

export const mockCharacter = {
  id: mockCharacterId,
  user_id: mockUserId,
  name: "Sir Galahad",
  active_family_quest_id: null,
};

export const mockCharacterWithQuest = {
  ...mockCharacter,
  active_family_quest_id: "another-quest-123",
};

export const createService = () => {
  const supabaseMock = supabase as unknown as { from: jest.Mock };
  const mockFrom = jest.fn();
  supabaseMock.from = mockFrom;
  const service = new QuestInstanceService(
    supabase as unknown as SupabaseClient<Database>
  );
  return { service, mockFrom };
};
