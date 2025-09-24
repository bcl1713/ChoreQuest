/**
 * Unit tests for Quest Interaction Buttons - Core MVP Feature
 *
 * These tests verify that the QuestDashboard component renders the correct
 * interaction buttons for unassigned quests based on user roles.
 *
 * THESE TESTS WILL FAIL until the quest pickup/management features are implemented.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import QuestDashboard from "../../components/quest-dashboard";
import { questService } from "@/lib/quest-service";
import { userService } from "@/lib/user-service";

// Mock the auth context
const mockUseAuth = jest.fn();
jest.mock("../../lib/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock the quest service
jest.mock("@/lib/quest-service", () => ({
  questService: {
    getQuestInstances: jest.fn(),
    updateQuestStatus: jest.fn(),
    assignQuest: jest.fn(),
    cancelQuest: jest.fn(),
  },
}));

// Mock the user service
jest.mock("@/lib/user-service", () => ({
  userService: {
    getFamilyMembers: jest.fn(),
  },
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
  },
}));

describe("Quest Interaction Buttons - Core MVP Feature", () => {
  const mockHeroUser = {
    id: "hero-123",
    email: "hero@test.com",
    role: "HERO",
    userName: "Hero Player",
  };

  const mockGMUser = {
    id: "gm-123",
    email: "gm@test.com",
    role: "GUILD_MASTER",
    userName: "Guild Master",
  };

  const mockUnassignedQuest = {
    id: "quest-123",
    title: "Clean the Kitchen",
    description: "Deep clean kitchen counters and dishes",
    status: "PENDING",
    difficulty: "MEDIUM",
    xpReward: 50,
    goldReward: 25,
    assignedToId: null, // This makes it unassigned
    dueDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (
      questService.getQuestInstances as jest.Mock as jest.Mock
    ).mockResolvedValue({
      instances: [mockUnassignedQuest],
    });
    (userService.getFamilyMembers as jest.Mock).mockResolvedValue([]);
  });

  test("Hero user sees Pick Up Quest button on unassigned quests", async () => {
    mockUseAuth.mockReturnValue({
      user: mockHeroUser,
      token: "mock-token",
    });

    render(<QuestDashboard onError={jest.fn()} />);

    // Wait for quest data to load
    await waitFor(() => {
      expect(questService.getQuestInstances as jest.Mock).toHaveBeenCalled();
    });

    // Verify Available Quests section appears
    await waitFor(() => {
      expect(screen.getByText("📋 Available Quests")).toBeInTheDocument();
    });

    // Verify unassigned quest appears
    expect(screen.getByText("Clean the Kitchen")).toBeInTheDocument();

    // Pick Up Quest button should exist
    const pickUpButton = screen.getByText("Pick Up Quest");
    expect(pickUpButton).toBeInTheDocument();

    // Test button click functionality
    fireEvent.click(pickUpButton);

    // Verify quest assignment API call
    await waitFor(() => {
      expect(questService.assignQuest as jest.Mock).toHaveBeenCalledWith(
        "quest-123",
        "hero-123",
      );
    });
  });

  test("Guild Master sees both Pick Up and Management controls on unassigned quests", async () => {
    // Mock family members for dropdown
    (userService.getFamilyMembers as jest.Mock).mockResolvedValue([
      { id: "hero-123", userName: "Hero Player", characterName: "Test Hero" },
      {
        id: "hero-456",
        userName: "Another Hero",
        characterName: "Second Hero",
      },
    ]);

    mockUseAuth.mockReturnValue({
      user: mockGMUser,
      token: "mock-token",
    });

    render(<QuestDashboard onError={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("📋 Available Quests")).toBeInTheDocument();
    });

    expect(screen.getByText("Clean the Kitchen")).toBeInTheDocument();

    // GM controls should exist
    expect(screen.getByText("Pick Up Quest")).toBeInTheDocument();

    const assignDropdown = screen.getByTestId("assign-quest-dropdown");
    expect(assignDropdown).toBeInTheDocument();

    expect(screen.getByText("Cancel Quest")).toBeInTheDocument();

    // Test assignment functionality
    fireEvent.change(assignDropdown, { target: { value: "hero-123" } });
    const assignButton = screen.getByText("Assign");
    fireEvent.click(assignButton);

    await waitFor(() => {
      expect(questService.assignQuest as jest.Mock).toHaveBeenCalledWith(
        "quest-123",
        "hero-123",
      );
    });

    // Test cancellation functionality with window.confirm
    const cancelButton = screen.getByText("Cancel Quest");

    // Mock confirm to return true for this test
    (global.confirm as jest.Mock).mockReturnValueOnce(true);

    fireEvent.click(cancelButton);

    // Verify confirm was called with the right message
    expect(global.confirm).toHaveBeenCalledWith(
      "Are you sure you want to cancel this quest?",
    );

    await waitFor(() => {
      expect(questService.cancelQuest as jest.Mock).toHaveBeenCalledWith(
        "quest-123",
      );
    });
  });

  test("Unassigned quests display without interaction buttons when no user", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
    });

    render(<QuestDashboard onError={jest.fn()} />);

    // Should show error state for no user
    await waitFor(() => {
      expect(screen.getByText(/User not authenticated/)).toBeInTheDocument();
    });
  });

  test("Quest pickup updates quest list and moves quest to My Quests section", async () => {
    const assignedQuest = {
      ...mockUnassignedQuest,
      assignedToId: "hero-123",
      status: "IN_PROGRESS",
    };

    mockUseAuth.mockReturnValue({
      user: mockHeroUser,
      token: "mock-token",
    });

    // Mock the quest service to return updated data after assignment
    (questService.getQuestInstances as jest.Mock)
      .mockResolvedValueOnce({ instances: [mockUnassignedQuest] }) // Initial load
      .mockResolvedValue({ instances: [assignedQuest] }); // After pickup and any subsequent calls

    (questService.assignQuest as jest.Mock).mockResolvedValue({
      success: true,
    });

    render(<QuestDashboard onError={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("📋 Available Quests")).toBeInTheDocument();
    });

    const pickUpButton = screen.getByText("Pick Up Quest");
    fireEvent.click(pickUpButton);

    // After pickup, wait for the quest to appear in My Quests section
    await waitFor(() => {
      const myQuestsSection = screen
        .getByText("🗡️ My Quests")
        .closest("section");
      expect(myQuestsSection).toHaveTextContent("Clean the Kitchen");
    });

    // Quest should no longer be in Available Quests (section may not exist if no quests available)
    const availableQuestsSection = screen.queryByText("📋 Available Quests");
    if (availableQuestsSection) {
      expect(availableQuestsSection.closest("section")).not.toHaveTextContent(
        "Clean the Kitchen",
      );
    }
  });

  test("Role-based button visibility is correctly implemented", async () => {
    // Test Hero role first
    mockUseAuth.mockReturnValue({
      user: mockHeroUser,
      token: "mock-token",
    });

    // Reset quest service mock to return unassigned quest
    (questService.getQuestInstances as jest.Mock).mockResolvedValue({
      instances: [mockUnassignedQuest],
    });

    const { rerender } = render(<QuestDashboard onError={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Clean the Kitchen")).toBeInTheDocument();
    });

    // Hero should see only pickup button
    expect(screen.getByText("Pick Up Quest")).toBeInTheDocument();
    expect(
      screen.queryByTestId("assign-quest-dropdown"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Cancel Quest")).not.toBeInTheDocument();

    // Test GM role
    mockUseAuth.mockReturnValue({
      user: mockGMUser,
      token: "mock-token",
    });

    // Mock family members for GM dropdown
    (userService.getFamilyMembers as jest.Mock).mockResolvedValue([
      { id: "hero-123", userName: "Hero Player", characterName: "Test Hero" },
    ]);

    rerender(<QuestDashboard onError={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Clean the Kitchen")).toBeInTheDocument();
    });

    // GM should see ALL interaction options
    expect(screen.getByText("Pick Up Quest")).toBeInTheDocument();
    expect(screen.getByTestId("assign-quest-dropdown")).toBeInTheDocument();
    expect(screen.getByText("Cancel Quest")).toBeInTheDocument();
  });
});

