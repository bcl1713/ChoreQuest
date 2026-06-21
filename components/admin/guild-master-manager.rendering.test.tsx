import { screen, waitFor } from "@testing-library/react";
import { supabase } from "@/lib/supabase";
import {
  mockOnFamilyMemberUpdate,
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

describe("GuildMasterManager - rendering", () => {
  beforeEach(() => {
    resetGuildMasterMocks();
    setupSupabaseList();
  });

  it("renders loading state initially", () => {
    renderGuildMasterManager();

    expect(screen.getByText("Guild Master Management")).toBeInTheDocument();
    const skeletons = screen
      .getAllByRole("generic")
      .filter((el) => el.className.includes("animate-pulse"));
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("loads family members on mount", async () => {
    renderGuildMasterManager();

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("user_profiles");
    });
  });

  it("subscribes to realtime updates on mount", async () => {
    renderGuildMasterManager();

    await waitFor(() => {
      expect(mockOnFamilyMemberUpdate).toHaveBeenCalled();
    });
  });

  it("displays members, characters, and counts", async () => {
    renderGuildMasterManager();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Charlie")).toBeInTheDocument();
      expect(screen.getByText(/Alice the Knight/)).toBeInTheDocument();
      expect(screen.getByText(/Bob the Mage/)).toBeInTheDocument();
      expect(screen.getByText(/Charlie the Rogue/)).toBeInTheDocument();
      expect(screen.getByText(/Level 5/)).toBeInTheDocument();
      expect(screen.getByText(/Level 3/)).toBeInTheDocument();
      expect(screen.getByText(/Level 4/)).toBeInTheDocument();
      expect(screen.getByText(/2 Guild Masters in family/)).toBeInTheDocument();
      expect(screen.getAllByText("(You)").length).toBeGreaterThan(0);
    });
  });

  it("shows role badges", async () => {
    renderGuildMasterManager();

    await waitFor(() => {
      expect(screen.getAllByText("Guild Master").length).toBe(2);
      expect(screen.getAllByText("Hero").length).toBe(1);
    });
  });

  it("disables demote action when only one Guild Master remains", async () => {
    setupSupabaseList([
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
    ]);

    renderGuildMasterManager();

    await waitFor(() => {
      expect(screen.getByText(/1 Guild Master in family/)).toBeInTheDocument();
      expect(screen.queryAllByRole("button", { name: /Demote/ }).length).toBe(
        0,
      );
    });
  });

  it("shows correct action buttons per role", async () => {
    renderGuildMasterManager();

    await waitFor(() => {
      const promoteButtons = screen.getAllByRole("button", { name: /Promote/ });
      const demoteButtons = screen.getAllByRole("button", { name: /Demote/ });
      expect(promoteButtons.length).toBe(1);
      expect(demoteButtons.length).toBe(1);
    });
  });

  it("links each roster member to a dedicated admin profile page", async () => {
    renderGuildMasterManager();

    await waitFor(() => {
      const profileLinks = screen.getAllByRole("link", { name: /View profile/i });
      expect(profileLinks).toHaveLength(3);
      expect(profileLinks[1]).toHaveAttribute("href", "/admin/users/user-2");
    });
  });
});
