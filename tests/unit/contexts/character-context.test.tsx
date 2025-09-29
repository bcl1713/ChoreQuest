import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { render, screen, waitFor, act } from "@testing-library/react";
import { CharacterProvider, useCharacter } from "@/lib/character-context";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import { supabase } from "@/lib/supabase";
import type { Character } from "@/lib/types/database";

// Type for realtime events in tests
interface MockRealtimeEvent {
  type: string;
  table: string;
  action: string;
  record?: { user_id?: string; [key: string]: unknown };
  old_record?: { user_id?: string; [key: string]: unknown };
}

// Mock dependencies
const mockUseAuth = jest.fn();
jest.mock("@/lib/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseRealtime = jest.fn();
jest.mock("@/lib/realtime-context", () => ({
  useRealtime: () => mockUseRealtime(),
}));

const mockSupabaseFrom = jest.fn();
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockSupabaseFrom,
  },
}));

// Test component to use the character context
function TestComponent() {
  const { character, isLoading, error, refreshCharacter } = useCharacter();

  return (
    <div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="character-name">{character?.name || 'no-character'}</div>
      <div data-testid="character-xp">{character?.xp || 0}</div>
      <div data-testid="character-gold">{character?.gold || 0}</div>
      <button data-testid="refresh" onClick={refreshCharacter}>Refresh</button>
    </div>
  );
}

describe("CharacterProvider", () => {
  let mockOnCharacterUpdate: jest.Mock;
  let mockUser: { id: string };
  let mockCharacter: Character;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock user
    mockUser = { id: "user-123" };

    // Mock character data
    mockCharacter = {
      id: "char-123",
      user_id: "user-123",
      name: "Test Hero",
      class: "KNIGHT",
      level: 1,
      xp: 100,
      gold: 50,
      gems: 10,
      honor_points: 5,
      avatar_url: null,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    };

    // Mock realtime subscription
    mockOnCharacterUpdate = jest.fn();
    mockOnCharacterUpdate.mockReturnValue(() => {}); // Return unsubscribe function

    // Mock auth context
    mockUseAuth.mockReturnValue({
      user: mockUser,
      profile: null,
      family: null,
      session: null,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      createFamily: jest.fn(),
    });

    // Mock realtime context
    mockUseRealtime.mockReturnValue({
      isConnected: true,
      connectionError: null,
      lastEvent: null,
      onQuestUpdate: jest.fn(),
      onCharacterUpdate: mockOnCharacterUpdate,
      onRewardRedemptionUpdate: jest.fn(),
      onFamilyMemberUpdate: jest.fn(),
      refreshQuests: jest.fn(),
      refreshCharacters: jest.fn(),
      refreshRewards: jest.fn(),
    });

    // Mock supabase character fetch
    const mockSelect = jest.fn();
    const mockEq = jest.fn();
    const mockSingle = jest.fn();

    mockSingle.mockResolvedValue({
      data: mockCharacter,
      error: null,
    });

    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockSupabaseFrom.mockReturnValue({ select: mockSelect });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("realtime subscription integration", () => {
    it("should subscribe to character updates on mount", async () => {
      render(
        <CharacterProvider>
          <TestComponent />
        </CharacterProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("character-name")).toHaveTextContent("Test Hero");
      });

      // **CRITICAL TEST**: Character context should subscribe to realtime updates
      expect(mockOnCharacterUpdate).toHaveBeenCalledTimes(1);
      expect(mockOnCharacterUpdate).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should automatically refresh character data when realtime event received", async () => {
      let realtimeCallback: ((event: MockRealtimeEvent) => void) | undefined;

      // Capture the callback passed to onCharacterUpdate
      mockOnCharacterUpdate.mockImplementation((callback) => {
        realtimeCallback = callback;
        return () => {}; // Return unsubscribe function
      });

      render(
        <CharacterProvider>
          <TestComponent />
        </CharacterProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId("character-name")).toHaveTextContent("Test Hero");
        expect(screen.getByTestId("character-xp")).toHaveTextContent("100");
        expect(screen.getByTestId("character-gold")).toHaveTextContent("50");
      });

      // Verify initial supabase call
      expect(mockSupabaseFrom).toHaveBeenCalledWith("characters");

      // Clear the mock to track subsequent calls
      jest.clearAllMocks();

      // Mock updated character data for the realtime event
      const updatedCharacter = {
        ...mockCharacter,
        xp: 250,  // Increased XP
        gold: 100, // Increased gold
        level: 2,  // Level up
      };

      mockSingle.mockResolvedValue({
        data: updatedCharacter,
        error: null,
      });

      // **CRITICAL TEST**: Simulate realtime character update event
      expect(realtimeCallback).toBeDefined();

      if (realtimeCallback) {
        await act(async () => {
          realtimeCallback({
            type: 'character_updated',
            table: 'characters',
            action: 'UPDATE',
            record: { user_id: mockUser.id, xp: 250, gold: 100, level: 2 },
            old_record: { user_id: mockUser.id, xp: 100, gold: 50, level: 1 },
          });
        });
      }

      // **EXPECTED BEHAVIOR**: Character context should automatically refresh
      // and display updated character stats without manual refresh
      await waitFor(() => {
        expect(screen.getByTestId("character-xp")).toHaveTextContent("250");
        expect(screen.getByTestId("character-gold")).toHaveTextContent("100");
      });

      // Verify that refreshCharacter was called internally due to realtime event
      expect(mockSupabaseFrom).toHaveBeenCalledWith("characters");
    });

    it("should only refresh for events matching current user", async () => {
      let realtimeCallback: ((event: MockRealtimeEvent) => void) | undefined;

      mockOnCharacterUpdate.mockImplementation((callback) => {
        realtimeCallback = callback;
        return () => {};
      });

      render(
        <CharacterProvider>
          <TestComponent />
        </CharacterProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId("character-name")).toHaveTextContent("Test Hero");
      });

      jest.clearAllMocks();

      // **TEST**: Simulate realtime event for different user
      if (realtimeCallback) {
        await act(async () => {
          realtimeCallback({
            type: 'character_updated',
            table: 'characters',
            action: 'UPDATE',
            record: { user_id: "different-user-456", xp: 999, gold: 999 },
          });
        });
      }

      // **EXPECTED**: Should NOT refresh character for different user
      expect(mockSupabaseFrom).not.toHaveBeenCalled();

      // Character display should remain unchanged
      expect(screen.getByTestId("character-xp")).toHaveTextContent("100");
      expect(screen.getByTestId("character-gold")).toHaveTextContent("50");
    });

    it("should unsubscribe from realtime on unmount", () => {
      const mockUnsubscribe = jest.fn();
      mockOnCharacterUpdate.mockReturnValue(mockUnsubscribe);

      const { unmount } = render(
        <CharacterProvider>
          <TestComponent />
        </CharacterProvider>
      );

      // Verify subscription was created
      expect(mockOnCharacterUpdate).toHaveBeenCalledTimes(1);

      // Unmount component
      unmount();

      // **CRITICAL**: Unsubscribe function should be called to prevent memory leaks
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling with realtime", () => {
    it("should handle realtime subscription errors gracefully", async () => {
      // Mock realtime context with connection error
      mockUseRealtime.mockReturnValue({
        isConnected: false,
        connectionError: "WebSocket connection failed",
        lastEvent: null,
        onQuestUpdate: jest.fn(),
        onCharacterUpdate: mockOnCharacterUpdate,
        onRewardRedemptionUpdate: jest.fn(),
        onFamilyMemberUpdate: jest.fn(),
        refreshQuests: jest.fn(),
        refreshCharacters: jest.fn(),
        refreshRewards: jest.fn(),
      });

      render(
        <CharacterProvider>
          <TestComponent />
        </CharacterProvider>
      );

      // Should still load character data initially
      await waitFor(() => {
        expect(screen.getByTestId("character-name")).toHaveTextContent("Test Hero");
      });

      // Should still attempt to subscribe (even if connection failed)
      expect(mockOnCharacterUpdate).toHaveBeenCalledTimes(1);
    });

    it("should handle character fetch errors during realtime refresh", async () => {
      let realtimeCallback: ((event: MockRealtimeEvent) => void) | undefined;

      mockOnCharacterUpdate.mockImplementation((callback) => {
        realtimeCallback = callback;
        return () => {};
      });

      render(
        <CharacterProvider>
          <TestComponent />
        </CharacterProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId("character-name")).toHaveTextContent("Test Hero");
      });

      // Mock error on refresh
      jest.clearAllMocks();
      mockSingle.mockRejectedValue(
        new Error("Database connection failed")
      );

      // Trigger realtime event
      if (realtimeCallback) {
        await act(async () => {
          realtimeCallback({
            type: 'character_updated',
            table: 'characters',
            action: 'UPDATE',
            record: { user_id: mockUser.id, xp: 250 },
          });
        });
      }

      // Should display error state
      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Database connection failed");
      });
    });
  });
});