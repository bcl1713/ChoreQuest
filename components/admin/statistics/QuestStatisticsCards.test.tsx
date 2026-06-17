"use client";

import { render, screen } from "@testing-library/react";
import { QuestStatisticsCards } from "./QuestStatisticsCards";
import type { FamilyStatistics } from "@/lib/statistics-service";

const baseStatistics: FamilyStatistics = {
  questsCompletedThisWeek: 5,
  questsCompletedThisMonth: 12,
  questsCompletedLastWeek: 2,
  questsCompletedLastMonth: 10,
  totalGoldEarned: 0,
  totalXpEarned: 0,
  totalGemsEarned: 0,
  totalHonorEarned: 0,
  characterProgress: [],
  mostActiveMember: null,
  pendingQuestApprovals: 1,
  pendingRewardRedemptions: 2,
  rewardRedemptionsThisWeek: 0,
  rewardRedemptionsThisMonth: 0,
  bossBattleSummary: {
    battlesThisWeek: 0,
    battlesThisMonth: 0,
    topParticipantWeek: null,
    topParticipantMonth: null,
  },
};

describe("QuestStatisticsCards", () => {
  it("renders quest counts and change indicators", () => {
    render(
      <QuestStatisticsCards statistics={baseStatistics} weekChange={150} monthChange={20} />
    );

    expect(screen.getByText("Quests This Week")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Last week: 2")).toBeInTheDocument();
    expect(screen.getByText("+150%")).toBeInTheDocument();

    expect(screen.getByText("Quests This Month")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Last month: 10")).toBeInTheDocument();
    expect(screen.getByText("+20%")).toBeInTheDocument();

    expect(screen.getByText("Pending Approvals")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1 quests")).toBeInTheDocument();
    expect(screen.getByText("2 redemptions")).toBeInTheDocument();
  });
});
