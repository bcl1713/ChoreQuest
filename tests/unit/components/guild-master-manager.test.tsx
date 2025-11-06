/**
 * Unit tests for GuildMasterManager component
 * Tests rendering, role management, and real-time updates
 */

import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { supabase } from "@/lib/supabase";

// Mock framer-motion BEFORE importing component
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock realtime context
const mockOnFamilyMemberUpdate = jest.fn(() => jest.fn());

jest.mock("@/lib/realtime-context", () => ({
  useRealtime: () => ({
    onFamilyMemberUpdate: mockOnFamilyMemberUpdate,
  }),
}));

// Mock auth context - default Guild Master
const mockProfile = {
  id: "user-1",
  family_id: "family-123",
  role: "GUILD_MASTER",
  name: "Alice",
};

const mockUser = {
  id: "user-1",
};

jest.mock("@/lib/auth-context", () => ({
  useAuth: jest.fn(() => ({
    profile: mockProfile,
    user: mockUser,
  })),
}));

// Mock Supabase client
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
    },
  },
}));

// NOW import the component (after all mocks are set up)
import GuildMasterManager from "@/components/admin/guild-master-manager";

describe("GuildMasterManager", () => {
  const mockMembers = [
    {
      id: "user-1",
      name: "Alice",
      role: "GUILD_MASTER",
      family_id: "family-123",
      characters: {
        name: "Alice the Knight",
        level: 5,
      },
    },
    {
      id: "user-2",
      name: "Bob",
      role: "GUILD_MASTER",
      family_id: "family-123",
      characters: {
        name: "Bob the Mage",
        level: 3,
      },
    },
    {
      id: "user-3",
      name: "Charlie",
      role: "HERO",
      family_id: "family-123",
      characters: {
        name: "Charlie the Rogue",
        level: 4,
      },
    },
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock successful Supabase query by default
    const mockOrder2 = jest.fn().mockResolvedValue({
      data: mockMembers,
      error: null,
    });

    const mockOrder1 = jest.fn().mockReturnValue({
      order: mockOrder2,
    });

    const mockEq = jest.fn().mockReturnValue({
      order: mockOrder1,
    });

    const mockSelect = jest.fn().mockReturnValue({
      eq: mockEq,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    // Mock realtime subscription
    mockOnFamilyMemberUpdate.mockClear().mockReturnValue(jest.fn());

    // Mock auth session
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: {
        session: {
          access_token: "mock-token",
        },
      },
    });

    // Reset fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render loading state initially", () => {
      render(<GuildMasterManager />);

      expect(screen.getByText("Guild Master Management")).toBeInTheDocument();
      const skeletons = screen
        .getAllByRole("generic")
        .filter((el) => el.className.includes("animate-pulse"));
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should load family members on mount", async () => {
      render(<GuildMasterManager />);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith("user_profiles");
      });
    });

    it("should subscribe to realtime updates on mount", async () => {
      render(<GuildMasterManager />);

      await waitFor(() => {
        expect(mockOnFamilyMemberUpdate).toHaveBeenCalled();
      });
    });

    it("should display all family members after loading", async () => {
      render(<GuildMasterManager />);

      await waitFor(() => {
        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("Bob")).toBeInTheDocument();
        expect(screen.getByText("Charlie")).toBeInTheDocument();
      });
    });

    it("should display character names and levels", async () => {
      render(<GuildMasterManager />);

      await waitFor(() => {
        expect(screen.getByText(/Alice the Knight/)).toBeInTheDocument();
        expect(screen.getByText(/Bob the Mage/)).toBeInTheDocument();
        expect(screen.getByText(/Charlie the Rogue/)).toBeInTheDocument();
        expect(screen.getByText(/Level 5/)).toBeInTheDocument();
        expect(screen.getByText(/Level 3/)).toBeInTheDocument();
        expect(screen.getByText(/Level 4/)).toBeInTheDocument();
      });
    });

    it("should display Guild Master count", async () => {
      render(<GuildMasterManager />);

      await waitFor(() => {
        expect(screen.getByText(/2 Guild Masters in family/)).toBeInTheDocument();
      });
    });

    it("should mark current user with (You) label", async () => {
      render(<GuildMasterManager />);

      await waitFor(() => {
        const youLabels = screen.getAllByText("(You)");
        expect(youLabels.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Role Badges", () => {
    it("should display Guild Master badge for Guild Masters", async () => {
      render(<GuildMasterManager />);

      await waitFor(() => {
        const badges = screen.getAllByText("Guild Master");
        expect(badges.length).toBe(2); // Alice and Bob
      });
    });

    it("should display Hero badge for Heroes", async () => {
      render(<GuildMasterManager />);

      await waitFor(() => {
        const badges = screen.getAllByText("Hero");
        expect(badges.length).toBe(1); // Charlie
      });
    });
  });

  describe("Action Buttons", () => {
    it("should show Promote button for Heroes", async () => {
      render(<GuildMasterManager />);

      await waitFor(() => {
        const promoteButtons = screen.getAllByRole("button", { name: /Promote/ });
        expect(promoteButtons.length).toBe(1); // Only Charlie
      });
    });

    it("should show Demote button for other Guild Masters", async () => {
      render(<GuildMasterManager />);

      await waitFor(() => {
        const demoteButtons = screen.getAllByRole("button", { name: /Demote/ });
        expect(demoteButtons.length).toBe(1); // Only Bob (not Alice, since she's current user)
      });
    });

    it("should not show action button for current user", async () => {
      render(<GuildMasterManager />);

      await waitFor(() => {
        const aliceRow = screen.getByText("Alice").closest("div");
        expect(aliceRow).toBeInTheDocument();
        // Should have "(You)" text instead of action button
        const youLabels = screen.getAllByText("(You)");
        expect(youLabels.length).toBeGreaterThan(0);
      });
    });

    it("should disable Demote button for last Guild Master", async () => {
      // Mock only one Guild Master
      const singleGMMembers = [
        {
          id: "user-1",
          name: "Alice",
          role: "GUILD_MASTER",
          family_id: "family-123",
          characters: { name: "Alice the Knight", level: 5 },
        },
        {
          id: "user-3",
          name: "Charlie",
          role: "HERO",
          family_id: "family-123",
          characters: { name: "Charlie the Rogue", level: 4 },
        },
      ];

      const mockOrder2 = jest.fn().mockResolvedValue({
        data: singleGMMembers,
        error: null,
      });

      const mockOrder1 = jest.fn().mockReturnValue({
        order: mockOrder2,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: mockOrder1,
          }),
        }),
      });

      render(<GuildMasterManager />);

      await waitFor(() => {
        expect(screen.getByText(/1 Guild Master in family/)).toBeInTheDocument();
        // No demote buttons should be enabled
        const demoteButtons = screen.queryAllByRole("button", { name: /Demote/ });
        expect(demoteButtons.length).toBe(0);
      });
    });
  });

  describe("Promote Action", () => {
    it("should open confirmation modal when Promote clicked", async () => {
      render(<GuildMasterManager />);

      await waitFor(() => {
        const promoteButton = screen.getByRole("button", { name: "Promote" });
        fireEvent.click(promoteButton);
      });

      expect(screen.getByText("Promote to Guild Master?")).toBeInTheDocument();
    });

    it("should display correct confirmation message for promotion", async () => {
      render(<GuildMasterManager />);

      await waitFor(() => {
        const promoteButton = screen.getByRole("button", { name: "Promote" });
        fireEvent.click(promoteButton);
      });

      expect(
        screen.getByText(/They will gain full administrative access/i)
      ).toBeInTheDocument();
    });

    it("should call promote API when confirmed", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ message: "Success" }),
      });
      global.fetch = mockFetch;

      render(<GuildMasterManager />);

      await waitFor(() => {
        const promoteButton = screen.getByRole("button", { name: "Promote" });
        fireEvent.click(promoteButton);
      });

      const confirmButton = screen.getAllByRole("button", { name: "Promote" })[1]; // Second one is in modal
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/users/user-3/promote"),
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              Authorization: "Bearer mock-token",
            }),
          })
        );
      });
    });

    it("should close modal when Cancel clicked", async () => {
      render(<GuildMasterManager />);

      await waitFor(() => {
        const promoteButton = screen.getByRole("button", { name: "Promote" });
        fireEvent.click(promoteButton);
      });

      expect(screen.getByText("Promote to Guild Master?")).toBeInTheDocument();

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText("Promote to Guild Master?")).not.toBeInTheDocument();
      });
    });

    it("should show loading state during promotion", async () => {
      const mockFetch = jest.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: jest.fn().mockResolvedValue({ message: "Promoted" }),
                }),
              100,
            ),
          ),
      );
      global.fetch = mockFetch;

      render(<GuildMasterManager />);

      await waitFor(() => {
        const memberRow = screen.getByTestId("member-row-user-3");
        const promoteButton = within(memberRow).getByTestId("promote-button");
        fireEvent.click(promoteButton);
      });

      const confirmButton = screen.getByTestId("confirm-promote-button");
      fireEvent.click(confirmButton);

      const loadingText = await screen.findByText("Promoting...");
      const loadingButton = loadingText.closest("button");

      if (!(loadingButton instanceof HTMLButtonElement)) {
        throw new Error("Expected loading state button to be present");
      }

      expect(loadingButton).toBeDisabled();
      expect(loadingButton).toHaveAttribute("aria-busy", "true");
      expect(screen.getByLabelText("Loading")).toBeInTheDocument();
    });

    it("should handle promotion API error", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: "Permission denied" }),
      });
      global.fetch = mockFetch;

      render(<GuildMasterManager />);

      await waitFor(() => {
        const promoteButton = screen.getByRole("button", { name: "Promote" });
        fireEvent.click(promoteButton);
      });

      const confirmButton = screen.getAllByRole("button", { name: "Promote" })[1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Permission denied/i)).toBeInTheDocument();
      });
    });
  });

  describe("Demote Action", () => {
    it("should open confirmation modal when Demote clicked", async () => {
      render(<GuildMasterManager />);

      await waitFor(() => {
        const demoteButton = screen.getByRole("button", { name: "Demote" });
        fireEvent.click(demoteButton);
      });

      expect(screen.getByText("Demote to Hero?")).toBeInTheDocument();
    });

    it("should display correct confirmation message for demotion", async () => {
      render(<GuildMasterManager />);

      await waitFor(() => {
        const demoteButton = screen.getByRole("button", { name: "Demote" });
        fireEvent.click(demoteButton);
      });

      expect(
        screen.getByText(/They will lose administrative privileges/i)
      ).toBeInTheDocument();
    });

    it("should call demote API when confirmed", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ message: "Success" }),
      });
      global.fetch = mockFetch;

      render(<GuildMasterManager />);

      await waitFor(() => {
        const demoteButton = screen.getByRole("button", { name: "Demote" });
        fireEvent.click(demoteButton);
      });

      const confirmButton = screen.getAllByRole("button", { name: "Demote" })[1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/users/user-2/demote"),
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              Authorization: "Bearer mock-token",
            }),
          })
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error state when loading fails", async () => {
      const mockOrder2 = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const mockOrder1 = jest.fn().mockReturnValue({
        order: mockOrder2,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: mockOrder1,
          }),
        }),
      });

      render(<GuildMasterManager />);

      await waitFor(() => {
        expect(screen.getByText("Failed to load family members")).toBeInTheDocument();
      });
    });

    it("should handle auth session error", async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      render(<GuildMasterManager />);

      await waitFor(() => {
        const promoteButton = screen.getByRole("button", { name: "Promote" });
        fireEvent.click(promoteButton);
      });

      const confirmButton = screen.getAllByRole("button", { name: "Promote" })[1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Not authenticated/i)).toBeInTheDocument();
      });
    });
  });

  describe("Real-time Updates", () => {
    it("should reload members when realtime update received", async () => {
      const unsubscribe = jest.fn();
      mockOnFamilyMemberUpdate.mockReturnValue(unsubscribe);

      render(<GuildMasterManager />);

      await waitFor(() => {
        expect(mockOnFamilyMemberUpdate).toHaveBeenCalled();
      });

      // Get the callback that was passed to onFamilyMemberUpdate
      const realtimeCallback = mockOnFamilyMemberUpdate.mock.calls[0][0];

      // Clear the initial load call
      jest.clearAllMocks();

      // Simulate realtime update
      realtimeCallback();

      // Should reload members
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith("user_profiles");
      });
    });

    it("should unsubscribe from updates on unmount", async () => {
      const unsubscribe = jest.fn();
      mockOnFamilyMemberUpdate.mockReturnValue(unsubscribe);

      const { unmount } = render(<GuildMasterManager />);

      await waitFor(() => {
        expect(mockOnFamilyMemberUpdate).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  describe("Members Without Characters", () => {
    it("should handle members without characters gracefully", async () => {
      const membersNoChars = [
        {
          id: "user-1",
          name: "Alice",
          role: "GUILD_MASTER",
          family_id: "family-123",
          characters: null,
        },
      ];

      const mockOrder2 = jest.fn().mockResolvedValue({
        data: membersNoChars,
        error: null,
      });

      const mockOrder1 = jest.fn().mockReturnValue({
        order: mockOrder2,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: mockOrder1,
          }),
        }),
      });

      render(<GuildMasterManager />);

      await waitFor(() => {
        expect(screen.getByText("Alice")).toBeInTheDocument();
        // Should not crash, just not show character info
      });
    });
  });
});
