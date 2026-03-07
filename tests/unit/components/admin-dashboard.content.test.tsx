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

describe("AdminDashboard content", () => {
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

  describe("Tab Content Rendering", () => {
    it("should render Overview content by default", () => {
      render(<AdminDashboard />);
      expect(screen.getByTestId("statistics-panel")).toBeInTheDocument();
      expect(screen.getByTestId("activity-feed")).toBeInTheDocument();
    });

    it("should render Quest Management tab content", async () => {
      render(<AdminDashboard />);
      fireEvent.click(screen.getByRole("tab", { name: /Quest Management/ }));
      await waitFor(() => {
        expect(screen.getByTestId("quest-management-tab")).toBeInTheDocument();
      });
    });
  });

  describe("Responsive Design", () => {
    it("renders tab list with overflow scroll classes", () => {
      render(<AdminDashboard />);
      const tabList = screen.getByRole("tablist");
      expect(tabList.className).toContain("overflow-x-auto");
    });
  });

  describe("Tab Configuration", () => {
    it("should maintain correct ordering of tabs", () => {
      render(<AdminDashboard />);
      const tabLabels = screen
        .getAllByRole("tab")
        .map((tab) => tab.textContent);
      expect(tabLabels).toEqual([
        "Overview",
        "Quest Management",
        "Quest Templates",
        "Rewards",
        "Guild Masters",
        "Family Settings",
      ]);
    });
  });

  describe("Navigation Edge Cases", () => {
    it("should not push new URL when selecting same tab", async () => {
      render(<AdminDashboard />);
      const overviewTab = screen.getByRole("tab", { name: /Overview/ });
      fireEvent.click(overviewTab);
      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });
});
