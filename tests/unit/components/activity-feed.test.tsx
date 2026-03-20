import { render, screen, waitFor, fireEvent } from "@testing-library/react";
jest.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
const mockOnQuestUpdate = jest.fn(() => jest.fn());
const mockOnRewardRedemptionUpdate = jest.fn(() => jest.fn());
const mockOnCharacterUpdate = jest.fn(() => jest.fn());
const mockOnBossQuestUpdate = jest.fn(() => jest.fn());
const mockOnBossParticipantUpdate = jest.fn(() => jest.fn());
jest.mock("@/lib/realtime-context", () => ({
  useRealtime: () => ({
    onQuestUpdate: mockOnQuestUpdate,
    onRewardRedemptionUpdate: mockOnRewardRedemptionUpdate,
    onCharacterUpdate: mockOnCharacterUpdate,
    onBossQuestUpdate: mockOnBossQuestUpdate,
    onBossParticipantUpdate: mockOnBossParticipantUpdate,
  }),
}));
jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    profile: {
      id: "user-1",
      family_id: "family-123",
      role: "GUILD_MASTER",
    },
  }),
}));
jest.mock("@/lib/activity-service", () => {
  const mockFn = jest.fn();
  return {
    ActivityService: jest.fn().mockImplementation(() => ({
      getRecentActivity: mockFn,
    })),
    ActivityEvent: {} as Record<string, unknown>,
    ActivityEventType: {} as Record<string, unknown>,
  };
});
import ActivityFeed from "@/components/admin/activity-feed";
import { ActivityService } from "@/lib/activity-service";

const getActivityMock = () => {
  const MockedService = ActivityService as jest.MockedClass<
    typeof ActivityService
  >;
  return new MockedService().getRecentActivity as jest.Mock;
};

describe("ActivityFeed", () => {
  const mockEvents = [
    {
      id: "event-1",
      type: "QUEST_COMPLETED" as const,
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      characterName: "Alice the Knight",
      displayName: "Alice",
      userId: "user-1",
      questTitle: "Clean the kitchen",
      questId: "quest-1",
    },
    {
      id: "event-2",
      type: "QUEST_SUBMITTED" as const,
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      characterName: "Bob the Mage",
      displayName: "Bob",
      userId: "user-2",
      questTitle: "Do homework",
      questId: "quest-2",
    },
    {
      id: "event-3",
      type: "REWARD_REDEEMED" as const,
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      characterName: "Alice the Knight",
      displayName: "Alice",
      userId: "user-1",
      rewardName: "Ice Cream",
      redemptionId: "redemption-1",
    },
    {
      id: "event-4",
      type: "REWARD_APPROVED" as const,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      characterName: "Bob the Mage",
      displayName: "Bob",
      userId: "user-2",
      rewardName: "Movie Night",
      redemptionId: "redemption-2",
    },
    {
      id: "event-5",
      type: "CHARACTER_CREATED" as const,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      characterName: "Carol the Rogue",
      displayName: "Carol",
      userId: "user-3",
    },
  ];
  beforeEach(() => {
    const getRecentActivityMock = getActivityMock();
    getRecentActivityMock.mockReset();
    getRecentActivityMock.mockResolvedValue(mockEvents);
    mockOnQuestUpdate.mockClear().mockReturnValue(jest.fn());
    mockOnRewardRedemptionUpdate.mockClear().mockReturnValue(jest.fn());
    mockOnCharacterUpdate.mockClear().mockReturnValue(jest.fn());
    if ((window as Window & typeof globalThis).location) {
      (window as Window & typeof globalThis).location.href = "";
    }
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should render loading state initially", () => {
    render(<ActivityFeed />);
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    const skeletons = screen
      .getAllByRole("generic")
      .filter((el) => el.className.includes("animate-pulse"));
    expect(skeletons.length).toBeGreaterThan(0);
  });
  it("should call getRecentActivity on mount", async () => {
    render(<ActivityFeed />);
    await waitFor(() => {
      const MockedService = ActivityService as jest.MockedClass<
        typeof ActivityService
      >;
      const serviceInstance = new MockedService();
      const getRecentActivityMock =
        serviceInstance.getRecentActivity as jest.Mock;
      expect(getRecentActivityMock).toHaveBeenCalledWith("family-123", 50);
    });
  });
  it("should subscribe to realtime updates on mount", () => {
    render(<ActivityFeed />);
    expect(mockOnQuestUpdate).toHaveBeenCalled();
    expect(mockOnRewardRedemptionUpdate).toHaveBeenCalled();
    expect(mockOnCharacterUpdate).toHaveBeenCalled();
  });
  it("should display event list after loading", async () => {
    render(<ActivityFeed />);
    await waitFor(() => {
      const aliceElements = screen.getAllByText("Alice the Knight");
      const bobElements = screen.getAllByText("Bob the Mage");
      const carolElements = screen.getAllByText("Carol the Rogue");
      expect(aliceElements.length).toBeGreaterThan(0);
      expect(bobElements.length).toBeGreaterThan(0);
      expect(carolElements.length).toBeGreaterThan(0);
    });
  });
  it("should display quest completed events correctly", async () => {
    render(<ActivityFeed />);
    await waitFor(() => {
      expect(
        screen.getByText(/completed quest "Clean the kitchen"/i),
      ).toBeInTheDocument();
    });
  });
  it("should display quest submitted events correctly", async () => {
    render(<ActivityFeed />);
    await waitFor(() => {
      expect(
        screen.getByText(/submitted quest "Do homework" for approval/i),
      ).toBeInTheDocument();
    });
  });
  it("should display reward redeemed events correctly", async () => {
    render(<ActivityFeed />);
    await waitFor(() => {
      expect(
        screen.getByText(/redeemed reward "Ice Cream"/i),
      ).toBeInTheDocument();
    });
  });
  it("should display reward approved events correctly", async () => {
    render(<ActivityFeed />);
    await waitFor(() => {
      expect(
        screen.getByText(/reward "Movie Night" was approved/i),
      ).toBeInTheDocument();
    });
  });
  it("should display character created events correctly", async () => {
    render(<ActivityFeed />);
    await waitFor(() => {
      expect(screen.getByText(/joined the family/i)).toBeInTheDocument();
    });
  });
  it("should display relative timestamps correctly", async () => {
    render(<ActivityFeed />);
    await waitFor(() => {
      expect(screen.getByText(/5 minutes ago/i)).toBeInTheDocument();
      expect(screen.getByText(/10 minutes ago/i)).toBeInTheDocument();
      expect(screen.getByText(/30 minutes ago/i)).toBeInTheDocument();
      expect(screen.getByText(/2 hours ago/i)).toBeInTheDocument();
      expect(screen.getByText(/1 day ago/i)).toBeInTheDocument();
    });
  });
  it("should display event count", async () => {
    render(<ActivityFeed />);
    await waitFor(() => {
      expect(screen.getByText(/Showing 5 recent events/i)).toBeInTheDocument();
    });
  });
  it("should display clickable Review button for submitted quests", async () => {
    render(<ActivityFeed />);
    await waitFor(() => {
      const reviewButton = screen.getByRole("button", { name: /review/i });
      expect(reviewButton).toBeInTheDocument();
      expect(reviewButton.tagName).toBe("BUTTON");
    });
  });
  it("should display and enable Refresh button", async () => {
    render(<ActivityFeed />);
    await waitFor(() => {
      const refreshButton = screen.getByRole("button", { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();
      expect(refreshButton).not.toBeDisabled();
    });
  });
  it("should refresh activity when Refresh button is clicked", async () => {
    render(<ActivityFeed />);
    await waitFor(() => {
      const mock = getActivityMock();
      mock.mockClear();
      fireEvent.click(screen.getByText("Refresh"));
    });
    await waitFor(() => {
      expect(getActivityMock()).toHaveBeenCalled();
    });
  });
  it("should handle empty events list", async () => {
    const getRecentActivityMock = getActivityMock();
    getRecentActivityMock.mockResolvedValue([]);
    render(<ActivityFeed />);
    await waitFor(() => {
      expect(screen.getByText("No recent activity")).toBeInTheDocument();
      expect(
        screen.getByText(/Complete quests and redeem rewards/i),
      ).toBeInTheDocument();
    });
  });
  it("should handle error state", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const getRecentActivityMock = getActivityMock();
    getRecentActivityMock.mockRejectedValue(new Error("Test error"));
    render(<ActivityFeed />);
    await waitFor(
      () => {
        expect(
          screen.getByText(/Failed to load activity feed/i),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });
  it("should show Retry button in error state", async () => {
    const getRecentActivityMock = getActivityMock();
    getRecentActivityMock.mockRejectedValue(new Error("Test error"));
    render(<ActivityFeed />);
    await waitFor(
      () => {
        expect(screen.getByText("Retry")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });
  it("should unsubscribe from updates on unmount", () => {
    const unsubQuest = jest.fn();
    const unsubRedemption = jest.fn();
    const unsubCharacter = jest.fn();
    mockOnQuestUpdate.mockReturnValue(unsubQuest);
    mockOnRewardRedemptionUpdate.mockReturnValue(unsubRedemption);
    mockOnCharacterUpdate.mockReturnValue(unsubCharacter);
    const { unmount } = render(<ActivityFeed />);
    unmount();
    expect(unsubQuest).toHaveBeenCalled();
    expect(unsubRedemption).toHaveBeenCalled();
    expect(unsubCharacter).toHaveBeenCalled();
  });
});
