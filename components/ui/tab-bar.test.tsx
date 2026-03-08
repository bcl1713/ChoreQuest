import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Home, Settings, User } from "lucide-react";
import { TabBar, type TabItem } from "./tab-bar";

type TestTab = "home" | "settings" | "profile";

const tabs: TabItem<TestTab>[] = [
  {
    id: "home",
    label: "Home Page",
    shortLabel: "Home",
    icon: Home,
    testId: "tab-home",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    testId: "tab-settings",
  },
  { id: "profile", label: "User Profile", icon: User },
];

describe("TabBar", () => {
  it("renders all provided tabs as buttons", () => {
    render(<TabBar tabs={tabs} activeTab="home" onTabChange={() => {}} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
  });

  it("applies active styling to the active tab", () => {
    render(<TabBar tabs={tabs} activeTab="home" onTabChange={() => {}} />);
    const activeButton = screen.getByTestId("tab-home");
    expect(activeButton).toHaveClass("text-gold-400");
    expect(activeButton).toHaveClass("border-gold-500");
    expect(activeButton).toHaveClass("bg-dark-700/50");
  });

  it("applies inactive styling to non-active tabs", () => {
    render(<TabBar tabs={tabs} activeTab="home" onTabChange={() => {}} />);
    const inactiveButton = screen.getByTestId("tab-settings");
    expect(inactiveButton).toHaveClass("text-gray-400");
    expect(inactiveButton).toHaveClass("border-transparent");
  });

  it("calls onTabChange when a tab is clicked", async () => {
    const user = userEvent.setup();
    const onTabChange = jest.fn();
    render(<TabBar tabs={tabs} activeTab="home" onTabChange={onTabChange} />);

    await user.click(screen.getByTestId("tab-settings"));
    expect(onTabChange).toHaveBeenCalledWith("settings");
    expect(onTabChange).toHaveBeenCalledTimes(1);
  });

  it("renders data-testid when provided", () => {
    render(<TabBar tabs={tabs} activeTab="home" onTabChange={() => {}} />);
    expect(screen.getByTestId("tab-home")).toBeInTheDocument();
    expect(screen.getByTestId("tab-settings")).toBeInTheDocument();
  });

  it("does not render data-testid when omitted", () => {
    render(<TabBar tabs={tabs} activeTab="home" onTabChange={() => {}} />);
    // The profile tab has no testId
    const buttons = screen.getAllByRole("button");
    const profileButton = buttons[2];
    expect(profileButton.getAttribute("data-testid")).toBeNull();
  });

  it("renders shortLabel in mobile span when provided", () => {
    render(<TabBar tabs={tabs} activeTab="home" onTabChange={() => {}} />);
    // Home tab has shortLabel="Home"
    const homeButton = screen.getByTestId("tab-home");
    const mobileSpan = homeButton.querySelector(".sm\\:hidden");
    expect(mobileSpan).toHaveTextContent("Home");

    // Desktop span shows full label
    const desktopSpan = homeButton.querySelector(".hidden.sm\\:inline");
    expect(desktopSpan).toHaveTextContent("Home Page");
  });

  it("falls back to first word when shortLabel is not provided", () => {
    render(<TabBar tabs={tabs} activeTab="home" onTabChange={() => {}} />);
    // Profile tab has label "User Profile" and no shortLabel
    const buttons = screen.getAllByRole("button");
    const profileButton = buttons[2];
    const mobileSpan = profileButton.querySelector(".sm\\:hidden");
    expect(mobileSpan).toHaveTextContent("User");
  });
});
