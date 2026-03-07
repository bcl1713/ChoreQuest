"use client";

import type { FamilyStatistics } from "@/lib/statistics-service";

export const calculateChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

export const getTopParticipant = (summary: FamilyStatistics["bossBattleSummary"]) => {
  if (summary.topParticipantWeek) {
    return {
      participant: summary.topParticipantWeek,
      label: "This Week",
    };
  }

  if (summary.topParticipantMonth) {
    return {
      participant: summary.topParticipantMonth,
      label: "This Month",
    };
  }

  return {
    participant: null,
    label: "This Week",
  };
};
