import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

const mockPush = jest.fn();
const mockGet = jest.fn();
const mockToString = jest.fn(() => "");

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("@/components/admin/statistics-panel", () => () => (
  <div data-testid="statistics-panel">Statistics Panel</div>
));
jest.mock("@/components/admin/activity-feed", () => () => (
  <div data-testid="activity-feed">Activity Feed</div>
));
jest.mock("@/components/admin/guild-master-manager", () => () => (
  <div data-testid="guild-master-manager">Guild Master Manager</div>
));
jest.mock("@/components/family/family-settings", () => () => (
  <div data-testid="family-settings">Family Settings</div>
));
jest.mock("@/components/quests/quest-template-manager", () => ({
  QuestTemplateManager: () => (
    <div data-testid="quest-template-manager">Quest Template Manager</div>
  ),
}));
jest.mock("@/components/rewards/reward-manager", () => () => (
  <div data-testid="reward-manager">Reward Manager</div>
));
jest.mock("@/components/admin/quest-management-tab", () => ({
  QuestManagementTab: () => (
    <div data-testid="quest-management-tab">Quest Management Tab</div>
  ),
}));

describe("AdminDashboard navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue("/app/admin");
    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
      toString: mockToString,
    });
    mockGet.mockReturnValue(null);
    mockToString.mockReturnValue("");
  });

  describe("Tab Rendering", () => {
    it("should render all tab labels and default selection", () => {
      render(<AdminDashboard />);
      expect(screen.getByRole("tab", { name: /Overview/ })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /Quest Management/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /Quest Templates/ }),
      ).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Rewards/ })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /Guild Masters/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /Family Settings/ }),
      ).toBeInTheDocument();
      const overviewTab = screen.getByRole("tab", { name: /Overview/ });
      expect(overviewTab).toHaveClass("bg-gold-600");
    });
  });

  describe("Tab Navigation", () => {
    it("should change tab when clicked", async () => {
      render(<AdminDashboard />);
      const guildMastersTab = screen.getByRole("tab", {
        name: /Guild Masters/,
      });
      fireEvent.click(guildMastersTab);
      await waitFor(() => expect(guildMastersTab).toHaveClass("bg-gold-600"));
    });

    it("should update URL with tab query param when tab changes", async () => {
      render(<AdminDashboard />);
      const rewardsTab = screen.getByRole("tab", { name: /Rewards/ });
      fireEvent.click(rewardsTab);
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          "/app/admin?tab=rewards",
          expect.objectContaining({ scroll: false }),
        );
      });
    });

    it("should preserve existing query params when changing tabs", () => {
      mockToString.mockReturnValue("foo=bar");
      render(<AdminDashboard />);
      const guildMastersTab = screen.getByRole("tab", {
        name: /Guild Masters/,
      });
      fireEvent.click(guildMastersTab);
      expect(mockPush).toHaveBeenCalledWith(
        "/app/admin?foo=bar&tab=guild-masters",
        expect.anything(),
      );
    });
  });

  describe("URL Query Param Sync", () => {
    it("should set active tab from query param", () => {
      mockGet.mockReturnValue("rewards");
      render(<AdminDashboard />);
      const rewardsTab = screen.getByRole("tab", { name: /Rewards/ });
      expect(rewardsTab).toHaveClass("bg-gold-600");
    });

    it("should fall back to overview for invalid tabs", () => {
      mockGet.mockReturnValue("invalid");
      render(<AdminDashboard />);
      const overviewTab = screen.getByRole("tab", { name: /Overview/ });
      expect(overviewTab).toHaveClass("bg-gold-600");
    });
  });
});
