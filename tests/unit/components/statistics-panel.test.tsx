/**
 * Unit tests for StatisticsPanel component
 * Tests rendering, data display, and real-time updates
 */

import { render, screen, waitFor } from "@testing-library/react";

// Mock framer-motion BEFORE importing component
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
    tr: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <tr {...props}>{children}</tr>,
  },
}));

// Mock realtime context
const mockOnQuestUpdate = jest.fn(() => jest.fn());
const mockOnRewardRedemptionUpdate = jest.fn(() => jest.fn());
const mockOnCharacterUpdate = jest.fn(() => jest.fn());

jest.mock("@/lib/realtime-context", () => ({
  useRealtime: () => ({
    onQuestUpdate: mockOnQuestUpdate,
    onRewardRedemptionUpdate: mockOnRewardRedemptionUpdate,
    onCharacterUpdate: mockOnCharacterUpdate,
  }),
}));

// Mock auth context
jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    profile: {
      id: "user-1",
      family_id: "family-123",
      role: "GUILD_MASTER",
    },
  }),
}));

// Mock StatisticsService BEFORE importing component
jest.mock("@/lib/statistics-service", () => {
  // Create the mock function inside the factory
  const mockFn = jest.fn();
  return {
    StatisticsService: jest.fn().mockImplementation(() => ({
      getFamilyStatistics: mockFn,
    })),
    FamilyStatistics: {} as Record<string, unknown>, // Type export
  };
});

// NOW import the component (after all mocks are set up)
import StatisticsPanel from "@/components/admin/statistics-panel";
import { StatisticsService } from "@/lib/statistics-service";

describe("StatisticsPanel", () => {
  const mockStatistics = {
    questsCompletedThisWeek: 10,
    questsCompletedLastWeek: 8,
    questsCompletedThisMonth: 35,
    questsCompletedLastMonth: 30,
    totalGoldEarned: 5000,
    totalXpEarned: 12000,
    totalGemsEarned: 200,
    totalHonorEarned: 80,
    pendingQuestApprovals: 2,
    pendingRewardRedemptions: 3,
    rewardRedemptionsThisWeek: 4,
    rewardRedemptionsThisMonth: 12,
    characterProgress: [
      {
        userId: "user-1",
        characterName: "Alice the Knight",
        displayName: "Alice",
        level: 5,
        xp: 1200,
        gold: 500,
        gems: 25,
        honor: 12,
        questsCompleted: 10,
        completionRate: 80,
      },
      {
        userId: "user-2",
        characterName: "Bob the Mage",
        displayName: "Bob",
        level: 3,
        xp: 600,
        gold: 300,
        gems: 15,
        honor: 9,
        questsCompleted: 5,
        completionRate: 60,
      },
    ],
    mostActiveMember: {
      userId: "user-1",
      characterName: "Alice the Knight",
      displayName: "Alice",
      questsCompleted: 10,
    },
    bossBattleSummary: {
      battlesThisWeek: 2,
      battlesThisMonth: 5,
      topParticipantWeek: {
        userId: "user-1",
        displayName: "Alice",
        characterName: "Alice the Knight",
        participationScore: 1,
        totalXp: 300,
        totalGold: 150,
      },
      topParticipantMonth: {
        userId: "user-2",
        displayName: "Bob",
        characterName: "Bob the Mage",
        participationScore: 1.5,
        totalXp: 420,
        totalGold: 180,
      },
    },
  };

  beforeEach(() => {
    // Get the mock function from the mocked service instance
    const MockedService = StatisticsService as jest.MockedClass<typeof StatisticsService>;
    const serviceInstance = new MockedService();
    const getFamilyStatisticsMock = serviceInstance.getFamilyStatistics as jest.Mock;

    // Reset and configure mock before each test
    getFamilyStatisticsMock.mockReset();
    getFamilyStatisticsMock.mockResolvedValue(mockStatistics);

    mockOnQuestUpdate.mockClear().mockReturnValue(jest.fn());
    mockOnRewardRedemptionUpdate.mockClear().mockReturnValue(jest.fn());
    mockOnCharacterUpdate.mockClear().mockReturnValue(jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render loading state initially", () => {
    render(<StatisticsPanel />);
    const skeletons = screen.getAllByRole("generic").filter((el) =>
      el.className.includes("animate-pulse")
    );
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should call getFamilyStatistics on mount", async () => {
    render(<StatisticsPanel />);

    await waitFor(() => {
      const MockedService = StatisticsService as jest.MockedClass<typeof StatisticsService>;
      const serviceInstance = new MockedService();
      const getFamilyStatisticsMock = serviceInstance.getFamilyStatistics as jest.Mock;
      expect(getFamilyStatisticsMock).toHaveBeenCalledWith("family-123");
    });
  });

  it("should subscribe to realtime updates on mount", () => {
    render(<StatisticsPanel />);

    expect(mockOnQuestUpdate).toHaveBeenCalled();
    expect(mockOnRewardRedemptionUpdate).toHaveBeenCalled();
    expect(mockOnCharacterUpdate).toHaveBeenCalled();
  });

  it("should display statistics headings after loading", async () => {
    render(<StatisticsPanel />);

    await waitFor(() => {
      expect(screen.getByText("Family Statistics")).toBeInTheDocument();
      expect(screen.getByText("Family Totals")).toBeInTheDocument();
      expect(screen.getByText("Character Progress")).toBeInTheDocument();
    });
  });

  it("should display quest statistics", async () => {
    render(<StatisticsPanel />);

    await waitFor(() => {
      expect(screen.getByText("Quests This Week")).toBeInTheDocument();
      expect(screen.getByText("Quests This Month")).toBeInTheDocument();
      expect(screen.getByText("Pending Approvals")).toBeInTheDocument();
    });
  });

  it("should display family totals", async () => {
    render(<StatisticsPanel />);

    await waitFor(() => {
      expect(screen.getByText("Total Gold")).toBeInTheDocument();
      expect(screen.getByText("Total XP")).toBeInTheDocument();
    });
  });

  it("should display boss battle summary", async () => {
    render(<StatisticsPanel />);

    await waitFor(() => {
      expect(screen.getByText("Boss Battles")).toBeInTheDocument();
      expect(screen.getByText("Battles This Week")).toBeInTheDocument();
      expect(screen.getByText("Battles This Month")).toBeInTheDocument();
      expect(screen.getByText(/Top Participant \(This Week\)/)).toBeInTheDocument();
    });
  });

  it("should display gems and honor in character progress", async () => {
    render(<StatisticsPanel />);

    await waitFor(() => {
      expect(screen.getByText("Gems")).toBeInTheDocument();
      expect(screen.getByText("Honor")).toBeInTheDocument();
    });
  });

  it("should display character progress table", async () => {
    render(<StatisticsPanel />);

    await waitFor(() => {
      const aliceElements = screen.getAllByText("Alice the Knight");
      const bobElements = screen.getAllByText("Bob the Mage");
      expect(aliceElements.length).toBeGreaterThan(0);
      expect(bobElements.length).toBeGreaterThan(0);
    });
  });

  it("should display most active member", async () => {
    render(<StatisticsPanel />);

    await waitFor(() => {
      expect(screen.getByText("Most Active Member")).toBeInTheDocument();
    });
  });

  it("should handle error state", async () => {
    const MockedService = StatisticsService as jest.MockedClass<typeof StatisticsService>;
    const serviceInstance = new MockedService();
    const getFamilyStatisticsMock = serviceInstance.getFamilyStatistics as jest.Mock;
    getFamilyStatisticsMock.mockRejectedValue(new Error("Test error"));

    render(<StatisticsPanel />);

    await waitFor(
      () => {
        expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("should handle empty character progress", async () => {
    const MockedService = StatisticsService as jest.MockedClass<typeof StatisticsService>;
    const serviceInstance = new MockedService();
    const getFamilyStatisticsMock = serviceInstance.getFamilyStatistics as jest.Mock;
    getFamilyStatisticsMock.mockResolvedValue({
      ...mockStatistics,
      characterProgress: [],
      mostActiveMember: null,
    });

    render(<StatisticsPanel />);

    await waitFor(() => {
      expect(screen.getByText("No family members yet")).toBeInTheDocument();
    });
  });

  it("should unsubscribe from updates on unmount", () => {
    const unsubQuest = jest.fn();
    const unsubRedemption = jest.fn();
    const unsubCharacter = jest.fn();

    mockOnQuestUpdate.mockReturnValue(unsubQuest);
    mockOnRewardRedemptionUpdate.mockReturnValue(unsubRedemption);
    mockOnCharacterUpdate.mockReturnValue(unsubCharacter);

    const { unmount } = render(<StatisticsPanel />);
    unmount();

    expect(unsubQuest).toHaveBeenCalled();
    expect(unsubRedemption).toHaveBeenCalled();
    expect(unsubCharacter).toHaveBeenCalled();
  });
});
