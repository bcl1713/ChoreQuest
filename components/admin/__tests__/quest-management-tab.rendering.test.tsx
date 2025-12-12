import { render, screen } from "@testing-library/react";
import { QuestStatus } from "@/lib/types/database";
import { QuestManagementTab } from "../quest-management-tab";
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

      expect(screen.getByTestId("quest-card-quest-1")).toHaveAttribute("data-view-mode", "gm");
    });

    it("shows correct count for each section", () => {
      const quests = [
        createMockQuest({ id: "quest-1", status: "COMPLETED" as QuestStatus }),
        createMockQuest({ id: "quest-2", status: "PENDING" as QuestStatus, assigned_to_id: null }),
        createMockQuest({ id: "quest-3", status: "IN_PROGRESS" as QuestStatus, assigned_to_id: "user-1" }),
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
      expect(screen.getByTestId("quest-card-quest-pending")).toBeInTheDocument();
      expect(screen.getByTestId("quest-card-quest-unassigned")).toBeInTheDocument();
      expect(screen.getByTestId("quest-card-quest-inprogress")).toBeInTheDocument();
    });
  });

  afterEach(() => {
    mockUseQuests.mockReset();
    mockUseFamilyMembers.mockReset();
    mockUseAuth.mockReset();
  });
});
