import React from "react";
import { render, screen } from "@testing-library/react";
import QuestCard from "../index";
import { createMockQuest } from "./quest-card.fixtures";
import { QuestStatus } from "@/lib/types/database";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => <div {...(props as any)}>{children}</div>,
  },
}));

jest.mock("@/lib/utils/colors", () => ({
  getDifficultyColor: (difficulty: string) => `text-${difficulty?.toLowerCase() || "gray"}-400`,
  getStatusColor: (status: string | null | undefined) => `bg-${status?.toLowerCase() || "gray"}-600`,
}));

jest.mock("@/lib/utils/formatting", () => ({
  formatDueDate: (date: string) => `Due: ${date}`,
  formatPercent: (value: number | null) => (value ? `${Math.round(value * 100)}%` : null),
}));

jest.mock("@/lib/animations/variants", () => ({
  staggerItem: {},
}));

describe("QuestCard Component - Accessibility and Edge Cases", () => {
  it("renders with null status gracefully", () => {
    render(<QuestCard quest={createMockQuest({ status: null })} viewMode="hero" />);
    expect(screen.getByText("PENDING")).toBeInTheDocument();
  });

  it("renders with no due date", () => {
    render(<QuestCard quest={createMockQuest({ due_date: null })} viewMode="hero" />);
    expect(screen.getByText("Clean the Kitchen")).toBeInTheDocument();
  });

  it("renders with no recurrence pattern", () => {
    render(<QuestCard quest={createMockQuest({ recurrence_pattern: null })} viewMode="hero" />);
    expect(screen.getByText("Clean the Kitchen")).toBeInTheDocument();
  });

  it("renders with empty family members list", () => {
    render(
      <QuestCard quest={createMockQuest({ status: "PENDING" as QuestStatus })} viewMode="gm" familyMembers={[]} />
    );
    expect(screen.getByText("Clean the Kitchen")).toBeInTheDocument();
    expect(screen.queryByTestId("gm-assign-dropdown")).not.toBeInTheDocument();
  });
});
