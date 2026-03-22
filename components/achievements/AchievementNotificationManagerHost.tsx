"use client";

import { useCharacter } from "@/lib/character-context";
import { AchievementNotificationManager } from "./AchievementNotificationManager";

/**
 * Thin host component that reads the current character from context
 * and passes the characterId to the notification manager.
 * Placed inside CharacterProvider in the root layout.
 */
export function AchievementNotificationManagerHost() {
  const { character } = useCharacter();
  return <AchievementNotificationManager characterId={character?.id} />;
}
