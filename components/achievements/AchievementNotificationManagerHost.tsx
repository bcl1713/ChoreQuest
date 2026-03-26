"use client";

import { useCharacter } from "@/lib/character-context";
import { useAuth } from "@/lib/auth-context";
import { AchievementNotificationManager } from "./AchievementNotificationManager";

/**
 * Thin host component that reads the current character and family from context
 * and passes them to the notification manager.
 * Placed inside CharacterProvider in the root layout.
 */
export function AchievementNotificationManagerHost() {
  const { character } = useCharacter();
  const { profile } = useAuth();
  return (
    <AchievementNotificationManager
      characterId={character?.id}
      familyId={profile?.family_id}
    />
  );
}
