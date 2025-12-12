"use client";

import { CharacterProgressSection } from "./statistics/CharacterProgressSection";
import { FamilyTotalsGrid } from "./statistics/FamilyTotalsGrid";
import { BossBattlesSummary } from "./statistics/BossBattlesSummary";
import { QuestStatisticsCards } from "./statistics/QuestStatisticsCards";
import { StatisticsError, StatisticsSkeleton } from "./statistics/StatisticsFallbacks";
import { useFamilyStatistics } from "./statistics/useFamilyStatistics";
import { calculateChange } from "./statistics/statistics-utils";

export default function StatisticsPanel() {
  const { statistics, loading, error } = useFamilyStatistics();

  if (loading) {
    return <StatisticsSkeleton />;
  }

  if (error || !statistics) {
    return <StatisticsError message={error} />;
  }

  const weekChange = calculateChange(
    statistics.questsCompletedThisWeek,
    statistics.questsCompletedLastWeek
  );

  const monthChange = calculateChange(
    statistics.questsCompletedThisMonth,
    statistics.questsCompletedLastMonth
  );

  return (
    <div className="space-y-6" data-testid="statistics-panel">
      <QuestStatisticsCards statistics={statistics} weekChange={weekChange} monthChange={monthChange} />
      <FamilyTotalsGrid statistics={statistics} />
      <BossBattlesSummary summary={statistics.bossBattleSummary} />
      <CharacterProgressSection statistics={statistics} />
    </div>
  );
}
