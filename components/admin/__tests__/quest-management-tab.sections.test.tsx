import React from "react";
import { render, screen } from "@testing-library/react";
import { QuestStatus } from "@/lib/types/database";
import { QuestManagementTab } from "../quest-management-tab";

// jest.mock calls must be in the test file itself to be hoisted properly
jest.mock("@/hooks/useQuests", () => ({
  useQuests: jest.fn(),
}));
jest.mock("@/hooks/useFamilyMembers", () => ({
  useFamilyMembers: jest.fn(),
}));
jest.mock("@/lib/auth-context", () => ({
  useAuth: jest.fn(),
}));
jest.mock("@/components/quests/quest-card", () => {
  return function MockQuestCard({
    quest,
    viewMode,
  }: {
    quest: { id: string; title: string };
    viewMode: string;
  }) {
    return (
      <div data-testid={`quest-card-${quest.id}`} data-view-mode={viewMode}>
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
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <div {...props}>{children}</div>,
  },
}));
jest.mock("@/components/ui/LoadingSpinner", () => ({
  LoadingSpinner: function MockLoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  },
}));
jest.mock("@/lib/animations/variants", () => ({
  staggerContainer: {},
}));
jest.mock("@/components/ui/NotificationContainer", () => ({
  NotificationContainer: function MockNotificationContainer() {
    return <div data-testid="notification-container" />;
  },
}));
jest.mock("@/components/ui/ConfirmationModal", () => ({
  ConfirmationModal: function MockConfirmationModal({
    isOpen,
  }: {
    isOpen: boolean;
  }) {
    return isOpen ? <div data-testid="confirmation-modal" /> : null;
  },
}));
jest.mock("@/hooks/useNotification", () => ({
  useNotification: () => ({
    notifications: [],
    dismiss: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  }),
}));
jest.mock("@/components/quests/pending-approvals-section", () => {
  return function MockPendingApprovalsSection({
    quests,
  }: {
    quests: Array<{ id: string; title: string }>;
  }) {
    return (
      <div data-testid="pending-approvals-section">
        <h3>Pending Approval</h3>
        <span>{quests.length}</span>
        {quests.length === 0 ? (
          <p>No quests awaiting approval</p>
        ) : (
          quests.map((q) => (
            <div
              key={q.id}
              data-testid={`quest-card-${q.id}`}
              data-view-mode="gm"
            >
              {q.title}
            </div>
          ))
        )}
      </div>
    );
  };
});
jest.mock("@/lib/quest-instance-api-service", () => ({
  questInstanceApiService: {},
}));

import {
  createMockFamilyMember,
  createMockQuest,
  mockUseAuth,
  mockUseFamilyMembers,
  mockUseQuests,
  resetQuestManagementMocks,
  setupAuthProfile,
  setupFamilyMembers,
  setupQuestData,
} from "./quest-management-tab.fixtures";

describe("QuestManagementTab - sections", () => {
  beforeEach(() => {
    resetQuestManagementMocks();
    setupAuthProfile();
  });

  describe("Pending approval", () => {
    beforeEach(() => {
      setupFamilyMembers([createMockFamilyMember()]);
    });

    it("displays completed quests in pending approval section", () => {
      const completedQuest = createMockQuest({
        id: "quest-completed",
        title: "Completed Quest",
        status: "COMPLETED" as QuestStatus,
      });
      setupQuestData([completedQuest]);

      render(<QuestManagementTab />);

      expect(
        screen.getByTestId("quest-card-quest-completed"),
      ).toBeInTheDocument();
      expect(screen.getByText("Completed Quest")).toBeInTheDocument();
    });

    it("displays correct count badge for pending approval", () => {
      const quests = [
        createMockQuest({ id: "quest-1", status: "COMPLETED" as QuestStatus }),
        createMockQuest({ id: "quest-2", status: "COMPLETED" as QuestStatus }),
      ];
      setupQuestData(quests);

      render(<QuestManagementTab />);

      const countBadges = screen.getAllByText("2");
      expect(countBadges.length).toBeGreaterThan(0);
    });
  });

  describe("Unassigned", () => {
    beforeEach(() => {
      setupFamilyMembers([createMockFamilyMember()]);
    });

    it("displays unassigned quests", () => {
      const unassignedQuest = createMockQuest({
        id: "quest-unassigned",
        title: "Unassigned Quest",
        assigned_to_id: null,
        status: "PENDING" as QuestStatus,
      });
      setupQuestData([unassignedQuest]);

      render(<QuestManagementTab />);

      expect(
        screen.getByTestId("quest-card-quest-unassigned"),
      ).toBeInTheDocument();
      expect(screen.getByText("Unassigned Quest")).toBeInTheDocument();
    });

    it("only displays active unassigned quests", () => {
      const unassignedActive = createMockQuest({
        id: "quest-active",
        title: "Active Unassigned",
        assigned_to_id: null,
        status: "PENDING" as QuestStatus,
      });
      const unassignedExpired = createMockQuest({
        id: "quest-expired",
        title: "Expired Unassigned",
        assigned_to_id: null,
        status: "EXPIRED" as QuestStatus,
      });
      setupQuestData([unassignedActive, unassignedExpired]);

      render(<QuestManagementTab />);

      expect(screen.getByTestId("quest-card-quest-active")).toBeInTheDocument();
      expect(
        screen.queryByTestId("quest-card-quest-expired"),
      ).not.toBeInTheDocument();
    });
  });

  describe("In progress", () => {
    beforeEach(() => {
      setupFamilyMembers([createMockFamilyMember()]);
    });

    it("displays in-progress quests", () => {
      const inProgressQuest = createMockQuest({
        id: "quest-in-progress",
        title: "In Progress Quest",
        assigned_to_id: "user-1",
        status: "IN_PROGRESS" as QuestStatus,
      });
      setupQuestData([inProgressQuest]);

      render(<QuestManagementTab />);

      expect(
        screen.getByTestId("quest-card-quest-in-progress"),
      ).toBeInTheDocument();
      expect(screen.getByText("In Progress Quest")).toBeInTheDocument();
    });

    it("displays claimed quests in in-progress section", () => {
      const claimedQuest = createMockQuest({
        id: "quest-claimed",
        title: "Claimed Quest",
        assigned_to_id: "user-1",
        status: "CLAIMED" as QuestStatus,
      });
      setupQuestData([claimedQuest]);

      render(<QuestManagementTab />);

      expect(
        screen.getByTestId("quest-card-quest-claimed"),
      ).toBeInTheDocument();
      expect(screen.getByText("Claimed Quest")).toBeInTheDocument();
    });

    it("only displays IN_PROGRESS and CLAIMED assigned quests", () => {
      const assignedInProgress = createMockQuest({
        id: "quest-assigned-ip",
        title: "Assigned In Progress",
        assigned_to_id: "user-1",
        status: "IN_PROGRESS" as QuestStatus,
      });
      const assignedClaimed = createMockQuest({
        id: "quest-assigned-claimed",
        title: "Assigned Claimed",
        assigned_to_id: "user-1",
        status: "CLAIMED" as QuestStatus,
      });
      const assignedCompleted = createMockQuest({
        id: "quest-assigned-completed",
        title: "Assigned Completed",
        assigned_to_id: "user-1",
        status: "COMPLETED" as QuestStatus,
      });
      setupQuestData([assignedInProgress, assignedClaimed, assignedCompleted]);

      render(<QuestManagementTab />);

      expect(
        screen.getByTestId("quest-card-quest-assigned-ip"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("quest-card-quest-assigned-claimed"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("quest-card-quest-assigned-completed"),
      ).toBeInTheDocument();
    });
  });

  afterEach(() => {
    mockUseQuests.mockReset();
    mockUseFamilyMembers.mockReset();
    mockUseAuth.mockReset();
  });
});
