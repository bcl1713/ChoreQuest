import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AdminDashboard } from "./admin-dashboard";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("@/components/admin/statistics-panel", () => () => (
  <div data-testid="statistics-panel">StatisticsPanel</div>
));
jest.mock("@/components/admin/activity-feed", () => () => (
  <div data-testid="activity-feed">ActivityFeed</div>
));
jest.mock("@/components/admin/guild-master-manager", () => () => (
  <div data-testid="guild-master-manager">GuildMasterManager</div>
));
jest.mock("@/components/family/family-settings", () => () => (
  <div data-testid="family-settings">FamilySettings</div>
));
jest.mock("@/components/quests/quest-template-manager", () => ({
  QuestTemplateManager: () => (
    <div data-testid="quest-template-manager">QuestTemplateManager</div>
  ),
}));
jest.mock("@/components/rewards/reward-manager", () => () => (
  <div data-testid="reward-manager">RewardManager</div>
));
jest.mock("@/components/admin/quest-management-tab", () => ({
  QuestManagementTab: () => (
    <div data-testid="quest-management-tab">QuestManagementTab</div>
  ),
}));

const mockPush = jest.fn();
const mockGet = jest.fn();
const mockToString = jest.fn(() => "");

describe("AdminDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue("/admin");
    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
      toString: mockToString,
    });
    mockGet.mockReturnValue(null);
  });

  describe("tab rendering", () => {
    it("renders all six tabs", () => {
      render(<AdminDashboard />);
      expect(screen.getByTestId("tab-overview")).toBeInTheDocument();
      expect(screen.getByTestId("tab-quests")).toBeInTheDocument();
      expect(screen.getByTestId("tab-quest-templates")).toBeInTheDocument();
      expect(screen.getByTestId("tab-rewards")).toBeInTheDocument();
      expect(screen.getByTestId("tab-guild-masters")).toBeInTheDocument();
      expect(screen.getByTestId("tab-family-settings")).toBeInTheDocument();
    });

    it("renders correct tab labels", () => {
      render(<AdminDashboard />);
      expect(screen.getByText("Overview")).toBeInTheDocument();
      expect(screen.getByText("Quest Management")).toBeInTheDocument();
      expect(screen.getByText("Quest Templates")).toBeInTheDocument();
      expect(screen.getByText("Rewards")).toBeInTheDocument();
      expect(screen.getByText("Guild Masters")).toBeInTheDocument();
      expect(screen.getByText("Family Settings")).toBeInTheDocument();
    });

    it("renders the admin-dashboard container", () => {
      render(<AdminDashboard />);
      expect(screen.getByTestId("admin-dashboard")).toBeInTheDocument();
    });
  });

  describe("tab panel content", () => {
    it("shows Overview panel content by default", () => {
      render(<AdminDashboard />);
      expect(screen.getByTestId("statistics-panel")).toBeInTheDocument();
      expect(screen.getByTestId("activity-feed")).toBeInTheDocument();
    });

    it("keeps all panel content mounted (unmount=false)", () => {
      render(<AdminDashboard />);
      expect(screen.getByTestId("statistics-panel")).toBeInTheDocument();
      expect(screen.getByTestId("quest-management-tab")).toBeInTheDocument();
      expect(screen.getByTestId("quest-template-manager")).toBeInTheDocument();
      expect(screen.getByTestId("reward-manager")).toBeInTheDocument();
      expect(screen.getByTestId("guild-master-manager")).toBeInTheDocument();
      expect(screen.getByTestId("family-settings")).toBeInTheDocument();
    });

    it("highlights Overview tab as active by default", () => {
      render(<AdminDashboard />);
      const overviewTab = screen.getByTestId("tab-overview");
      expect(overviewTab).toHaveClass("bg-gold-600");
    });

    it("switches active tab styling when a tab is clicked", async () => {
      render(<AdminDashboard />);
      const rewardsTab = screen.getByTestId("tab-rewards");
      fireEvent.click(rewardsTab);
      await waitFor(() => expect(rewardsTab).toHaveClass("bg-gold-600"));
    });
  });
});
