import React from "react";
import { render, screen } from "@testing-library/react";
import { AuthenticatedPageShell } from "./authenticated-page-shell";
import type { Character, Family, UserProfile } from "@/lib/types/database";
import { Crown } from "lucide-react";

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

const mockProfile: UserProfile = {
  id: "user-1",
  role: "GUILD_MASTER",
  display_name: "TestUser",
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
} as UserProfile;

const defaultProps = {
  character: mockCharacter,
  family: mockFamily,
  profile: mockProfile,
  currentTime: new Date("2026-03-07T12:00:00"),
  actions: <button>Test Action</button>,
};

function renderShell(
  overrides: Partial<typeof defaultProps> & {
    title?: string;
    titleIcon?: React.ReactNode;
  } = {},
  children: React.ReactNode = <p>Page content</p>,
) {
  return render(
    <AuthenticatedPageShell {...defaultProps} {...overrides}>
      {children}
    </AuthenticatedPageShell>,
  );
}

describe("AuthenticatedPageShell", () => {
  it("renders the gradient background", () => {
    renderShell();
    const wrapper = screen
      .getByText("Page content")
      .closest("div.min-h-screen");
    expect(wrapper).toHaveClass(
      "bg-gradient-to-br",
      "from-dark-900",
      "via-dark-800",
      "to-dark-900",
    );
  });

  it("renders children inside a main element", () => {
    renderShell();
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveTextContent("Page content");
  });

  it("renders the header with default title", () => {
    renderShell();
    expect(screen.getByText("ChoreQuest")).toBeInTheDocument();
  });

  it("renders the header with a custom title", () => {
    renderShell({ title: "Admin Dashboard" });
    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("ChoreQuest")).not.toBeInTheDocument();
  });

  it("renders a title icon when provided", () => {
    renderShell({
      title: "Admin Dashboard",
      titleIcon: <Crown data-testid="crown-icon" size={32} />,
    });
    expect(screen.getByTestId("crown-icon")).toBeInTheDocument();
  });

  it("renders guild info from family prop", () => {
    renderShell();
    expect(screen.getByText("TestGuild")).toBeInTheDocument();
    expect(screen.getByText(/TG123/)).toBeInTheDocument();
  });

  it("omits guild info when family is null", () => {
    renderShell({ family: null });
    expect(screen.queryByText("TestGuild")).not.toBeInTheDocument();
  });

  it("renders character name and level", () => {
    renderShell();
    expect(screen.getByText("TestHero")).toBeInTheDocument();
    expect(screen.getByText(/Level 5/)).toBeInTheDocument();
  });

  it("renders character class label", () => {
    renderShell();
    expect(screen.getByTestId("character-level")).toHaveTextContent(/Knight/);
  });

  it("renders the actions slot", () => {
    renderShell();
    expect(
      screen.getByRole("button", { name: "Test Action" }),
    ).toBeInTheDocument();
  });

  it("renders the current time", () => {
    renderShell();
    expect(screen.getByText(/12:00:00/)).toBeInTheDocument();
  });
});
