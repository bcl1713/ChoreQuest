"use client";

import { useAchievementNotifications } from "@/hooks/useAchievementNotifications";
import { AchievementUnlockToast } from "./AchievementUnlockToast";

type AchievementNotificationManagerProps = {
  characterId: string | null | undefined;
  familyId?: string | null;
};

export function AchievementNotificationManager({
  characterId,
  familyId,
}: AchievementNotificationManagerProps) {
  const { current, onDismiss } = useAchievementNotifications(
    characterId,
    familyId,
  );

  return (
    <AchievementUnlockToast notification={current} onDismiss={onDismiss} />
  );
}
