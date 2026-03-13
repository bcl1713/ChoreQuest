import React from "react";
import { render, screen } from "@testing-library/react";
import { FamilyQuestSection } from "../family-quest-section";
import type { Character, QuestInstance } from "@/lib/types/database";

jest.mock("@/components/family/family-quest-claiming", () => {
  return function MockFamilyQuestClaiming({ quests }: { quests: unknown[] }) {
    return (
      <div data-testid="family-quest-claiming">{quests.length} quests</div>
    );
  };
});

const mockCharacter: Character = {
  id: "char-1",
  user_id: "user-1",
  name: "Knight Nova",
  class: "KNIGHT",
  level: 1,
  xp: 0,
  gold: 0,
  gems: 0,
  avatar_url: null,
  family_id: "family-1",
  created_at: "2025-01-01",
  updated_at: "2025-01-01",
  streak_count: 0,
  last_activity_date: null,
};

const mockQuest: QuestInstance = {
  id: "quest-1",
  title: "Family Quest",
  description: "",
  difficulty: "EASY",
  status: "PENDING",
  xp_reward: 100,
  gold_reward: 50,
  category: "DAILY",
  created_by_id: "user-1",
  due_date: null,
  created_at: "2025-01-01",
  updated_at: "2025-01-01",
  recurrence_pattern: null,
  assigned_to_id: null,
  completed_at: null,
  approved_at: null,
  streak_bonus: null,
  streak_count: null,
  volunteer_bonus: null,
  volunteered_by: null,
  template_id: null,
  quest_type: null,
  cycle_start_date: null,
  cycle_end_date: null,
  family_id: "family-1",
};

describe("FamilyQuestSection", () => {
  it("renders FamilyQuestClaiming when character and quests exist", () => {
    render(
      <FamilyQuestSection
        quests={[mockQuest]}
        character={mockCharacter}
        onClaimQuest={jest.fn()}
      />,
    );
    expect(screen.getByTestId("family-quest-claiming")).toBeInTheDocument();
  });

  it("renders nothing when character is null", () => {
    const { container } = render(
      <FamilyQuestSection
        quests={[mockQuest]}
        character={null}
        onClaimQuest={jest.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when quests array is empty", () => {
    const { container } = render(
      <FamilyQuestSection
        quests={[]}
        character={mockCharacter}
        onClaimQuest={jest.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
