import { render, screen, within } from "@testing-library/react";
import { AdminUserDetailView } from "./admin-user-detail-view";
import type { AdminUserDetail } from "@/lib/admin-user-detail-service";

const baseDetail: AdminUserDetail = {
  user: {
    id: "hero-1",
    name: "Towner",
    email: "towner@example.test",
    role: "HERO",
    familyId: "family-1",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  },
  character: {
    id: "char-1",
    name: "Towner the Brave",
    class: "KNIGHT",
    level: 7,
    xp: 340,
    gold: 125,
    gems: 4,
    honor: 9,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  },
  questSummary: {
    active: 2,
    pendingApproval: 1,
    approved: 4,
    missed: 1,
    total: 8,
  },
  recentQuests: [
    {
      id: "quest-1",
      title: "Unload dishwasher",
      status: "APPROVED",
      dueDate: "2026-01-03T00:00:00Z",
      completedAt: "2026-01-02T12:00:00Z",
      approvedAt: "2026-01-02T13:00:00Z",
      goldReward: 5,
      xpReward: 10,
    },
  ],
  goldLedgerNotice:
    "Current gold is shown from the character record. Full ledger and audit history will land in a separate audit slice.",
};

describe("AdminUserDetailView", () => {
  it("renders the read-only profile, character summary, progression snapshot, and ledger placeholder", () => {
    render(<AdminUserDetailView detail={baseDetail} />);

    expect(screen.getByRole("heading", { name: "Towner" })).toBeInTheDocument();
    expect(screen.getByText("Hero"));
    expect(screen.getByText("Towner the Brave")).toBeInTheDocument();
    expect(screen.getByText("Knight")).toBeInTheDocument();
    expect(screen.getByText("Level 7")).toBeInTheDocument();
    expect(screen.getByText("340 XP")).toBeInTheDocument();
    expect(screen.getByText("125 Gold")).toBeInTheDocument();
    expect(screen.getByText("4 Gems")).toBeInTheDocument();
    expect(screen.getByText("9 Honor")).toBeInTheDocument();

    const snapshot = screen.getByTestId("admin-user-progression-snapshot");
    expect(within(snapshot).getByText("2 Active")).toBeInTheDocument();
    expect(within(snapshot).getByText("1 Awaiting Approval")).toBeInTheDocument();
    expect(within(snapshot).getByText("4 Approved")).toBeInTheDocument();
    expect(within(snapshot).getByText("1 Missed/Expired")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Recent Approved Quests" })).toBeInTheDocument();
    expect(screen.getByText("Unload dishwasher")).toBeInTheDocument();
    expect(screen.getByText(/Full ledger and audit history/)).toBeInTheDocument();
  });

  it("handles users with no character or quest data gracefully", () => {
    render(
      <AdminUserDetailView
        detail={{
          ...baseDetail,
          character: null,
          questSummary: { active: 0, pendingApproval: 0, approved: 0, missed: 0, total: 0 },
          recentQuests: [],
        }}
      />,
    );

    expect(screen.getByText(/No character has been created/i)).toBeInTheDocument();
    expect(screen.getByText(/No recent quests found/i)).toBeInTheDocument();
  });
});
