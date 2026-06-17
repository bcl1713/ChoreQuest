import { screen, waitFor } from "@testing-library/react";
import {
  mockFamilyInfo,
  mockGetFamilyInfo,
  mockNotificationDismiss,
  mockNotificationSuccess,
  mockNotifications,
  renderFamilySettings,
  resetFamilySettingsMocks,
  setupClipboardMock,
} from "./family-settings.fixtures";
import { useNotification } from "@/hooks/useNotification";

describe("FamilySettings - rendering", () => {
  beforeEach(() => {
    resetFamilySettingsMocks();
  });

  it("renders loading state initially", () => {
    renderFamilySettings();

    const skeletons = screen.getAllByRole("generic").filter((el) => el.className.includes("animate-pulse"));
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("loads family info on mount", async () => {
    renderFamilySettings();

    await waitFor(() => {
      expect(mockGetFamilyInfo).toHaveBeenCalledWith("family-123");
    });
  });

  it("displays family name, code, and headings", async () => {
    renderFamilySettings();

    await waitFor(() => {
      expect(screen.getByText("Smith Family")).toBeInTheDocument();
      expect(screen.getByText("ABC123DEF")).toBeInTheDocument();
      expect(screen.getByText("Family Information")).toBeInTheDocument();
      expect(screen.getByText(/Family Members \(3\)/)).toBeInTheDocument();
    });
  });

  describe("Family members", () => {
    it("displays all family members and roles", async () => {
      renderFamilySettings();

      await waitFor(() => {
        expect(screen.getByText("Alice Smith")).toBeInTheDocument();
        expect(screen.getByText("Bob Smith")).toBeInTheDocument();
        expect(screen.getByText("Charlie Smith")).toBeInTheDocument();
        expect(screen.getAllByText("Guild Master").length).toBe(1);
        expect(screen.getAllByText("Hero").length).toBe(2);
      });
    });

    it("displays character names when present", async () => {
      renderFamilySettings();

      await waitFor(() => {
        expect(screen.getByText(/Alice the Knight/)).toBeInTheDocument();
        expect(screen.getByText(/Bob the Mage/)).toBeInTheDocument();
      });
    });

    it("displays join dates for all members", async () => {
      renderFamilySettings();

      await waitFor(() => {
        expect(screen.getByText(/Joined January 15, 2024/)).toBeInTheDocument();
        expect(screen.getByText(/Joined January 20, 2024/)).toBeInTheDocument();
        expect(screen.getByText(/Joined February 1, 2024/)).toBeInTheDocument();
      });
    });

    it("handles family with no members", async () => {
      mockGetFamilyInfo.mockResolvedValue({
        ...mockFamilyInfo,
        name: "Empty Family",
        code: "EMPTY123",
        members: [],
      });

      renderFamilySettings();

      await waitFor(() => {
        expect(screen.getByText("Empty Family")).toBeInTheDocument();
        expect(screen.getByText(/Family Members \(0\)/)).toBeInTheDocument();
      });
    });
  });

  describe("Copy invite code", () => {
    it("copies invite code and uses notification hook for success", async () => {
      setupClipboardMock();
      renderFamilySettings();

      await waitFor(() => {
        const copyButton = screen.getByRole("button", { name: /Copy/ });
        copyButton.click();
      });

      await waitFor(() => {
        expect(mockNotificationSuccess).toHaveBeenCalledWith(
          "Invite code copied to clipboard!",
        );
      });
    });
  });

  it("renders active notifications from the hook", async () => {
    mockNotifications.push({
      id: "notification-1",
      type: "success",
      message: "Invite code copied to clipboard!",
    });
    (useNotification as jest.Mock).mockReturnValue({
      notifications: mockNotifications,
      dismiss: mockNotificationDismiss,
      show: jest.fn(),
      info: jest.fn(),
      success: mockNotificationSuccess,
      error: jest.fn(),
    });

    renderFamilySettings();

    expect(
      await screen.findByText("Invite code copied to clipboard!")
    ).toBeInTheDocument();
  });
});
