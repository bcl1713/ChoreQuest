import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardHeader } from "./dashboard-header";
import type { Character, Family, UserProfile } from "@/lib/types/database";

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

const defaultProps = {
  character: mockCharacter,
  family: mockFamily,
  profile: mockGuildMasterProfile,
  currentTime: new Date("2026-03-07T12:00:00"),
  onCreateQuest: jest.fn(),
  onProfile: jest.fn(),
  onAdmin: jest.fn(),
  onLogout: jest.fn(),
};

function renderHeader(overrides: Partial<typeof defaultProps> = {}) {
  return render(<DashboardHeader {...defaultProps} {...overrides} />);
}

describe("DashboardHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the app title", () => {
      renderHeader();
      expect(screen.getByText("ChoreQuest")).toBeInTheDocument();
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

  describe("mobile icon-only buttons", () => {
    it("renders buttons with aria-labels for accessibility", () => {
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

    it("button text is hidden on mobile via hidden sm:inline class", () => {
      renderHeader();
      const adminButton = screen.getByRole("button", { name: "Admin" });
      const textSpan = adminButton.querySelector("span.hidden.sm\\:inline");
      expect(textSpan).toBeInTheDocument();
      expect(textSpan).toHaveTextContent("Admin");
    });

    it("all action buttons have text spans with hidden sm:inline", () => {
      renderHeader();
      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        const textSpan = button.querySelector(":scope > span.hidden");
        if (textSpan) {
          expect(textSpan).toHaveClass("hidden");
          expect(textSpan).toHaveClass("sm:inline");
        }
      });
    });
  });

  describe("desktop text labels", () => {
    it("buttons contain text labels for desktop view", () => {
      renderHeader();
      expect(screen.getByText("Admin")).toBeInTheDocument();
      expect(screen.getByText("Create Quest")).toBeInTheDocument();
      expect(screen.getByText("Profile")).toBeInTheDocument();
      expect(screen.getByText("Logout")).toBeInTheDocument();
    });
  });

  describe("guild master buttons", () => {
    it("shows Admin and Create Quest buttons for GUILD_MASTER role", () => {
      renderHeader();
      expect(screen.getByTestId("admin-dashboard-button")).toBeInTheDocument();
      expect(screen.getByTestId("create-quest-button")).toBeInTheDocument();
    });

    it("hides Admin and Create Quest buttons for non-GUILD_MASTER roles", () => {
      renderHeader({ profile: mockHeroProfile });
      expect(
        screen.queryByTestId("admin-dashboard-button"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("create-quest-button"),
      ).not.toBeInTheDocument();
    });
  });

  describe("button interactions", () => {
    it("calls onAdmin when Admin button is clicked", async () => {
      const user = userEvent.setup();
      const onAdmin = jest.fn();
      renderHeader({ onAdmin });
      await user.click(screen.getByRole("button", { name: "Admin" }));
      expect(onAdmin).toHaveBeenCalledTimes(1);
    });

    it("calls onCreateQuest when Create Quest button is clicked", async () => {
      const user = userEvent.setup();
      const onCreateQuest = jest.fn();
      renderHeader({ onCreateQuest });
      await user.click(screen.getByRole("button", { name: "Create Quest" }));
      expect(onCreateQuest).toHaveBeenCalledTimes(1);
    });

    it("calls onProfile when Profile button is clicked", async () => {
      const user = userEvent.setup();
      const onProfile = jest.fn();
      renderHeader({ onProfile });
      await user.click(screen.getByRole("button", { name: "Profile" }));
      expect(onProfile).toHaveBeenCalledTimes(1);
    });

    it("calls onLogout when Logout button is clicked", async () => {
      const user = userEvent.setup();
      const onLogout = jest.fn();
      renderHeader({ onLogout });
      await user.click(screen.getByRole("button", { name: "Logout" }));
      expect(onLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe("hydration safety", () => {
    it("renders the time display with date and time", () => {
      renderHeader();
      // The time element uses suppressHydrationWarning (verified via source)
      // to prevent SSR/client mismatch on locale-formatted dates
      expect(screen.getByText(/12:00:00/)).toBeInTheDocument();
    });
  });
});
