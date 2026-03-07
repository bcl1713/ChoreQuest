import { fireEvent, screen, waitFor } from "@testing-library/react";
import {
  mockGetFamilyInfo,
  mockRegenerateInviteCode,
  mockWriteText,
  renderFamilySettings,
  resetFamilySettingsMocks,
  setupClipboardMock,
} from "./family-settings.fixtures";

describe("FamilySettings - actions", () => {
  beforeEach(() => {
    resetFamilySettingsMocks();
    setupClipboardMock();
  });

  describe("Copy invite code", () => {
    it("copies invite code to clipboard", async () => {
      renderFamilySettings();

      await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /Copy/ })));

      expect(mockWriteText).toHaveBeenCalledWith("ABC123DEF");
    });

    it("shows error notification if copy fails", async () => {
      mockWriteText.mockRejectedValue(new Error("Clipboard error"));
      renderFamilySettings();

      await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /Copy/ })));

      await waitFor(() => {
        expect(screen.getByText("Failed to copy invite code")).toBeInTheDocument();
      });
    });

    it("auto-dismisses notification after 3 seconds", async () => {
      jest.useFakeTimers();
      renderFamilySettings();

      await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /Copy/ })));
      await waitFor(() => expect(screen.getByText("Invite code copied to clipboard!")).toBeInTheDocument());

      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.queryByText("Invite code copied to clipboard!")).not.toBeInTheDocument();
      });
      jest.useRealTimers();
    });
  });

  describe("Regenerate invite code", () => {
    beforeEach(() => {
      mockGetFamilyInfo.mockResolvedValue({
        name: "Smith Family",
        code: "ABC123DEF",
        timezone: "America/Chicago",
        members: [],
      });
    });

    it("opens confirmation modal when regenerate clicked", async () => {
      renderFamilySettings();

      await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /Regenerate Invite Code/ })));

      expect(screen.getByText("Regenerate Invite Code?")).toBeInTheDocument();
    });

    it("calls regenerateInviteCode when confirmed", async () => {
      renderFamilySettings();

      await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /Regenerate Invite Code/ })));
      const confirmButton = screen.getAllByRole("button", { name: /Regenerate/ })[1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockRegenerateInviteCode).toHaveBeenCalledWith("family-123");
      });
    });

    it("updates invite code display after regeneration", async () => {
      renderFamilySettings();

      await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /Regenerate Invite Code/ })));
      const confirmButton = screen.getAllByRole("button", { name: /Regenerate/ })[1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText("XYZ789GHI")).toBeInTheDocument();
      });
    });

    it("shows loading and disables buttons during regeneration", async () => {
      let resolveRegeneration: (value: string) => void;
      mockRegenerateInviteCode.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveRegeneration = resolve;
          }),
      );
      renderFamilySettings();

      await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /Regenerate Invite Code/ })));
      const confirmButton = screen.getAllByRole("button", { name: /Regenerate/ })[1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        const regeneratingButton = buttons.find((btn) => btn.textContent?.includes("Regenerating..."));
        expect(regeneratingButton).toBeDisabled();
      });

      resolveRegeneration!("NEW123");
    });

    it("shows error notification if regeneration fails", async () => {
      mockRegenerateInviteCode.mockRejectedValue(new Error("Server error"));
      renderFamilySettings();

      await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /Regenerate Invite Code/ })));
      const confirmButton = screen.getAllByRole("button", { name: /Regenerate/ })[1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText("Failed to regenerate invite code")).toBeInTheDocument();
      });
    });

    it("closes modal when cancel clicked or backdrop pressed", async () => {
      renderFamilySettings();

      await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /Regenerate Invite Code/ })));
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      await waitFor(() => {
        expect(screen.queryByText("Regenerate Invite Code?")).not.toBeInTheDocument();
      });

      await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /Regenerate Invite Code/ })));
      const backdrop = screen.getByText("Regenerate Invite Code?").closest("div")?.parentElement;
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      await waitFor(() => {
        expect(screen.queryByText("Regenerate Invite Code?")).not.toBeInTheDocument();
      });
    });
  });
});
