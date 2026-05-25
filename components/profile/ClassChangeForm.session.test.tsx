import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ClassChangeForm from "./ClassChangeForm";
import { ProfileService } from "@/lib/profile-service";
import { Character } from "@/lib/types/database";

jest.mock("@/lib/profile-service");
jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: "mock-token" } },
      }),
      refreshSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: "refreshed-token" } },
      }),
    },
  },
}));

const mockCharacter: Character = {
  id: "char-123",
  user_id: "user-123",
  name: "TestCharacter",
  class: "MAGE",
  level: 10,
  gold: 500,
  xp: 0,
  honor: 0,
  gems: 0,
  last_class_change_at: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

describe("ClassChangeForm - session and timer", () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSuccess.mockClear();

    (ProfileService.canChangeClass as jest.Mock).mockResolvedValue(true);
    (
      ProfileService.getClassChangeCooldownRemaining as jest.Mock
    ).mockResolvedValue(0);
    (ProfileService.getClassChangeCost as jest.Mock).mockReturnValue(250);
  });

  it("falls back to refreshSession when getSession returns no token", async () => {
    const { supabase: mockSupabase } = jest.requireMock("@/lib/supabase");
    (mockSupabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
      data: { session: null },
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const user = userEvent.setup();
    render(
      <ClassChangeForm character={mockCharacter} onSuccess={mockOnSuccess} />,
    );

    const knightButton = await screen.findByRole("button", { name: /Knight/i });
    await user.click(knightButton);
    await user.click(
      screen.getByRole("button", { name: /Confirm Class Change/i }),
    );
    await user.click(screen.getByRole("button", { name: /^Change Class$/i }));

    await waitFor(() => {
      expect(mockSupabase.auth.refreshSession).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/change-class"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer refreshed-token",
          }),
        }),
      );
    });
  });

  it("formats cooldown timer correctly", async () => {
    (ProfileService.canChangeClass as jest.Mock).mockResolvedValue(false);
    (
      ProfileService.getClassChangeCooldownRemaining as jest.Mock
    ).mockResolvedValue(
      86400000 + 3600000 + 300000, // 1d 1h 5m
    );

    render(
      <ClassChangeForm character={mockCharacter} onSuccess={mockOnSuccess} />,
    );

    await waitFor(() => {
      expect(screen.getByText(/1d 1h 5m/)).toBeInTheDocument();
    });
  });
});
