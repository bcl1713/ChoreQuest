import React from "react";
import { render, screen } from "@testing-library/react";
import { QuestManagementSection } from "../quest-management-section";
import { QuestInstance } from "@/lib/types/database";

jest.mock("@/components/quests/quest-card", () => {
  return function MockQuestCard({
    quest,
    viewMode,
    hideAssignment,
  }: {
    quest: { id: string; title: string };
    viewMode: string;
    hideAssignment?: boolean;
  }) {
    return (
      <div
        data-testid={`quest-card-${quest.id}`}
        data-view-mode={viewMode}
        data-hide-assignment={hideAssignment ? "true" : "false"}
      >
        {quest.title}
      </div>
    );
  };
});

jest.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

jest.mock("@/lib/animations/variants", () => ({
  staggerContainer: {},
}));

const makeQuest = (overrides: Partial<QuestInstance> = {}): QuestInstance => ({
  id: "quest-1",
  title: "Test Quest",
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
  ...overrides,
});

const defaultProps = {
  title: "Unassigned",
  count: 0,
  quests: [] as QuestInstance[],
  emptyMessage: "All quests have been assigned",
  familyMembers: [],
  selectedAssignee: {},
  getAssignedHeroName: jest.fn().mockReturnValue(undefined),
  onAssigneeChange: jest.fn(),
  onAssign: jest.fn(),
  onApprove: jest.fn(),
  onDeny: jest.fn(),
  onCancel: jest.fn(),
  onRelease: jest.fn(),
};

describe("QuestManagementSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders section header with title and count", () => {
    render(
      <QuestManagementSection {...defaultProps} title="Unassigned" count={3} />,
    );

    expect(screen.getByText("Unassigned")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows empty message when quests array is empty", () => {
    render(<QuestManagementSection {...defaultProps} quests={[]} />);

    expect(
      screen.getByText("All quests have been assigned"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId(/quest-card/)).not.toBeInTheDocument();
  });

  it("renders quest cards when quests are present", () => {
    const quests = [
      makeQuest({ id: "q1", title: "Quest One" }),
      makeQuest({ id: "q2", title: "Quest Two" }),
    ];

    render(
      <QuestManagementSection {...defaultProps} quests={quests} count={2} />,
    );

    expect(screen.getByTestId("quest-card-q1")).toBeInTheDocument();
    expect(screen.getByTestId("quest-card-q2")).toBeInTheDocument();
    expect(
      screen.queryByText("All quests have been assigned"),
    ).not.toBeInTheDocument();
  });

  it("passes gm viewMode to QuestCard", () => {
    const quests = [makeQuest({ id: "q1" })];

    render(
      <QuestManagementSection {...defaultProps} quests={quests} count={1} />,
    );

    expect(screen.getByTestId("quest-card-q1")).toHaveAttribute(
      "data-view-mode",
      "gm",
    );
  });

  it("passes hideAssignment=false by default", () => {
    const quests = [makeQuest({ id: "q1" })];

    render(
      <QuestManagementSection {...defaultProps} quests={quests} count={1} />,
    );

    expect(screen.getByTestId("quest-card-q1")).toHaveAttribute(
      "data-hide-assignment",
      "false",
    );
  });

  it("passes hideAssignment=true when prop is set", () => {
    const quests = [makeQuest({ id: "q1" })];

    render(
      <QuestManagementSection
        {...defaultProps}
        quests={quests}
        count={1}
        hideAssignment
      />,
    );

    expect(screen.getByTestId("quest-card-q1")).toHaveAttribute(
      "data-hide-assignment",
      "true",
    );
  });
});
