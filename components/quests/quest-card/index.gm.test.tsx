import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import QuestCard from "./index";
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

describe("QuestCard Component - GM View", () => {
  describe("Quest Display", () => {
    it("renders quest title and description in GM view", () => {
      render(<QuestCard quest={createMockQuest()} viewMode="gm" />);
      expect(screen.getByText("Clean the Kitchen")).toBeInTheDocument();
      expect(screen.getByText("Wash dishes and wipe counters")).toBeInTheDocument();
    });
  });

  describe("GM Action Buttons", () => {
    it("shows Approve button for COMPLETED quest", () => {
      const onApprove = jest.fn();
      render(
        <QuestCard
          quest={createMockQuest({ status: "COMPLETED" as QuestStatus })}
          viewMode="gm"
          onApprove={onApprove}
        />
      );
      expect(screen.getByTestId("gm-approve-quest")).toBeInTheDocument();
    });

    it("shows Cancel button for active quests", () => {
      const onCancel = jest.fn();
      render(
        <QuestCard
          quest={createMockQuest({ status: "PENDING" as QuestStatus })}
          viewMode="gm"
          onCancel={onCancel}
        />
      );
      expect(screen.getByTestId("gm-cancel-quest")).toBeInTheDocument();
    });

    it("calls onApprove when Approve button clicked", () => {
      const onApprove = jest.fn();
      render(
        <QuestCard
          quest={createMockQuest({ status: "COMPLETED" as QuestStatus })}
          viewMode="gm"
          onApprove={onApprove}
        />
      );
      fireEvent.click(screen.getByTestId("gm-approve-quest"));
      expect(onApprove).toHaveBeenCalledWith("quest-1");
    });

    it("calls onCancel when Cancel button clicked", () => {
      const onCancel = jest.fn();
      render(
        <QuestCard
          quest={createMockQuest({ status: "PENDING" as QuestStatus })}
          viewMode="gm"
          onCancel={onCancel}
        />
      );
      fireEvent.click(screen.getByTestId("gm-cancel-quest"));
      expect(onCancel).toHaveBeenCalledWith("quest-1");
    });
  });

  describe("Assignment Dropdown", () => {
    const familyMembers = [
      { id: "member-1", name: "Alice" },
      { id: "member-2", name: "Bob" },
    ];

    it("shows assignment dropdown when family members provided", () => {
      render(<QuestCard quest={createMockQuest()} viewMode="gm" familyMembers={familyMembers} />);
      expect(screen.getByTestId("gm-assign-dropdown")).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    it("disables Assign when no assignee selected", () => {
      render(<QuestCard quest={createMockQuest()} viewMode="gm" familyMembers={familyMembers} />);
      expect(screen.getByTestId("gm-assign-button")).toBeDisabled();
    });

    it("enables Assign when assignee selected", () => {
      render(
        <QuestCard
          quest={createMockQuest()}
          viewMode="gm"
          familyMembers={familyMembers}
          selectedAssignee="member-1"
        />
      );
      expect(screen.getByTestId("gm-assign-button")).not.toBeDisabled();
    });

    it("calls onAssign when Assign button clicked", () => {
      const onAssign = jest.fn();
      render(
        <QuestCard
          quest={createMockQuest()}
          viewMode="gm"
          familyMembers={familyMembers}
          selectedAssignee="member-1"
          onAssign={onAssign}
        />
      );
      fireEvent.click(screen.getByTestId("gm-assign-button"));
      expect(onAssign).toHaveBeenCalledWith("quest-1", "member-1");
    });

    it("calls onAssigneeChange when dropdown selection changes", () => {
      const onAssigneeChange = jest.fn();
      render(
        <QuestCard
          quest={createMockQuest()}
          viewMode="gm"
          familyMembers={familyMembers}
          onAssigneeChange={onAssigneeChange}
        />
      );
      fireEvent.change(screen.getByTestId("gm-assign-dropdown"), {
        target: { value: "member-2" },
      });
      expect(onAssigneeChange).toHaveBeenCalledWith("quest-1", "member-2");
    });
  });

  describe("Quest States", () => {
    it("hides Approve button for non-completed quests", () => {
      render(<QuestCard quest={createMockQuest({ status: "IN_PROGRESS" as QuestStatus })} viewMode="gm" />);
      expect(screen.queryByTestId("gm-approve-quest")).not.toBeInTheDocument();
    });

    it("hides Cancel button for approved/expired quests", () => {
      render(<QuestCard quest={createMockQuest({ status: "APPROVED" as QuestStatus })} viewMode="gm" />);
      expect(screen.queryByTestId("gm-cancel-quest")).not.toBeInTheDocument();
    });

    it("does not show assignment for approved quests", () => {
      render(
        <QuestCard
          quest={createMockQuest({ status: "APPROVED" as QuestStatus })}
          viewMode="gm"
          familyMembers={[{ id: "member-1", name: "Alice" }]}
        />
      );
      expect(screen.queryByTestId("gm-assign-dropdown")).not.toBeInTheDocument();
    });
  });
});
