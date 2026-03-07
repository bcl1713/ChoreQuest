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

describe("QuestManagementTab - rendering", () => {
  beforeEach(() => {
    resetQuestManagementMocks();
  });

  describe("Loading and error states", () => {
    it("displays loading spinner when loading", () => {
      setupQuestData([], { loading: true });
      setupFamilyMembers([]);
      setupAuthProfile();

      render(<QuestManagementTab />);

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });

    it("displays error message when there is an error", () => {
      setupQuestData([], { error: "Failed to load quests" });
      setupFamilyMembers([]);
      setupAuthProfile();

      render(<QuestManagementTab />);

      expect(screen.getByText("Error Loading Quests")).toBeInTheDocument();
      expect(screen.getByText("Failed to load quests")).toBeInTheDocument();
    });
  });

  describe("Sections and empty states", () => {
    beforeEach(() => {
      setupFamilyMembers([]);
      setupAuthProfile();
    });

    it("renders all three sections", () => {
      setupQuestData([]);

      render(<QuestManagementTab />);

      expect(screen.getByText("Pending Approval")).toBeInTheDocument();
      expect(screen.getByText("Unassigned")).toBeInTheDocument();
      expect(screen.getByText("In Progress")).toBeInTheDocument();
    });

    it.each([
      ["No quests awaiting approval", "pending approval"],
      ["All quests have been assigned", "unassigned"],
      ["No quests currently in progress", "in-progress"],
    ])("shows empty message for %s", (message) => {
      setupQuestData([]);

      render(<QuestManagementTab />);

      expect(screen.getByText(message)).toBeInTheDocument();
    });
  });

  describe("Quest card props and badges", () => {
    beforeEach(() => {
      setupFamilyMembers([createMockFamilyMember({ name: "Alice" })]);
      setupAuthProfile();
    });

    it("passes gm viewMode to QuestCard", () => {
      const quest = createMockQuest({
        id: "quest-1",
        assigned_to_id: "user-1",
        status: "COMPLETED" as QuestStatus,
      });
      setupQuestData([quest]);

      render(<QuestManagementTab />);

      expect(screen.getByTestId("quest-card-quest-1")).toHaveAttribute(
        "data-view-mode",
        "gm",
      );
    });

    it("shows correct count for each section", () => {
      const quests = [
        createMockQuest({ id: "quest-1", status: "COMPLETED" as QuestStatus }),
        createMockQuest({
          id: "quest-2",
          status: "PENDING" as QuestStatus,
          assigned_to_id: null,
        }),
        createMockQuest({
          id: "quest-3",
          status: "IN_PROGRESS" as QuestStatus,
          assigned_to_id: "user-1",
        }),
      ];
      setupQuestData(quests);

      render(<QuestManagementTab />);

      const countBadges = screen.getAllByText("1");
      expect(countBadges.length).toBe(3);
    });
  });

  describe("Integration view", () => {
    it("renders complete tab with mixed quests", () => {
      const quests = [
        createMockQuest({
          id: "quest-pending",
          title: "Pending Approval Quest",
          status: "COMPLETED" as QuestStatus,
          assigned_to_id: "user-1",
        }),
        createMockQuest({
          id: "quest-unassigned",
          title: "Unassigned Quest",
          status: "PENDING" as QuestStatus,
          assigned_to_id: null,
        }),
        createMockQuest({
          id: "quest-inprogress",
          title: "In Progress Quest",
          status: "IN_PROGRESS" as QuestStatus,
          assigned_to_id: "user-1",
        }),
      ];
      setupQuestData(quests);
      setupFamilyMembers([createMockFamilyMember()]);
      setupAuthProfile();

      render(<QuestManagementTab />);

      expect(screen.getByText("Pending Approval")).toBeInTheDocument();
      expect(screen.getByText("Unassigned")).toBeInTheDocument();
      expect(screen.getByText("In Progress")).toBeInTheDocument();
      expect(
        screen.getByTestId("quest-card-quest-pending"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("quest-card-quest-unassigned"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("quest-card-quest-inprogress"),
      ).toBeInTheDocument();
    });
  });

  afterEach(() => {
    mockUseQuests.mockReset();
    mockUseFamilyMembers.mockReset();
    mockUseAuth.mockReset();
  });
});
