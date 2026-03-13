import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestHistorySection } from "../quest-history-section";
import type { QuestInstance } from "@/lib/types/database";

jest.mock("../quest-list", () => {
  return function MockQuestList({ quests }: { quests: unknown[] }) {
    return <div data-testid="quest-list">{quests.length} quests</div>;
  };
});

jest.mock("@/components/boss/boss-quest-history-list", () => ({
  BossQuestHistoryList: function MockBossQuestHistoryList({
    bossQuests,
  }: {
    bossQuests: unknown[];
  }) {
    return (
      <div data-testid="boss-quest-history-list">
        {bossQuests.length} bosses
      </div>
    );
  },
}));

jest.mock("@/components/ui", () => ({
  Button: function MockButton({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick: () => void;
  }) {
    return <button onClick={onClick}>{children}</button>;
  },
}));

const mockQuest: QuestInstance = {
  id: "quest-1",
  title: "Completed Quest",
  description: "",
  difficulty: "EASY",
  status: "COMPLETED",
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

describe("QuestHistorySection", () => {
  it("renders nothing when both quest and boss history are empty", () => {
    const { container } = render(
      <QuestHistorySection
        historicalQuests={[]}
        bossHistoryQuests={[]}
        familyMembers={[]}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the Quest History heading when there is history", () => {
    render(
      <QuestHistorySection
        historicalQuests={[mockQuest]}
        bossHistoryQuests={[]}
        familyMembers={[]}
      />,
    );
    expect(screen.getByText(/Quest History/)).toBeInTheDocument();
  });

  it("shows count in toggle button when history is hidden", () => {
    render(
      <QuestHistorySection
        historicalQuests={[mockQuest, mockQuest]}
        bossHistoryQuests={[]}
        familyMembers={[]}
      />,
    );
    expect(screen.getByText("Show History (2)")).toBeInTheDocument();
  });

  it("history content is hidden by default", () => {
    render(
      <QuestHistorySection
        historicalQuests={[mockQuest]}
        bossHistoryQuests={[]}
        familyMembers={[]}
      />,
    );
    expect(screen.queryByTestId("quest-list")).not.toBeInTheDocument();
  });

  it("shows history content after clicking toggle", () => {
    render(
      <QuestHistorySection
        historicalQuests={[mockQuest]}
        bossHistoryQuests={[]}
        familyMembers={[]}
      />,
    );

    fireEvent.click(screen.getByText("Show History (1)"));

    expect(screen.getByTestId("quest-list")).toBeInTheDocument();
    expect(screen.getByTestId("boss-quest-history-list")).toBeInTheDocument();
    expect(screen.getByText("Hide History")).toBeInTheDocument();
  });

  it("hides content again after clicking toggle twice", () => {
    render(
      <QuestHistorySection
        historicalQuests={[mockQuest]}
        bossHistoryQuests={[]}
        familyMembers={[]}
      />,
    );

    fireEvent.click(screen.getByText("Show History (1)"));
    fireEvent.click(screen.getByText("Hide History"));

    expect(screen.queryByTestId("quest-list")).not.toBeInTheDocument();
  });

  it("counts boss history towards total", () => {
    render(
      <QuestHistorySection
        historicalQuests={[]}
        bossHistoryQuests={[
          { id: "boss-1", status: "DEFEATED" } as Parameters<
            typeof QuestHistorySection
          >[0]["bossHistoryQuests"][0],
        ]}
        familyMembers={[]}
      />,
    );
    expect(screen.getByText("Show History (1)")).toBeInTheDocument();
  });
});
