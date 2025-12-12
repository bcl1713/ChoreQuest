import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import QuestCard from "../index";
import { createMockQuest } from "./quest-card.fixtures";

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

describe("QuestCard Component - Hero View", () => {
  describe("Quest Display", () => {
    it("renders quest title and description", () => {
      render(<QuestCard quest={createMockQuest()} viewMode="hero" />);
      expect(screen.getByText("Clean the Kitchen")).toBeInTheDocument();
      expect(screen.getByText("Wash dishes and wipe counters")).toBeInTheDocument();
    });

    it("displays quest metadata (XP, gold, difficulty, due date)", () => {
      render(
        <QuestCard
          quest={createMockQuest({ xp_reward: 150, gold_reward: 75, difficulty: "HARD" })}
          viewMode="hero"
        />
      );
      expect(screen.getByText("150 XP")).toBeInTheDocument();
      expect(screen.getByText("75 Gold")).toBeInTheDocument();
      expect(screen.getByText("HARD")).toBeInTheDocument();
    });

    it("displays recurrence pattern when present", () => {
      render(<QuestCard quest={createMockQuest({ recurrence_pattern: "WEEKLY" })} viewMode="hero" />);
      expect(screen.getByText("Weekly")).toBeInTheDocument();
    });

    it("displays assigned hero name when provided", () => {
      render(<QuestCard quest={createMockQuest()} viewMode="hero" assignedHeroName="Alice" />);
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    it("displays streak bonus when present", () => {
      render(
        <QuestCard quest={createMockQuest({ streak_bonus: 0.2, streak_count: 5 })} viewMode="hero" />
      );
      expect(screen.getByText("5-day streak (+20%)")).toBeInTheDocument();
    });

    it("displays volunteer bonus when present", () => {
      render(<QuestCard quest={createMockQuest({ volunteer_bonus: 0.15 })} viewMode="hero" />);
      expect(screen.getByText("Volunteer Bonus")).toBeInTheDocument();
      expect(screen.getByText("15% bonus")).toBeInTheDocument();
    });

    it("displays status badge", () => {
      render(<QuestCard quest={createMockQuest({ status: "COMPLETED" })} viewMode="hero" />);
      expect(screen.getByText("COMPLETED")).toBeInTheDocument();
    });
  });

  describe("Actions", () => {
    it("renders claim button for available quests", () => {
      render(<QuestCard quest={createMockQuest({ status: "AVAILABLE" })} viewMode="hero" />);
      expect(screen.getByText("Claim Quest")).toBeInTheDocument();
    });

    it("shows claim confirmation modal when enabled", () => {
      render(
        <QuestCard
          quest={createMockQuest({ status: "AVAILABLE" })}
          viewMode="hero"
          enableClaimConfirmation
        />
      );
      fireEvent.click(screen.getByText("Claim Quest"));
      expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
    });

    it("calls onClaim when confirmed", () => {
      const onClaim = jest.fn();
      render(
        <QuestCard
          quest={createMockQuest({ status: "AVAILABLE" })}
          viewMode="hero"
          onClaim={onClaim}
          enableClaimConfirmation
        />
      );
      fireEvent.click(screen.getByText("Claim Quest"));
      fireEvent.click(screen.getByText("Confirm"));
      expect(onClaim).toHaveBeenCalledWith("quest-1");
    });

    it("renders release button for claimed quests and calls onRelease", () => {
      const onRelease = jest.fn();
      render(
        <QuestCard
          quest={createMockQuest({ status: "CLAIMED" })}
          viewMode="hero"
          onRelease={onRelease}
        />
      );
      fireEvent.click(screen.getByText("Release Quest"));
      expect(onRelease).toHaveBeenCalledWith("quest-1");
    });

    it("renders submit button for in-progress quests and calls onSubmit", () => {
      const onSubmit = jest.fn();
      render(
        <QuestCard
          quest={createMockQuest({ status: "IN_PROGRESS" })}
          viewMode="hero"
          onSubmit={onSubmit}
        />
      );
      fireEvent.click(screen.getByText("Submit Quest"));
      expect(onSubmit).toHaveBeenCalledWith("quest-1");
    });
  });
});
