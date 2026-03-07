import React from "react";
import { render, screen } from "@testing-library/react";
import { QuestMeta } from "../QuestMeta";
import { createMockQuest } from "./quest-card.fixtures";

jest.useFakeTimers();
jest.setSystemTime(new Date("2025-01-15T12:00:00"));

const defaultProps = {
  recurrenceLabel: null,
  volunteerBonusPercent: null,
  streakBonusPercent: null,
};

describe("QuestMeta completion timestamp", () => {
  afterAll(() => {
    jest.useRealTimers();
  });

  it("shows completion timestamp for COMPLETED quests", () => {
    const quest = createMockQuest({
      status: "COMPLETED",
      completed_at: "2025-01-15T10:00:00",
    });

    render(<QuestMeta quest={quest} {...defaultProps} />);

    expect(screen.getByText(/Completed/)).toBeInTheDocument();
    expect(screen.getByText(/2 hours ago/)).toBeInTheDocument();
  });

  it("shows relative time for recent completions", () => {
    const quest = createMockQuest({
      status: "COMPLETED",
      completed_at: "2025-01-15T11:30:00",
    });

    render(<QuestMeta quest={quest} {...defaultProps} />);

    expect(screen.getByText(/30 minutes ago/)).toBeInTheDocument();
  });

  it("shows date for older completions", () => {
    const quest = createMockQuest({
      status: "COMPLETED",
      completed_at: "2025-01-10T09:00:00",
    });

    render(<QuestMeta quest={quest} {...defaultProps} />);

    const el = screen.getByText(/Completed/);
    expect(el.textContent).toContain("Jan");
    expect(el.textContent).toContain("10");
  });

  it("does not show timestamp when completed_at is null", () => {
    const quest = createMockQuest({
      status: "COMPLETED",
      completed_at: null,
    });

    render(<QuestMeta quest={quest} {...defaultProps} />);

    expect(screen.queryByText(/Completed/)).not.toBeInTheDocument();
  });

  it("does not show timestamp for non-COMPLETED status", () => {
    const quest = createMockQuest({
      status: "IN_PROGRESS",
      completed_at: "2025-01-15T10:00:00",
    });

    render(<QuestMeta quest={quest} {...defaultProps} />);

    expect(screen.queryByText(/Completed/)).not.toBeInTheDocument();
  });

  it("does not show timestamp for PENDING status", () => {
    const quest = createMockQuest({
      status: "PENDING",
      completed_at: null,
    });

    render(<QuestMeta quest={quest} {...defaultProps} />);

    expect(screen.queryByText(/Completed/)).not.toBeInTheDocument();
  });
});
