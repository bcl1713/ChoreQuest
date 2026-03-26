import React from "react";
import { render, waitFor, screen, act } from "@testing-library/react";
import QuestDashboard from "../quests/quest-dashboard";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import { supabase } from "@/lib/supabase";

jest.mock("@/lib/auth-context");
jest.mock("@/lib/realtime-context");
jest.mock("@/lib/character-context", () => ({
  useCharacter: jest.fn(() => ({
    character: null,
    isLoading: false,
    error: null,
    hasLoaded: true,
    refreshCharacter: jest.fn(),
    levelUpEvent: null,
    clearLevelUpEvent: jest.fn(),
  })),
}));
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    removeChannel: jest.fn(),
  },
}));
jest.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRealtime = useRealtime as jest.MockedFunction<typeof useRealtime>;

interface RealtimeEvent {
  type: string;
  table: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  record: Record<string, unknown>;
  old_record?: Record<string, unknown>;
}

describe("QuestDashboard - Realtime DELETE deduplication", () => {
  let onQuestUpdateCallbacks: ((event: RealtimeEvent) => void)[] = [];

  const broadcastQuestUpdate = (event: RealtimeEvent) => {
    onQuestUpdateCallbacks.forEach((cb) => cb(event));
  };

  const mockUser = { id: "user-123", email: "gm@test.com" };
  const mockProfile = {
    id: "user-123",
    name: "Guild Master",
    family_id: "family-456",
    role: "GUILD_MASTER" as const,
  };
  const mockQuest = {
    id: "quest-789",
    title: "Test Quest",
    description: "Test Description",
    difficulty: "EASY" as const,
    xp_reward: 100,
    gold_reward: 50,
    status: "PENDING" as const,
    quest_type: "INDIVIDUAL" as const,
    family_id: "family-456",
    assigned_to_id: "user-123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    onQuestUpdateCallbacks = [];

    mockUseAuth.mockReturnValue({
      user: mockUser,
      session: { access_token: "fake-token" } as unknown as Parameters<
        typeof mockUseAuth
      >[0]["session"],
      profile: mockProfile,
      loading: false,
      signOut: jest.fn(),
      signInWithPassword: jest.fn(),
      signUpWithPassword: jest.fn(),
    });

    mockUseRealtime.mockReturnValue({
      isConnected: true,
      connectionError: null,
      onQuestUpdate: jest.fn((callback) => {
        onQuestUpdateCallbacks.push(callback);
        return jest.fn();
      }),
      onQuestTemplateUpdate: jest.fn(() => jest.fn()),
      onCharacterUpdate: jest.fn(() => jest.fn()),
      onRewardUpdate: jest.fn(() => jest.fn()),
      onRewardRedemptionUpdate: jest.fn(() => jest.fn()),
      onFamilyMemberUpdate: jest.fn(() => jest.fn()),
      onBossQuestUpdate: jest.fn(() => jest.fn()),
      onBossParticipantUpdate: jest.fn(() => jest.fn()),
      refreshQuests: jest.fn(),
      refreshQuestTemplates: jest.fn(),
      refreshCharacters: jest.fn(),
      refreshRewards: jest.fn(),
    });
  });

  it("should deduplicate quests after DELETE event", async () => {
    const mockSingle = jest
      .fn()
      .mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    const mockOrder = jest
      .fn()
      .mockResolvedValue({ data: [mockQuest, { ...mockQuest }], error: null });
    const mockIn = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockEq = jest
      .fn()
      .mockReturnValue({ single: mockSingle, order: mockOrder, in: mockIn });
    const mockSelect = jest.fn().mockReturnValue({
      eq: mockEq,
      in: mockIn,
      order: mockOrder,
      single: mockSingle,
    });
    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      in: mockIn,
      single: mockSingle,
    });

    render(<QuestDashboard onError={jest.fn()} />);

    await waitFor(() => {
      expect(screen.queryAllByText("Test Quest").length).toBe(1);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    act(() => {
      broadcastQuestUpdate({
        type: "quest_updated",
        table: "quest_instances",
        action: "DELETE",
        record: {},
        old_record: { id: "quest-789" },
      });
    });

    await waitFor(() => {
      expect(screen.queryByText("Test Quest")).not.toBeInTheDocument();
    });
  });
});
