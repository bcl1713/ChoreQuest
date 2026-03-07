import { screen, waitFor } from "@testing-library/react";
import { supabase } from "@/lib/supabase";
import {
  renderGuildMasterManager,
  resetGuildMasterMocks,
} from "./guild-master-manager.fixtures";

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
    },
  },
}));

describe("GuildMasterManager - errors", () => {
  beforeEach(() => {
    resetGuildMasterMocks();
  });

  it("displays error state when loading fails", async () => {
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

    renderGuildMasterManager();

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load family members/),
      ).toBeInTheDocument();
    });
  });
});
