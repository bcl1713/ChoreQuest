import React from "react";
import { render, screen } from "@testing-library/react";
import QuestCard from "./index";
import { createMockQuest } from "./__tests__/quest-card.fixtures";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

jest.mock("./quest-card-helpers", () => ({
  getButtonVisibility: jest.fn((status, viewMode, questType) => {
    const buttonVis = {
      canStart: false,
      canComplete: false,
      canPickup: false,
      canAbandon: false,
      canApprove: false,
      canDeny: false,
      canCancel: false,
      canTogglePause: false,
      showAssignment: false,
    };
    if (viewMode === "hero") {
      buttonVis.canStart = status === "PENDING" || status === "CLAIMED" || status === "AVAILABLE";
      buttonVis.canComplete = status === "IN_PROGRESS";
      buttonVis.canPickup = status === "AVAILABLE";
      buttonVis.canAbandon =
        questType === "FAMILY" &&
        (status === "PENDING" || status === "CLAIMED" || status === "IN_PROGRESS");
    } else if (viewMode === "gm") {
      buttonVis.canApprove = status === "COMPLETED";
      buttonVis.canDeny = status === "COMPLETED";
      buttonVis.canCancel =
        status === "PENDING" ||
        status === "IN_PROGRESS" ||
        status === "AVAILABLE" ||
        status === "CLAIMED";
      buttonVis.showAssignment =
        status === "PENDING" ||
        status === "AVAILABLE" ||
        status === "IN_PROGRESS" ||
        status === "CLAIMED";
    }
    return buttonVis;
  }),
  getRecurrenceLabel: jest.fn((pattern) => {
    if (pattern === "DAILY") return "Daily";
    if (pattern === "WEEKLY") return "Weekly";
    if (pattern === "CUSTOM") return "Custom";
    return null;
  }),
}));

jest.mock("@/lib/utils/colors", () => ({
  getDifficultyColor: jest.fn((difficulty) => `difficulty-${difficulty}`),
  getStatusColor: jest.fn((status) => `status-${status}`),
}));

jest.mock("@/lib/utils/formatting", () => ({
  formatDueDate: jest.fn((date) => `Due: ${date}`),
  formatPercent: jest.fn((percent) => (percent ? `${percent}%` : null)),
}));

jest.mock("@/components/ui", () => ({
  Button: ({
    children,
    onClick,
    "data-testid": testid,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    "data-testid"?: string;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} data-testid={testid} {...props}>
      {children}
    </button>
  ),
}));

describe("QuestCard - existing hero/GM buttons", () => {
  it("should display start button for PENDING quest in hero view", () => {
    const onStart = jest.fn();
    render(<QuestCard quest={createMockQuest({ status: "PENDING" })} viewMode="hero" onStart={onStart} />);
    expect(screen.getByTestId("hero-start-quest")).toBeInTheDocument();
    expect(screen.getByText("Start Quest")).toBeInTheDocument();
  });

  it("should display complete button for IN_PROGRESS quest in hero view", () => {
    const onComplete = jest.fn();
    render(
      <QuestCard quest={createMockQuest({ status: "IN_PROGRESS" })} viewMode="hero" onComplete={onComplete} />
    );
    expect(screen.getByTestId("hero-complete-quest")).toBeInTheDocument();
    expect(screen.getByText("Complete Quest")).toBeInTheDocument();
  });

  it("should display pickup button for AVAILABLE quest in hero view", () => {
    const onPickup = jest.fn();
    render(<QuestCard quest={createMockQuest({ status: "AVAILABLE" })} viewMode="hero" onPickup={onPickup} />);
    expect(screen.getByTestId("hero-pickup-quest")).toBeInTheDocument();
    expect(screen.getByText("Pick Up Quest")).toBeInTheDocument();
  });

  it("should display approve and deny buttons for COMPLETED quest in GM view", () => {
    const onApprove = jest.fn();
    const onDeny = jest.fn();
    render(
      <QuestCard
        quest={createMockQuest({ status: "COMPLETED" })}
        viewMode="gm"
        onApprove={onApprove}
        onDeny={onDeny}
        familyMembers={[]}
      />
    );
    expect(screen.getByTestId("gm-approve-quest")).toBeInTheDocument();
    expect(screen.getByTestId("gm-deny-quest")).toBeInTheDocument();
  });

  it("should display cancel button for PENDING quest in GM view", () => {
    const onCancel = jest.fn();
    render(
      <QuestCard
        quest={createMockQuest({ status: "PENDING" })}
        viewMode="gm"
        onCancel={onCancel}
        familyMembers={[]}
      />
    );
    expect(screen.getByTestId("gm-cancel-quest")).toBeInTheDocument();
  });
});
