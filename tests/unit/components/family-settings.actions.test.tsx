import { fireEvent, screen, waitFor } from "@testing-library/react";
import {
  mockGetFamilyInfo,
  mockNotificationError,
  mockNotificationSuccess,
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

      await waitFor(() =>
        fireEvent.click(screen.getByRole("button", { name: /Copy/ })),
      );

      expect(mockWriteText).toHaveBeenCalledWith("ABC123DEF");
    });

    it("shows error notification if copy fails", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      mockWriteText.mockRejectedValue(new Error("Clipboard error"));
      renderFamilySettings();

      await waitFor(() =>
        fireEvent.click(screen.getByRole("button", { name: /Copy/ })),
      );

      await waitFor(() => {
        expect(mockNotificationError).toHaveBeenCalledWith(
          "Failed to copy invite code",
        );
      });
    });

    it("uses notification hook for copy success", async () => {
      renderFamilySettings();

      await waitFor(() =>
        fireEvent.click(screen.getByRole("button", { name: /Copy/ })),
      );

      await waitFor(() => {
        expect(mockNotificationSuccess).toHaveBeenCalledWith(
          "Invite code copied to clipboard!",
        );
      });
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

      await waitFor(() =>
        fireEvent.click(
          screen.getByRole("button", { name: /Regenerate Invite Code/ }),
        ),
      );

      expect(screen.getByText("Regenerate Invite Code?")).toBeInTheDocument();
    });

    it("calls regenerateInviteCode when confirmed", async () => {
      renderFamilySettings();

      await waitFor(() =>
        fireEvent.click(
          screen.getByRole("button", { name: /Regenerate Invite Code/ }),
        ),
      );
      const confirmButton = screen.getAllByRole("button", {
        name: /Regenerate/,
      })[1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockRegenerateInviteCode).toHaveBeenCalledWith("family-123");
      });
    });

    it("updates invite code display after regeneration", async () => {
      renderFamilySettings();

      await waitFor(() =>
        fireEvent.click(
          screen.getByRole("button", { name: /Regenerate Invite Code/ }),
        ),
      );
      const confirmButton = screen.getAllByRole("button", {
        name: /Regenerate/,
      })[1];
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

      await waitFor(() =>
        fireEvent.click(
          screen.getByRole("button", { name: /Regenerate Invite Code/ }),
        ),
      );
      const confirmButton = screen.getAllByRole("button", {
        name: /Regenerate/,
      })[1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        const regeneratingButton = buttons.find((btn) =>
          btn.textContent?.includes("Regenerating..."),
        );
        expect(regeneratingButton).toBeDisabled();
      });

      resolveRegeneration!("NEW123");
    });

    it("shows error notification if regeneration fails", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      mockRegenerateInviteCode.mockRejectedValue(new Error("Server error"));
      renderFamilySettings();

      await waitFor(() =>
        fireEvent.click(
          screen.getByRole("button", { name: /Regenerate Invite Code/ }),
        ),
      );
      const confirmButton = screen.getAllByRole("button", {
        name: /Regenerate/,
      })[1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockNotificationError).toHaveBeenCalledWith(
          "Failed to regenerate invite code",
        );
      });
    });

    it("closes modal when cancel clicked or backdrop pressed", async () => {
      renderFamilySettings();

      await waitFor(() =>
        fireEvent.click(
          screen.getByRole("button", { name: /Regenerate Invite Code/ }),
        ),
      );
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      await waitFor(() => {
        expect(
          screen.queryByText("Regenerate Invite Code?"),
        ).not.toBeInTheDocument();
      });

      await waitFor(() =>
        fireEvent.click(
          screen.getByRole("button", { name: /Regenerate Invite Code/ }),
        ),
      );
      const backdrop = screen
        .getByText("Regenerate Invite Code?")
        .closest("div")?.parentElement;
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      await waitFor(() => {
        expect(
          screen.queryByText("Regenerate Invite Code?"),
        ).not.toBeInTheDocument();
      });
    });
  });
});
