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
  goldLedger: {
    entries: [
      {
        id: "ledger-1",
        createdAt: "2026-01-01T10:00:00Z",
        eventType: "OPENING_BALANCE",
        description: "Opening balance from pre-ledger gold",
        goldDelta: 100,
        direction: "credit",
        balanceBefore: 0,
        runningBalance: 100,
        actor: { id: "gm-1", name: "GM", email: "gm@example.test" },
        sourceType: "gold_ledger_remediation",
        sourceId: null,
        referenceLabel: "gold_ledger_remediation",
        metadata: { historical_strategy: "opening balance" },
      },
      {
        id: "ledger-2",
        createdAt: "2026-01-02T13:00:00Z",
        eventType: "QUEST_REWARD",
        description: "Quest reward approved",
        goldDelta: 5,
        direction: "credit",
        balanceBefore: 100,
        runningBalance: 105,
        actor: null,
        sourceType: "quest_instances",
        sourceId: "quest-1",
        referenceLabel: "quest_instances: quest-1",
        metadata: { xp_delta: 10 },
      },
      {
        id: "ledger-3",
        createdAt: "2026-01-03T13:00:00Z",
        eventType: "ADMIN_ADJUSTMENT",
        description: "Manual correction after duplicate award",
        goldDelta: -20,
        direction: "debit",
        balanceBefore: 105,
        runningBalance: 85,
        actor: { id: "gm-1", name: "GM", email: "gm@example.test" },
        sourceType: "admin_gold_adjustment",
        sourceId: "adjustment-1",
        referenceLabel: "admin_gold_adjustment: adjustment-1",
        metadata: {},
      },
    ],
    reconciliation: {
      currentGold: 125,
      ledgerBalance: 85,
      difference: 40,
      diverged: true,
    },
  },
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

    expect(screen.getByRole("heading", { name: "Gold Ledger" })).toBeInTheDocument();
    expect(screen.getByText(/Ledger balance differs from current character gold/i)).toBeInTheDocument();
    expect(screen.getAllByText("Opening Balance").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Quest Reward").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Admin Adjustment").length).toBeGreaterThan(0);
    expect(screen.getByText("+100 Gold")).toBeInTheDocument();
    expect(screen.getByText("-20 Gold")).toBeInTheDocument();
    expect(screen.getByText("85 Gold")).toBeInTheDocument();
    expect(screen.getAllByText("GM").length).toBeGreaterThan(0);
    expect(screen.getByText("quest_instances: quest-1")).toBeInTheDocument();
    expect(screen.getByText(/Opening, migration, and correction rows are explicit ledger controls/i)).toBeInTheDocument();
  });

  it("handles users with no character or quest data gracefully", () => {
    render(
      <AdminUserDetailView
        detail={{
          ...baseDetail,
          character: null,
          questSummary: { active: 0, pendingApproval: 0, approved: 0, missed: 0, total: 0 },
          recentQuests: [],
          goldLedger: {
            entries: [],
            reconciliation: {
              currentGold: null,
              ledgerBalance: 0,
              difference: null,
              diverged: false,
            },
          },
        }}
      />,
    );

    expect(screen.getByText(/No character has been created/i)).toBeInTheDocument();
    expect(screen.getByText(/No recent quests found/i)).toBeInTheDocument();
    expect(screen.getByText(/No ledger entries match the selected filters/i)).toBeInTheDocument();
  });
});
