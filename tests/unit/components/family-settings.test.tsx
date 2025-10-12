/**
 * Unit tests for FamilySettings component
 * Tests rendering, invite code management, and member display
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";

// Mock framer-motion BEFORE importing component
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void } & Record<string, unknown>>) => (
      <div onClick={onClick} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Copy: () => <span>Copy Icon</span>,
  RefreshCw: () => <span>RefreshCw Icon</span>,
  Users: () => <span>Users Icon</span>,
  Calendar: () => <span>Calendar Icon</span>,
  Shield: () => <span>Shield Icon</span>,
  User: () => <span>User Icon</span>,
}));

// Mock auth context
const mockProfile = {
  id: "user-1",
  family_id: "family-123",
  role: "GUILD_MASTER",
  name: "Alice",
};

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    profile: mockProfile,
  }),
}));

// Mock FamilyService
const mockGetFamilyInfo = jest.fn();
const mockRegenerateInviteCode = jest.fn();

jest.mock("@/lib/family-service", () => ({
  FamilyService: jest.fn().mockImplementation(() => ({
    getFamilyInfo: mockGetFamilyInfo,
    regenerateInviteCode: mockRegenerateInviteCode,
  })),
}));

// NOW import the component (after all mocks are set up)
import FamilySettings from "@/components/family-settings";

describe("FamilySettings", () => {
  const mockFamilyInfo = {
    name: "Smith Family",
    code: "ABC123DEF",
    members: [
      {
        userId: "user-1",
        displayName: "Alice Smith",
        characterName: "Alice the Knight",
        role: "GUILD_MASTER",
        joinedAt: "2024-01-15T10:00:00.000Z",
      },
      {
        userId: "user-2",
        displayName: "Bob Smith",
        characterName: "Bob the Mage",
        role: "HERO",
        joinedAt: "2024-01-20T14:30:00.000Z",
      },
      {
        userId: "user-3",
        displayName: "Charlie Smith",
        characterName: null,
        role: "HERO",
        joinedAt: "2024-02-01T09:15:00.000Z",
      },
    ],
  };

  // Mock clipboard API
  const mockWriteText = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful family info fetch by default
    mockGetFamilyInfo.mockResolvedValue(mockFamilyInfo);
    mockRegenerateInviteCode.mockResolvedValue("XYZ789GHI");

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    mockWriteText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render loading state initially", () => {
      render(<FamilySettings />);

      const skeletons = screen
        .getAllByRole("generic")
        .filter((el) => el.className.includes("animate-pulse"));
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should load family info on mount", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        expect(mockGetFamilyInfo).toHaveBeenCalledWith("family-123");
      });
    });

    it("should display family name after loading", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        expect(screen.getByText("Smith Family")).toBeInTheDocument();
      });
    });

    it("should display invite code after loading", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        expect(screen.getByText("ABC123DEF")).toBeInTheDocument();
      });
    });

    it("should display section headings", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        expect(screen.getByText("👥 Family Information")).toBeInTheDocument();
        expect(screen.getByText(/Family Members \(3\)/)).toBeInTheDocument();
      });
    });
  });

  describe("Family Members Display", () => {
    it("should display all family members", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        expect(screen.getByText("Alice Smith")).toBeInTheDocument();
        expect(screen.getByText("Bob Smith")).toBeInTheDocument();
        expect(screen.getByText("Charlie Smith")).toBeInTheDocument();
      });
    });

    it("should display character names for members with characters", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        expect(screen.getByText(/Alice the Knight/)).toBeInTheDocument();
        expect(screen.getByText(/Bob the Mage/)).toBeInTheDocument();
      });
    });

    it("should display Guild Master badge for Guild Masters", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        const badges = screen.getAllByText("Guild Master");
        expect(badges.length).toBe(1);
      });
    });

    it("should display Hero badge for Heroes", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        const badges = screen.getAllByText("Hero");
        expect(badges.length).toBe(2);
      });
    });

    it("should display join dates for all members", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        expect(screen.getByText(/Joined January 15, 2024/)).toBeInTheDocument();
        expect(screen.getByText(/Joined January 20, 2024/)).toBeInTheDocument();
        expect(screen.getByText(/Joined February 1, 2024/)).toBeInTheDocument();
      });
    });

    it("should handle members without character names", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        expect(screen.getByText("Charlie Smith")).toBeInTheDocument();
        // Should not crash - character section simply won't render
      });
    });
  });

  describe("Copy Invite Code", () => {
    it("should show Copy button", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Copy/ })).toBeInTheDocument();
      });
    });

    it("should copy invite code to clipboard when Copy clicked", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        const copyButton = screen.getByRole("button", { name: /Copy/ });
        fireEvent.click(copyButton);
      });

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith("ABC123DEF");
      });
    });

    it("should show success notification after successful copy", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        const copyButton = screen.getByRole("button", { name: /Copy/ });
        fireEvent.click(copyButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Invite code copied to clipboard!")).toBeInTheDocument();
      });
    });

    it("should show error notification if copy fails", async () => {
      mockWriteText.mockRejectedValue(new Error("Clipboard error"));

      render(<FamilySettings />);

      await waitFor(() => {
        const copyButton = screen.getByRole("button", { name: /Copy/ });
        fireEvent.click(copyButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Failed to copy invite code")).toBeInTheDocument();
      });
    });

    it("should auto-dismiss notification after 3 seconds", async () => {
      jest.useFakeTimers();

      render(<FamilySettings />);

      await waitFor(() => {
        const copyButton = screen.getByRole("button", { name: /Copy/ });
        fireEvent.click(copyButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Invite code copied to clipboard!")).toBeInTheDocument();
      });

      // Fast-forward 3 seconds
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(
          screen.queryByText("Invite code copied to clipboard!")
        ).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe("Regenerate Invite Code", () => {
    it("should show Regenerate button", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Regenerate Invite Code/ })
        ).toBeInTheDocument();
      });
    });

    it("should show warning message about regeneration", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        expect(
          screen.getByText(/Regenerating will invalidate the current invite code/)
        ).toBeInTheDocument();
      });
    });

    it("should open confirmation modal when Regenerate clicked", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        const regenButton = screen.getByRole("button", {
          name: /Regenerate Invite Code/,
        });
        fireEvent.click(regenButton);
      });

      expect(screen.getByText("⚠️ Regenerate Invite Code?")).toBeInTheDocument();
      expect(
        screen.getByText(/This will create a new invite code and invalidate the current one/)
      ).toBeInTheDocument();
    });

    it("should close modal when Cancel clicked", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        const regenButton = screen.getByRole("button", {
          name: /Regenerate Invite Code/,
        });
        fireEvent.click(regenButton);
      });

      expect(screen.getByText("⚠️ Regenerate Invite Code?")).toBeInTheDocument();

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText("⚠️ Regenerate Invite Code?")).not.toBeInTheDocument();
      });
    });

    it("should call regenerateInviteCode when confirmed", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        const regenButton = screen.getByRole("button", {
          name: /Regenerate Invite Code/,
        });
        fireEvent.click(regenButton);
      });

      const confirmButton = screen.getAllByRole("button", { name: /Regenerate/ })[1]; // Second one is in modal
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockRegenerateInviteCode).toHaveBeenCalledWith("family-123");
      });
    });

    it("should update invite code display after regeneration", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        expect(screen.getByText("ABC123DEF")).toBeInTheDocument();
      });

      await waitFor(() => {
        const regenButton = screen.getByRole("button", {
          name: /Regenerate Invite Code/,
        });
        fireEvent.click(regenButton);
      });

      const confirmButton = screen.getAllByRole("button", { name: /Regenerate/ })[1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText("XYZ789GHI")).toBeInTheDocument();
      });
    });

    it("should show success notification after regeneration", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        const regenButton = screen.getByRole("button", {
          name: /Regenerate Invite Code/,
        });
        fireEvent.click(regenButton);
      });

      const confirmButton = screen.getAllByRole("button", { name: /Regenerate/ })[1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(
          screen.getByText("Invite code regenerated successfully!")
        ).toBeInTheDocument();
      });
    });

    it("should close modal after successful regeneration", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        const regenButton = screen.getByRole("button", {
          name: /Regenerate Invite Code/,
        });
        fireEvent.click(regenButton);
      });

      const confirmButton = screen.getAllByRole("button", { name: /Regenerate/ })[1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByText("⚠️ Regenerate Invite Code?")).not.toBeInTheDocument();
      });
    });

    it("should show loading state during regeneration", async () => {
      let resolveRegeneration: (value: string) => void;
      mockRegenerateInviteCode.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveRegeneration = resolve;
          })
      );

      render(<FamilySettings />);

      await waitFor(() => {
        const regenButton = screen.getByRole("button", {
          name: /Regenerate Invite Code/,
        });
        fireEvent.click(regenButton);
      });

      const confirmButton = screen.getAllByRole("button", { name: /Regenerate/ })[1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        // Check for button with "Regenerating..." text in modal
        const buttons = screen.getAllByRole("button");
        const regeneratingButton = buttons.find((btn) =>
          btn.textContent?.includes("Regenerating...")
        );
        expect(regeneratingButton).toBeInTheDocument();
      });

      // Clean up - resolve the promise
      resolveRegeneration!("NEW123");
    });

    it("should disable Regenerate button during regeneration", async () => {
      let resolveRegeneration: (value: string) => void;
      mockRegenerateInviteCode.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveRegeneration = resolve;
          })
      );

      render(<FamilySettings />);

      await waitFor(() => {
        const regenButton = screen.getByRole("button", {
          name: /Regenerate Invite Code/,
        });
        fireEvent.click(regenButton);
      });

      const confirmButton = screen.getAllByRole("button", { name: /Regenerate/ })[1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        // Check for button with "Regenerating..." text in modal
        const buttons = screen.getAllByRole("button");
        const regeneratingButton = buttons.find((btn) =>
          btn.textContent?.includes("Regenerating...")
        );
        expect(regeneratingButton).toBeDisabled();
      });

      // Clean up - resolve the promise
      resolveRegeneration!("NEW123");
    });

    it("should show error notification if regeneration fails", async () => {
      mockRegenerateInviteCode.mockRejectedValue(new Error("Server error"));

      render(<FamilySettings />);

      await waitFor(() => {
        const regenButton = screen.getByRole("button", {
          name: /Regenerate Invite Code/,
        });
        fireEvent.click(regenButton);
      });

      const confirmButton = screen.getAllByRole("button", { name: /Regenerate/ })[1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText("Failed to regenerate invite code")).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error state when loading fails", async () => {
      mockGetFamilyInfo.mockRejectedValue(new Error("Database error"));

      render(<FamilySettings />);

      await waitFor(() => {
        expect(screen.getByText("Failed to load family information")).toBeInTheDocument();
      });
    });

    it("should display error if familyInfo is null", async () => {
      mockGetFamilyInfo.mockResolvedValue(null);

      render(<FamilySettings />);

      await waitFor(() => {
        expect(screen.getByText("Failed to load family settings")).toBeInTheDocument();
      });
    });
  });

  describe("Modal Interaction", () => {
    it("should close modal when clicking outside", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        const regenButton = screen.getByRole("button", {
          name: /Regenerate Invite Code/,
        });
        fireEvent.click(regenButton);
      });

      expect(screen.getByText("⚠️ Regenerate Invite Code?")).toBeInTheDocument();

      // Click the backdrop (modal overlay)
      const backdrop = screen.getByText("⚠️ Regenerate Invite Code?").closest("div")?.parentElement;
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      await waitFor(() => {
        expect(screen.queryByText("⚠️ Regenerate Invite Code?")).not.toBeInTheDocument();
      });
    });

    it("should not close modal when clicking inside modal content", async () => {
      render(<FamilySettings />);

      await waitFor(() => {
        const regenButton = screen.getByRole("button", {
          name: /Regenerate Invite Code/,
        });
        fireEvent.click(regenButton);
      });

      const modalTitle = screen.getByText("⚠️ Regenerate Invite Code?");
      fireEvent.click(modalTitle);

      // Modal should still be open
      expect(screen.getByText("⚠️ Regenerate Invite Code?")).toBeInTheDocument();
    });
  });

  describe("Empty States", () => {
    it("should handle family with no members", async () => {
      mockGetFamilyInfo.mockResolvedValue({
        name: "Empty Family",
        code: "EMPTY123",
        members: [],
      });

      render(<FamilySettings />);

      await waitFor(() => {
        expect(screen.getByText("Empty Family")).toBeInTheDocument();
        expect(screen.getByText(/Family Members \(0\)/)).toBeInTheDocument();
      });
    });
  });
});
