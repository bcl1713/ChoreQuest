"use client";
import React from "react";
import FamilyQuestClaiming from "@/components/family/family-quest-claiming";
import type { QuestInstance, Character } from "@/lib/types/database";

interface FamilyQuestSectionProps {
  quests: QuestInstance[];
  character: Character | null;
  onClaimQuest: (questId: string) => void;
}

export function FamilyQuestSection({
  quests,
  character,
  onClaimQuest,
}: FamilyQuestSectionProps) {
  if (!character || quests.length === 0) return null;

  return (
    <section>
      <FamilyQuestClaiming
        quests={quests}
        character={character}
        onClaimQuest={onClaimQuest}
      />
    </section>
  );
}
