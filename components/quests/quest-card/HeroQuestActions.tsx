"use client";

import { Button } from "@/components/ui";
import type { QuestInstance } from "@/lib/types/database";

type HeroQuestActionsProps = {
  quest: QuestInstance;
  buttonVis: ReturnType<typeof import("./quest-card-helpers").getButtonVisibility>;
  onStart?: (questId: string) => void;
  onComplete?: (questId: string) => void;
  onPickup?: (quest: QuestInstance) => void;
  onRelease?: (questId: string) => void;
};

export function HeroQuestActions({
  quest,
  buttonVis,
  onStart,
  onComplete,
  onPickup,
  onRelease,
}: HeroQuestActionsProps) {
  if (
    !buttonVis.canStart &&
    !buttonVis.canComplete &&
    !buttonVis.canPickup &&
    !buttonVis.canAbandon
  ) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {buttonVis.canStart && onStart && (
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => onStart(quest.id)}
          data-testid="hero-start-quest"
        >
          Start Quest
        </Button>
      )}

      {buttonVis.canComplete && onComplete && (
        <Button
          type="button"
          variant="gold"
          size="sm"
          onClick={() => onComplete(quest.id)}
          data-testid="hero-complete-quest"
        >
          Complete Quest
        </Button>
      )}

      {buttonVis.canPickup && onPickup && (
        <Button
          type="button"
          variant="success"
          size="sm"
          onClick={() => onPickup(quest)}
          data-testid="hero-pickup-quest"
        >
          Pick Up Quest
        </Button>
      )}

      {buttonVis.canAbandon && onRelease && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onRelease(quest.id)}
          data-testid="hero-release-quest"
        >
          Abandon Quest
        </Button>
      )}
    </div>
  );
}
