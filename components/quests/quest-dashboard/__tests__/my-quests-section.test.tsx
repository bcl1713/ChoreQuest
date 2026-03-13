import React from "react";
import { render, screen } from "@testing-library/react";
import { MyQuestsSection } from "../my-quests-section";

jest.mock("../quest-list", () => {
  return function MockQuestList({
    quests,
    emptyMessage,
    emptyHint,
  }: {
    quests: unknown[];
    emptyMessage?: string;
    emptyHint?: string;
  }) {
    return (
      <div data-testid="quest-list">
        {quests.length === 0 ? (
          <>
            <p>{emptyMessage}</p>
            {emptyHint && <p data-testid="empty-hint">{emptyHint}</p>}
          </>
        ) : (
          <span>{quests.length} quests</span>
        )}
      </div>
    );
  };
});

const defaultProps = {
  activeQuests: [],
  historicalQuestCount: 0,
  bossHistoryCount: 0,
  onStartQuest: jest.fn(),
  onCompleteQuest: jest.fn(),
  onReleaseQuest: jest.fn(),
  familyMembers: [],
  isHighlighted: jest.fn().mockReturnValue(false),
};

describe("MyQuestsSection", () => {
  it("renders the My Quests heading", () => {
    render(<MyQuestsSection {...defaultProps} />);
    expect(screen.getByText(/My Quests/)).toBeInTheDocument();
  });

  it("does not show history hint when no history", () => {
    render(
      <MyQuestsSection
        {...defaultProps}
        historicalQuestCount={0}
        bossHistoryCount={0}
      />,
    );
    expect(
      screen.queryByText(/Completed adventures live in Quest History/),
    ).not.toBeInTheDocument();
  });

  it("shows history hint when there is quest history", () => {
    render(<MyQuestsSection {...defaultProps} historicalQuestCount={3} />);
    expect(
      screen.getByText(/Completed adventures live in Quest History/),
    ).toBeInTheDocument();
  });

  it("shows history hint when there is boss history", () => {
    render(<MyQuestsSection {...defaultProps} bossHistoryCount={1} />);
    expect(
      screen.getByText(/Completed adventures live in Quest History/),
    ).toBeInTheDocument();
  });

  it("passes emptyHint to QuestList when history exists", () => {
    render(<MyQuestsSection {...defaultProps} historicalQuestCount={2} />);
    expect(screen.getByTestId("empty-hint")).toHaveTextContent(
      "Check Quest History to revisit your completed quests.",
    );
  });

  it("does not pass emptyHint to QuestList when no history", () => {
    render(<MyQuestsSection {...defaultProps} />);
    expect(screen.queryByTestId("empty-hint")).not.toBeInTheDocument();
  });
});
