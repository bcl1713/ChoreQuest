"use client";

import { useAchievementNotifications } from "@/hooks/useAchievementNotifications";
import { AchievementUnlockToast } from "./AchievementUnlockToast";

type AchievementNotificationManagerProps = {
  characterId: string | null | undefined;
};

export function AchievementNotificationManager({
  characterId,
}: AchievementNotificationManagerProps) {
  const { current, onDismiss } = useAchievementNotifications(characterId);

  return (
    <AchievementUnlockToast notification={current} onDismiss={onDismiss} />
  );
}
