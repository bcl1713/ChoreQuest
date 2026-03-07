import React from "react";
import { render } from "@testing-library/react";
import QuestCreateModal from "@/components/quests/quest-create-modal";
import { questTemplateService } from "@/lib/quest-template-service";
import { QuestTemplate } from "@/lib/types/database";

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: { id: "test-user-id" },
    profile: { family_id: "test-family-id", role: "GUILD_MASTER" },
  }),
}));

jest.mock("@/hooks/useFamilyMembers", () => ({
  useFamilyMembers: () => ({
    familyMembers: [
      {
        id: "member-1",
        name: "Test Member",
        role: "HERO",
      },
    ],
    familyCharacters: [
      {
        id: "character-1",
        user_id: "member-1",
        name: "Sir Test",
        class: "KNIGHT",
        level: 1,
        xp: 0,
        gold: 0,
        gems: 0,
        honor_points: 0,
        avatar_url: null,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        active_family_quest_id: null,
      },
    ],
    loading: false,
    error: null,
    reload: jest.fn(),
  }),
}));

jest.mock("@/lib/supabase", () => {
  const from = jest.fn((table: string) => {
    if (table === "user_profiles") {
      return {
        select: jest.fn(() => ({
          eq: jest.fn(async () => ({
            data: [
              {
                id: "member-1",
                name: "Test Member",
                role: "HERO",
              },
            ],
            error: null,
          })),
        })),
      };
    }
    if (table === "characters") {
      return {
        select: jest.fn(() => ({
          in: jest.fn(async () => ({
            data: [
              {
                id: "character-1",
                user_id: "member-1",
                name: "Sir Test",
                class: "KNIGHT",
                level: 1,
                xp: 0,
                gold: 0,
                gems: 0,
                honor_points: 0,
                avatar_url: null,
                created_at: "2025-01-01T00:00:00Z",
                updated_at: "2025-01-01T00:00:00Z",
                active_family_quest_id: null,
              },
            ],
            error: null,
          })),
        })),
      };
    }
    if (table === "quest_instances" || table === "quest_templates") {
      return {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };
    }
    return {
      select: jest.fn(() => ({
        eq: jest.fn(async () => ({ data: null, error: null })),
      })),
    };
  });
  return {
    supabase: {
      from,
    },
  };
});

jest.mock("@/lib/quest-template-service", () => ({
  questTemplateService: {
    createQuestFromTemplate: jest.fn(),
  },
}));

export const mockTemplates: QuestTemplate[] = [
  {
    id: "template-1",
    family_id: "test-family-id",
    title: "Clean Your Room",
    description: "Tidy up your bedroom",
    xp_reward: 100,
    gold_reward: 20,
    difficulty: "EASY",
    category: "DAILY",
    class_bonuses: {
      KNIGHT: { xp_multiplier: 1.0, gold_multiplier: 1.0 },
      MAGE: { xp_multiplier: 1.0, gold_multiplier: 1.0 },
      RANGER: { xp_multiplier: 1.2, gold_multiplier: 1.1 },
      ROGUE: { xp_multiplier: 1.0, gold_multiplier: 1.0 },
      HEALER: { xp_multiplier: 1.0, gold_multiplier: 1.0 },
    },
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "template-2",
    family_id: "test-family-id",
    title: "Do Homework",
    description: "Complete school assignments",
    xp_reward: 150,
    gold_reward: 30,
    difficulty: "MEDIUM",
    category: "DAILY",
    class_bonuses: {
      KNIGHT: { xp_multiplier: 1.0, gold_multiplier: 1.0 },
      MAGE: { xp_multiplier: 1.3, gold_multiplier: 1.2 },
      RANGER: { xp_multiplier: 1.0, gold_multiplier: 1.0 },
      ROGUE: { xp_multiplier: 1.0, gold_multiplier: 1.0 },
      HEALER: { xp_multiplier: 1.0, gold_multiplier: 1.0 },
    },
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
];

export const renderTemplateModal = (
  props: Partial<React.ComponentProps<typeof QuestCreateModal>> = {},
) =>
  render(
    <QuestCreateModal
      isOpen={true}
      onClose={jest.fn()}
      onQuestCreated={jest.fn()}
      templates={mockTemplates}
      {...props}
    />,
  );

export { questTemplateService };
