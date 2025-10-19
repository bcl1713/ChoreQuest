/**
 * Unit tests for AdminDashboard component
 * Tests tab navigation, URL persistence, and component rendering
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// Mock Next.js navigation hooks
const mockPush = jest.fn();
const mockGet = jest.fn();
const mockToString = jest.fn(() => "");

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock child components
jest.mock("@/components/admin/statistics-panel", () => {
  return function StatisticsPanel() {
    return <div data-testid="statistics-panel">Statistics Panel</div>;
  };
});

jest.mock("@/components/admin/activity-feed", () => {
  return function ActivityFeed() {
    return <div data-testid="activity-feed">Activity Feed</div>;
  };
});

jest.mock("@/components/admin/guild-master-manager", () => {
  return function GuildMasterManager() {
    return <div data-testid="guild-master-manager">Guild Master Manager</div>;
  };
});

jest.mock("@/components/family/family-settings", () => {
  return function FamilySettings() {
    return <div data-testid="family-settings">Family Settings</div>;
  };
});

jest.mock("@/components/quests/quest-template-manager", () => ({
  QuestTemplateManager: function QuestTemplateManager() {
    return <div data-testid="quest-template-manager">Quest Template Manager</div>;
  },
}));

jest.mock("@/components/rewards/reward-manager", () => {
  return function RewardManager() {
    return <div data-testid="reward-manager">Reward Manager</div>;
  };
});

jest.mock("@/components/admin/quest-management-tab", () => ({
  QuestManagementTab: function QuestManagementTab() {
    return <div data-testid="quest-management-tab">Quest Management Tab</div>;
  },
}));

// NOW import the component (after all mocks are set up)
import { AdminDashboard } from "@/components/admin/admin-dashboard";

describe("AdminDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (usePathname as jest.Mock).mockReturnValue("/app/admin");

    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
      toString: mockToString,
    });

    mockGet.mockReturnValue(null);
    mockToString.mockReturnValue("");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Tab Rendering", () => {
    it("should render all tab labels", () => {
      render(<AdminDashboard />);

      // Desktop labels (hidden sm:inline)
      expect(screen.getByText(/📊 Overview/)).toBeInTheDocument();
      expect(screen.getByText(/⚔️ Quest Management/)).toBeInTheDocument();
      expect(screen.getByText(/📜 Quest Templates/)).toBeInTheDocument();
      expect(screen.getByText(/🏆 Rewards/)).toBeInTheDocument();
      expect(screen.getByText(/👑 Guild Masters/)).toBeInTheDocument();
      expect(screen.getByText(/⚙️ Family Settings/)).toBeInTheDocument();
    });

    it("should render 6 tabs", () => {
      render(<AdminDashboard />);

      const tabs = screen.getAllByRole("tab");
      expect(tabs.length).toBe(6);
    });

    it("should have Overview tab selected by default", () => {
      render(<AdminDashboard />);

      const overviewTab = screen.getByRole("tab", { name: /📊 Overview/ });
      expect(overviewTab).toHaveClass("bg-gold-600");
    });

    it("should apply selected styling to active tab", () => {
      render(<AdminDashboard />);

      const overviewTab = screen.getByRole("tab", { name: /📊 Overview/ });
      expect(overviewTab.className).toContain("bg-gold-600");
      expect(overviewTab.className).toContain("text-white");
    });

    it("should apply hover styling to inactive tabs", () => {
      render(<AdminDashboard />);

      const questTab = screen.getByRole("tab", { name: /📜 Quest Templates/ });
      expect(questTab.className).toContain("text-gray-400");
      expect(questTab.className).toContain("hover:text-gray-200");
    });
  });

  describe("Tab Navigation", () => {
    it("should change tab when clicked", async () => {
      render(<AdminDashboard />);

      const guildMastersTab = screen.getByRole("tab", { name: /👑 Guild Masters/ });
      fireEvent.click(guildMastersTab);

      await waitFor(() => {
        expect(guildMastersTab).toHaveClass("bg-gold-600");
      });
    });

    it("should update URL with tab query param when tab changes", async () => {
      render(<AdminDashboard />);

      const rewardsTab = screen.getByRole("tab", { name: /🏆 Rewards/ });
      fireEvent.click(rewardsTab);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          "/app/admin?tab=rewards",
          expect.objectContaining({ scroll: false })
        );
      });
    });

    it("should preserve existing query params when changing tabs", () => {
      mockToString.mockReturnValue("foo=bar");

      render(<AdminDashboard />);

      const guildMastersTab = screen.getByRole("tab", { name: /👑 Guild Masters/ });
      fireEvent.click(guildMastersTab);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("tab=guild-masters"),
        expect.objectContaining({ scroll: false })
      );
    });

    it("should navigate between all tabs", async () => {
      render(<AdminDashboard />);

      // Skip Overview (already selected, won't trigger navigation)
      const tabs = [
        { name: /📜 Quest Templates/, param: "quest-templates" },
        { name: /🏆 Rewards/, param: "rewards" },
        { name: /👑 Guild Masters/, param: "guild-masters" },
        { name: /⚙️ Family Settings/, param: "family-settings" },
      ];

      for (const tab of tabs) {
        const tabElement = screen.getByRole("tab", { name: tab.name });
        fireEvent.click(tabElement);

        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith(
            `/app/admin?tab=${tab.param}`,
            expect.objectContaining({ scroll: false })
          );
        });
      }
    });
  });

  describe("URL Query Param Sync", () => {
    it("should select Overview tab when no query param", () => {
      mockGet.mockReturnValue(null);

      render(<AdminDashboard />);

      const overviewTab = screen.getByRole("tab", { name: /📊 Overview/ });
      expect(overviewTab).toHaveClass("bg-gold-600");
    });

    it("should select tab based on query param", () => {
      mockGet.mockReturnValue("guild-masters");

      render(<AdminDashboard />);

      const guildMastersTab = screen.getByRole("tab", { name: /👑 Guild Masters/ });
      expect(guildMastersTab).toHaveClass("bg-gold-600");
    });

    it("should handle quest-templates tab from URL", () => {
      mockGet.mockReturnValue("quest-templates");

      render(<AdminDashboard />);

      const questTab = screen.getByRole("tab", { name: /📜 Quest Templates/ });
      expect(questTab).toHaveClass("bg-gold-600");
    });

    it("should handle rewards tab from URL", () => {
      mockGet.mockReturnValue("rewards");

      render(<AdminDashboard />);

      const rewardsTab = screen.getByRole("tab", { name: /🏆 Rewards/ });
      expect(rewardsTab).toHaveClass("bg-gold-600");
    });

    it("should handle family-settings tab from URL", () => {
      mockGet.mockReturnValue("family-settings");

      render(<AdminDashboard />);

      const settingsTab = screen.getByRole("tab", { name: /⚙️ Family Settings/ });
      expect(settingsTab).toHaveClass("bg-gold-600");
    });

    it("should default to Overview for invalid tab param", () => {
      mockGet.mockReturnValue("invalid-tab");

      render(<AdminDashboard />);

      const overviewTab = screen.getByRole("tab", { name: /📊 Overview/ });
      expect(overviewTab).toHaveClass("bg-gold-600");
    });

    it("should sync tab selection on initial render with query param", () => {
      // Set query param BEFORE rendering
      mockGet.mockReturnValue("guild-masters");

      render(<AdminDashboard />);

      // Guild Masters tab should be selected on initial render
      expect(screen.getByRole("tab", { name: /👑 Guild Masters/ })).toHaveClass(
        "bg-gold-600"
      );

      // Overview should not be selected
      expect(screen.getByRole("tab", { name: /📊 Overview/ })).not.toHaveClass(
        "bg-gold-600"
      );
    });
  });

  describe("Tab Content Rendering", () => {
    it("should render Overview tab content by default", () => {
      render(<AdminDashboard />);

      expect(screen.getByTestId("statistics-panel")).toBeInTheDocument();
      expect(screen.getByTestId("activity-feed")).toBeInTheDocument();
    });

    it("should render StatisticsPanel in Overview tab", () => {
      render(<AdminDashboard />);

      expect(screen.getByText("Statistics Panel")).toBeInTheDocument();
    });

    it("should render ActivityFeed in Overview tab", () => {
      render(<AdminDashboard />);

      expect(screen.getByText("Activity Feed")).toBeInTheDocument();
    });

    it("should render Quest Templates when selected", async () => {
      render(<AdminDashboard />);

      const questTab = screen.getByRole("tab", { name: /📜 Quest Templates/ });
      fireEvent.click(questTab);

      await waitFor(() => {
        expect(screen.getByTestId("quest-template-manager")).toBeInTheDocument();
        expect(screen.getByText("Quest Template Manager")).toBeInTheDocument();
      });
    });

    it("should render Rewards when selected", async () => {
      render(<AdminDashboard />);

      const rewardsTab = screen.getByRole("tab", { name: /🏆 Rewards/ });
      fireEvent.click(rewardsTab);

      await waitFor(() => {
        expect(screen.getByTestId("reward-manager")).toBeInTheDocument();
        expect(screen.getByText("Reward Manager")).toBeInTheDocument();
      });
    });

    it("should render GuildMasterManager when Guild Masters tab selected", async () => {
      render(<AdminDashboard />);

      const guildTab = screen.getByRole("tab", { name: /👑 Guild Masters/ });
      fireEvent.click(guildTab);

      await waitFor(() => {
        expect(screen.getByTestId("guild-master-manager")).toBeInTheDocument();
        expect(screen.getByText("Guild Master Manager")).toBeInTheDocument();
      });
    });

    it("should render FamilySettings when Family Settings tab selected", async () => {
      render(<AdminDashboard />);

      const settingsTab = screen.getByRole("tab", { name: /⚙️ Family Settings/ });
      fireEvent.click(settingsTab);

      await waitFor(() => {
        expect(screen.getByTestId("family-settings")).toBeInTheDocument();
        expect(screen.getByText("Family Settings")).toBeInTheDocument();
      });
    });

    it("should not render inactive tab content", async () => {
      render(<AdminDashboard />);

      // Initially on Overview - guild manager should not be visible
      expect(screen.queryByTestId("guild-master-manager")).not.toBeInTheDocument();

      // Switch to Guild Masters
      const guildTab = screen.getByRole("tab", { name: /👑 Guild Masters/ });
      fireEvent.click(guildTab);

      await waitFor(() => {
        expect(screen.getByTestId("guild-master-manager")).toBeInTheDocument();
      });

      // Overview content should not be visible
      expect(screen.queryByTestId("statistics-panel")).not.toBeInTheDocument();
      expect(screen.queryByTestId("activity-feed")).not.toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("should have scrollable tab list for mobile", () => {
      render(<AdminDashboard />);

      const tabList = screen.getAllByRole("tab")[0].parentElement;
      expect(tabList?.className).toContain("overflow-x-auto");
    });

    it("should prevent tabs from shrinking for proper scrolling", () => {
      render(<AdminDashboard />);

      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab) => {
        expect(tab.className).toContain("flex-shrink-0");
      });
    });

    it("should have responsive text sizing", () => {
      render(<AdminDashboard />);

      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab) => {
        expect(tab.className).toContain("text-sm");
        expect(tab.className).toContain("sm:text-base");
      });
    });
  });

  describe("Tab Configuration", () => {
    it("should have correct tab order", () => {
      render(<AdminDashboard />);

      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveTextContent(/📊/);
      expect(tabs[1]).toHaveTextContent(/⚔️/);
      expect(tabs[2]).toHaveTextContent(/📜/);
      expect(tabs[3]).toHaveTextContent(/🏆/);
      expect(tabs[4]).toHaveTextContent(/👑/);
      expect(tabs[5]).toHaveTextContent(/⚙️/);
    });

    it("should use scroll: false when navigating", async () => {
      render(<AdminDashboard />);

      const rewardsTab = screen.getByRole("tab", { name: /🏆 Rewards/ });
      fireEvent.click(rewardsTab);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ scroll: false })
        );
      });
    });
  });

  describe("Navigation Edge Cases", () => {
    it("should handle rapid tab switching", async () => {
      render(<AdminDashboard />);

      const questTab = screen.getByRole("tab", { name: /📜 Quest Templates/ });
      const rewardsTab = screen.getByRole("tab", { name: /🏆 Rewards/ });
      const guildTab = screen.getByRole("tab", { name: /👑 Guild Masters/ });

      fireEvent.click(questTab);
      fireEvent.click(rewardsTab);
      fireEvent.click(guildTab);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledTimes(3);
      });

      // Last call should be for guild-masters
      expect(mockPush).toHaveBeenLastCalledWith(
        "/app/admin?tab=guild-masters",
        expect.objectContaining({ scroll: false })
      );
    });

    it("should maintain tab state after re-render", () => {
      const { rerender } = render(<AdminDashboard />);

      const guildTab = screen.getByRole("tab", { name: /👑 Guild Masters/ });
      fireEvent.click(guildTab);

      rerender(<AdminDashboard />);

      // Tab should still be selected
      expect(guildTab).toHaveClass("bg-gold-600");
    });
  });
});
