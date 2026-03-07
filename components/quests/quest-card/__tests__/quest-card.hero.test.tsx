import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import QuestCard from "../index";
import { createMockQuest } from "./quest-card.fixtures";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => (
      <div {...(props as any)}>{children}</div>
    ),
  },
}));

jest.mock("@/lib/utils/colors", () => ({
  getDifficultyColor: (difficulty: string) =>
    `text-${difficulty?.toLowerCase() || "gray"}-400`,
  getStatusColor: (status: string | null | undefined) =>
    `bg-${status?.toLowerCase() || "gray"}-600`,
}));

jest.mock("@/lib/utils/formatting", () => ({
  formatDueDate: (date: string) => `Due: ${date}`,
  formatPercent: (value: number | null) =>
    value ? `${Math.round(value * 100)}%` : null,
}));

jest.mock("@/lib/animations/variants", () => ({
  staggerItem: {},
}));

describe("QuestCard Component - Hero View", () => {
  describe("Quest Display", () => {
    it("renders quest title and description", () => {
      render(<QuestCard quest={createMockQuest()} viewMode="hero" />);
      expect(screen.getByText("Clean the Kitchen")).toBeInTheDocument();
      expect(
        screen.getByText("Wash dishes and wipe counters"),
      ).toBeInTheDocument();
    });

    it("displays quest metadata (XP, gold, difficulty, due date)", () => {
      render(
        <QuestCard
          quest={createMockQuest({
            xp_reward: 150,
            gold_reward: 75,
            difficulty: "HARD",
          })}
          viewMode="hero"
        />,
      );
      expect(screen.getByText("150 XP")).toBeInTheDocument();
      expect(screen.getByText("75 Gold")).toBeInTheDocument();
      expect(screen.getByText("HARD")).toBeInTheDocument();
    });

    it("displays recurrence pattern when present", () => {
      render(
        <QuestCard
          quest={createMockQuest({ recurrence_pattern: "WEEKLY" })}
          viewMode="hero"
        />,
      );
      expect(screen.getByText("Weekly")).toBeInTheDocument();
    });

    it("displays assigned hero name when provided", () => {
      render(
        <QuestCard
          quest={createMockQuest()}
          viewMode="hero"
          assignedHeroName="Alice"
        />,
      );
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    it("displays streak bonus when present", () => {
      render(
        <QuestCard
          quest={createMockQuest({ streak_bonus: 0.2, streak_count: 5 })}
          viewMode="hero"
        />,
      );
      expect(screen.getByText("5-day streak (+20%)")).toBeInTheDocument();
    });

    it("displays volunteer bonus when present", () => {
      render(
        <QuestCard
          quest={createMockQuest({ volunteer_bonus: 0.15 })}
          viewMode="hero"
        />,
      );
      expect(screen.getByText(/Volunteer Bonus/)).toBeInTheDocument();
    });

    it("displays status badge", () => {
      render(
        <QuestCard
          quest={createMockQuest({ status: "COMPLETED" })}
          viewMode="hero"
        />,
      );
      expect(screen.getByText("COMPLETED")).toBeInTheDocument();
    });
  });

  describe("Actions", () => {
    it("renders pick up button for available quests", () => {
      const onPickup = jest.fn();
      render(
        <QuestCard
          quest={createMockQuest({ status: "AVAILABLE" })}
          viewMode="hero"
          onPickup={onPickup}
        />,
      );
      expect(screen.getByText("Pick Up Quest")).toBeInTheDocument();
    });

    it("calls onPickup when pick up button is clicked", () => {
      const onPickup = jest.fn();
      const quest = createMockQuest({ status: "AVAILABLE" });
      render(<QuestCard quest={quest} viewMode="hero" onPickup={onPickup} />);
      fireEvent.click(screen.getByText("Pick Up Quest"));
      expect(onPickup).toHaveBeenCalledWith(quest);
    });

    it("renders start button for pending quests and calls onStart", () => {
      const onStart = jest.fn();
      render(
        <QuestCard
          quest={createMockQuest({ status: "PENDING" })}
          viewMode="hero"
          onStart={onStart}
        />,
      );
      fireEvent.click(screen.getByText("Start Quest"));
      expect(onStart).toHaveBeenCalledWith("quest-1");
    });

    it("renders abandon button for family quests and calls onRelease", () => {
      const onRelease = jest.fn();
      render(
        <QuestCard
          quest={createMockQuest({ status: "CLAIMED", quest_type: "FAMILY" })}
          viewMode="hero"
          onRelease={onRelease}
        />,
      );
      fireEvent.click(screen.getByText("Abandon Quest"));
      expect(onRelease).toHaveBeenCalledWith("quest-1");
    });

    it("renders complete button for in-progress quests and calls onComplete", () => {
      const onComplete = jest.fn();
      render(
        <QuestCard
          quest={createMockQuest({ status: "IN_PROGRESS" })}
          viewMode="hero"
          onComplete={onComplete}
        />,
      );
      fireEvent.click(screen.getByText("Complete Quest"));
      expect(onComplete).toHaveBeenCalledWith("quest-1");
    });
  });
});
