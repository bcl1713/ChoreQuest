import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { supabase } from "@/lib/supabase";
import {
  renderGuildMasterManager,
  resetGuildMasterMocks,
  setupSupabaseList,
} from "./guild-master-manager.fixtures";

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
    },
  },
}));

describe("GuildMasterManager - actions", () => {
  beforeEach(() => {
    resetGuildMasterMocks();
    setupSupabaseList();
  });

  describe("Promote", () => {
    it("opens confirmation modal when Promote clicked", async () => {
      renderGuildMasterManager();

      await waitFor(() =>
        fireEvent.click(screen.getByRole("button", { name: "Promote" })),
      );

      expect(screen.getByText("Promote to Guild Master?")).toBeInTheDocument();
    });

    it("calls promote API when confirmed", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ message: "Success" }),
      });
      global.fetch = mockFetch;
      renderGuildMasterManager();

      await waitFor(() =>
        fireEvent.click(screen.getByRole("button", { name: "Promote" })),
      );
      fireEvent.click(screen.getAllByRole("button", { name: "Promote" })[1]);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/users/user-3/promote"),
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              Authorization: "Bearer mock-token",
            }),
          }),
        );
      });
    });

    it("shows loading state during promotion", async () => {
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
      renderGuildMasterManager();

      await waitFor(() => {
        const memberRow = screen.getByTestId("member-row-user-3");
        const promoteButton = within(memberRow).getByTestId("promote-button");
        fireEvent.click(promoteButton);
      });
      fireEvent.click(screen.getByTestId("confirm-promote-button"));

      const loadingText = await screen.findByText("Promoting...");
      const loadingButton = loadingText.closest("button");
      if (!(loadingButton instanceof HTMLButtonElement)) {
        throw new Error("Expected loading state button to be present");
      }
      expect(loadingButton).toBeDisabled();
      expect(loadingButton).toHaveAttribute("aria-busy", "true");
      expect(screen.getByLabelText("Loading")).toBeInTheDocument();
    });

    it("handles promotion API error", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: "Permission denied" }),
      });
      global.fetch = mockFetch;
      renderGuildMasterManager();

      await waitFor(() =>
        fireEvent.click(screen.getByRole("button", { name: "Promote" })),
      );
      fireEvent.click(screen.getAllByRole("button", { name: "Promote" })[1]);

      await waitFor(() => {
        expect(screen.getByText(/Permission denied/i)).toBeInTheDocument();
      });
    });
  });

  describe("Demote", () => {
    it("opens confirmation modal when Demote clicked", async () => {
      renderGuildMasterManager();

      await waitFor(() =>
        fireEvent.click(screen.getByRole("button", { name: "Demote" })),
      );

      expect(screen.getByText("Demote to Hero?")).toBeInTheDocument();
    });

    it("calls demote API when confirmed", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ message: "Success" }),
      });
      global.fetch = mockFetch;
      renderGuildMasterManager();

      await waitFor(() =>
        fireEvent.click(screen.getByRole("button", { name: "Demote" })),
      );
      fireEvent.click(screen.getAllByRole("button", { name: "Demote" })[1]);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/users/user-2/demote"),
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              Authorization: "Bearer mock-token",
            }),
          }),
        );
      });
    });
  });

  afterEach(() => {
    (supabase.auth.getSession as jest.Mock).mockClear();
  });
});
