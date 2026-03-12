import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardHeader } from "./dashboard-header";
import { Button } from "@/components/ui";
import type { Character, Family, UserProfile } from "@/lib/types/database";
import { Crown, LogOut, Settings, User, Zap } from "lucide-react";

const mockCharacter: Character = {
  id: "char-1",
  user_id: "user-1",
  family_id: "fam-1",
  name: "TestHero",
  class: "KNIGHT",
  level: 5,
  xp: 100,
  gold: 50,
  avatar_url: null,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
} as Character;

const mockFamily: Family = {
  id: "fam-1",
  name: "TestGuild",
  code: "TG123",
  created_by: "user-1",
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
} as Family;

const mockGuildMasterProfile: UserProfile = {
  id: "user-1",
  role: "GUILD_MASTER",
  display_name: "TestUser",
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
} as UserProfile;

const mockHeroProfile: UserProfile = {
  id: "user-2",
  role: "HERO",
  display_name: "HeroUser",
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
} as UserProfile;

const mockActions = {
  onCreateQuest: jest.fn(),
  onProfile: jest.fn(),
  onAdmin: jest.fn(),
  onLogout: jest.fn(),
};

const cls = "touch-target gap-0 sm:gap-[var(--btn-gap)]";

function buildGuildMasterActions() {
  return (
    <>
      <Button
        onClick={mockActions.onAdmin}
        variant="primary"
        size="sm"
        className={cls}
        data-testid="admin-dashboard-button"
        aria-label="Admin"
        startIcon={<Settings size={16} />}
      >
        <span className="hidden sm:inline">Admin</span>
      </Button>
      <Button
        onClick={mockActions.onCreateQuest}
        variant="gold"
        size="sm"
        className={cls}
        data-testid="create-quest-button"
        aria-label="Create Quest"
        startIcon={<Zap size={16} />}
      >
        <span className="hidden sm:inline">Create Quest</span>
      </Button>
      <Button
        onClick={mockActions.onProfile}
        variant="primary"
        size="sm"
        className={cls}
        data-testid="profile-button"
        aria-label="Profile"
        startIcon={<User size={16} />}
      >
        <span className="hidden sm:inline">Profile</span>
      </Button>
      <Button
        onClick={mockActions.onLogout}
        variant="destructive"
        size="sm"
        className={cls}
        aria-label="Logout"
        startIcon={<LogOut size={16} />}
      >
        <span className="hidden sm:inline">Logout</span>
      </Button>
    </>
  );
}

function buildHeroActions() {
  return (
    <>
      <Button
        onClick={mockActions.onProfile}
        variant="primary"
        size="sm"
        data-testid="profile-button"
        aria-label="Profile"
        startIcon={<User size={16} />}
      >
        <span className="hidden sm:inline">Profile</span>
      </Button>
      <Button
        onClick={mockActions.onLogout}
        variant="destructive"
        size="sm"
        aria-label="Logout"
        startIcon={<LogOut size={16} />}
      >
        <span className="hidden sm:inline">Logout</span>
      </Button>
    </>
  );
}

type HeaderOverrides = {
  character?: Character;
  family?: Family | null;
  profile?: UserProfile | null;
  actions?: React.ReactNode;
  title?: string;
  titleIcon?: React.ReactNode;
};

function renderHeader(overrides: HeaderOverrides = {}) {
  const props = {
    character: mockCharacter,
    family: mockFamily,
    profile: mockGuildMasterProfile,
    actions: buildGuildMasterActions(),
    ...overrides,
  };
  return render(<DashboardHeader {...props} />);
}

describe("DashboardHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the default app title", () => {
      renderHeader();
      expect(screen.getByText("ChoreQuest")).toBeInTheDocument();
    });

    it("renders a custom title when provided", () => {
      renderHeader({ title: "Admin Dashboard" });
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
      expect(screen.queryByText("ChoreQuest")).not.toBeInTheDocument();
    });

    it("renders a title icon when provided", () => {
      renderHeader({
        title: "Admin Dashboard",
        titleIcon: <Crown data-testid="title-icon" size={32} />,
      });
      expect(screen.getByTestId("title-icon")).toBeInTheDocument();
    });

    it("renders guild name and code when family is provided", () => {
      renderHeader();
      expect(screen.getByText("TestGuild")).toBeInTheDocument();
      expect(screen.getByText(/TG123/)).toBeInTheDocument();
    });

    it("does not render guild info when family is null", () => {
      renderHeader({ family: null });
      expect(screen.queryByText("TestGuild")).not.toBeInTheDocument();
    });

    it("renders character name and level", () => {
      renderHeader();
      expect(screen.getByText("TestHero")).toBeInTheDocument();
      expect(screen.getByText(/Level 5/)).toBeInTheDocument();
    });

    it("renders character class label", () => {
      renderHeader();
      const levelEl = screen.getByTestId("character-level");
      expect(levelEl).toHaveTextContent(/Knight/);
    });

    it("renders 'Unknown Class' when character has no class", () => {
      renderHeader({
        character: { ...mockCharacter, class: null } as unknown as Character,
      });
      expect(screen.getByText(/Unknown Class/)).toBeInTheDocument();
    });

    it("renders role label for profile", () => {
      renderHeader();
      expect(screen.getByText("Guild Master")).toBeInTheDocument();
    });
  });

  describe("actions slot", () => {
    it("renders provided action buttons", () => {
      renderHeader();
      expect(screen.getByRole("button", { name: "Admin" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Create Quest" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Profile" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Logout" }),
      ).toBeInTheDocument();
    });

    it("renders only hero actions when given hero buttons", () => {
      renderHeader({
        profile: mockHeroProfile,
        actions: buildHeroActions(),
      });
      expect(
        screen.queryByTestId("admin-dashboard-button"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("create-quest-button"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Profile" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Logout" }),
      ).toBeInTheDocument();
    });
  });

  describe("mobile icon-only buttons", () => {
    it("action button text uses hidden sm:inline for responsive display", () => {
      renderHeader();
      const adminButton = screen.getByRole("button", { name: "Admin" });
      const textSpan = adminButton.querySelector("span.hidden.sm\\:inline");
      expect(textSpan).toBeInTheDocument();
      expect(textSpan).toHaveTextContent("Admin");
    });
  });

  describe("button interactions", () => {
    it.each([
      ["Admin", "onAdmin"],
      ["Create Quest", "onCreateQuest"],
      ["Profile", "onProfile"],
      ["Logout", "onLogout"],
    ] as const)("calls %s handler when clicked", async (label, handler) => {
      const user = userEvent.setup();
      renderHeader();
      await user.click(screen.getByRole("button", { name: label }));
      expect(mockActions[handler]).toHaveBeenCalledTimes(1);
    });
  });

  describe("hydration safety", () => {
    it("renders the time display with date and time", () => {
      renderHeader();
      // Clock is now managed internally — just verify the time element renders
      const clockElement = screen.getByText(/\d{1,2}:\d{2}:\d{2}/);
      expect(clockElement).toBeInTheDocument();
    });
  });
});
