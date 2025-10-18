/**
 * Unit tests for Quest Interaction Buttons - Core MVP Feature
 *
 * These tests verify that the QuestDashboard component renders the correct
 * interaction buttons for unassigned quests based on user roles.
 *
 * THESE TESTS WILL FAIL until the quest pickup/management features are implemented.
 */



import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import QuestDashboard from "../../components/quest-dashboard";
import React from "react";
import { useAuth } from "../../lib/auth-context";
import { useRealtime } from "../../lib/realtime-context";
import { questInstanceApiService } from "../../lib/quest-instance-api-service";
import { supabase } from "../../lib/supabase";
import { useFamilyMembers } from "../../hooks/useFamilyMembers";
import { useCharacter } from "../../hooks/useCharacter";
import { useQuests } from "../../hooks/useQuests";

jest.mock("../../lib/streak-service", () => ({
  streakService: {
    getStreaksForCharacter: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock("../../lib/auth-context");
jest.mock("../../lib/realtime-context");
jest.mock("../../lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));
jest.mock("../../lib/quest-instance-api-service", () => ({
  questInstanceApiService: {
    claimQuest: jest.fn().mockResolvedValue(undefined),
    releaseQuest: jest.fn().mockResolvedValue(undefined),
    approveQuest: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock custom hooks
jest.mock("../../hooks/useFamilyMembers");
jest.mock("../../hooks/useCharacter");
jest.mock("../../hooks/useQuests");

describe("Quest Interaction Buttons - Core MVP Feature", () => {
  const mockHeroUser = {
    id: "hero-123",
    email: "hero@test.com",
  };

  const mockGMUser = {
    id: "gm-123",
    email: "gm@test.com",
  };

  const mockUnassignedQuest = {
    id: "quest-123",
    title: "Clean the Kitchen",
    description: "Deep clean kitchen counters and dishes",
    status: "PENDING",
    difficulty: "MEDIUM",
    xp_reward: 50,
    gold_reward: 25,
    assigned_to_id: null, // This makes it unassigned
    template_id: null, // For one-time quests
    recurrence_pattern: null,
    due_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockCompletedQuest = {
    id: "quest-789",
    title: "Tidy the Living Room",
    description: "Reset the living room before dinner",
    status: "COMPLETED",
    difficulty: "EASY",
    xp_reward: 40,
    gold_reward: 15,
    assigned_to_id: "hero-123",
    template_id: "template-001",
    quest_type: "FAMILY",
    volunteered_by: "char-123",
    volunteer_bonus: 0.2,
    streak_bonus: 0.02,
    streak_count: 3,
    recurrence_pattern: "DAILY",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  type QuestInstanceMock = typeof mockUnassignedQuest | typeof mockCompletedQuest;

  let questInstancesMock: QuestInstanceMock[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    questInstancesMock = [mockUnassignedQuest];

    (useAuth as jest.Mock).mockReturnValue({
      user: mockHeroUser,
      session: { user: { id: mockHeroUser.id } },
      profile: {
        id: mockHeroUser.id,
        family_id: "00000000-0000-4000-8000-000000000001",
        name: "Hero Player",
        role: "HERO"
      },
    });

    (useRealtime as jest.Mock).mockReturnValue({
      onQuestUpdate: jest.fn(),
    });

    // Mock custom hooks
    (useFamilyMembers as jest.Mock).mockReturnValue({
      familyMembers: [],
      familyCharacters: [],
      loading: false,
      error: null,
      reload: jest.fn(),
    });

    (useCharacter as jest.Mock).mockReturnValue({
      character: { id: 'char-123', user_id: 'hero-123' },
      loading: false,
      error: null,
      reload: jest.fn(),
    });

    (useQuests as jest.Mock).mockReturnValue({
      quests: questInstancesMock,
      loading: false,
      error: null,
      reload: jest.fn(),
    });

    (supabase.from as jest.Mock).mockImplementation((tableName) => {
      if (tableName === 'characters') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: 'char-123', user_id: 'hero-123' }, error: null }),
        };
      }
      if (tableName === 'user_profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (tableName === 'quest_instances') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: questInstancesMock, error: null }),
        };
      }
      return supabase;
    });
  });

  test("Hero user sees Pick Up Quest button on unassigned quests", async () => {
    render(<QuestDashboard onError={jest.fn()} />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("available-quests-heading")).toBeInTheDocument();
    });

    expect(screen.getByText("Clean the Kitchen")).toBeInTheDocument();
    const questCard = screen.getByText("Clean the Kitchen").closest(".fantasy-card");
    expect(within(questCard).getByText("Pick Up Quest")).toBeInTheDocument();
  });

  test("Guild Master sees both Pick Up and Management controls on unassigned quests", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockGMUser,
      session: { user: { id: mockGMUser.id } },
      profile: {
        id: mockGMUser.id,
        family_id: "00000000-0000-4000-8000-000000000001",
        name: "Guild Master",
        role: "GUILD_MASTER"
      },
    });

    render(<QuestDashboard onError={jest.fn()} />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("available-quests-heading")).toBeInTheDocument();
    });

    expect(screen.getByText("Clean the Kitchen")).toBeInTheDocument();

    const questCard = screen.getByText("Clean the Kitchen").closest(".fantasy-card");
    expect(within(questCard).getByText("Pick Up Quest")).toBeInTheDocument();
    expect(within(questCard).getByTestId("assign-quest-dropdown")).toBeInTheDocument();
    expect(within(questCard).getByText("Cancel Quest")).toBeInTheDocument();
  });

  test("Guild Master can approve completed quests", async () => {
    questInstancesMock = [mockCompletedQuest];

    (useAuth as jest.Mock).mockReturnValue({
      user: mockGMUser,
      session: { user: { id: mockGMUser.id } },
      profile: {
        id: mockGMUser.id,
        family_id: "00000000-0000-4000-8000-000000000001",
        name: "Guild Master",
        role: "GUILD_MASTER"
      },
    });

    // Update the quests hook to return the completed quest
    (useQuests as jest.Mock).mockReturnValue({
      quests: questInstancesMock,
      loading: false,
      error: null,
      reload: jest.fn(),
    });

    render(<QuestDashboard onError={jest.fn()} />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    const approveButton = await screen.findByRole("button", { name: /approve quest/i });
    expect(approveButton).toBeInTheDocument();

    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(questInstanceApiService.approveQuest).toHaveBeenCalledWith(mockCompletedQuest.id);
    });
  });

  test("Unassigned quests display without interaction buttons when no user", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      session: null,
      profile: null,
    });

    // When no user, hooks return empty data
    (useFamilyMembers as jest.Mock).mockReturnValue({
      familyMembers: [],
      familyCharacters: [],
      loading: false,
      error: null,
      reload: jest.fn(),
    });

    (useCharacter as jest.Mock).mockReturnValue({
      character: null,
      loading: false,
      error: null,
      reload: jest.fn(),
    });

    (useQuests as jest.Mock).mockReturnValue({
      quests: [],
      loading: false,
      error: null,
      reload: jest.fn(),
    });

    render(<QuestDashboard onError={jest.fn()} />);

    // Dashboard should render with no quests
    await waitFor(() => {
      expect(screen.getByText("You have no active quests right now.")).toBeInTheDocument();
    });
  });
});
