import React from "react";
import { render, act, screen } from "@testing-library/react";
import { CharacterProvider, useCharacter } from "./character-context";
import type { Listener } from "./realtime/types";
import type { Character } from "./types/database";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock("./network-ready-context", () => ({
  useNetworkReady: () => ({
    waitForReady: jest.fn().mockResolvedValue(undefined),
  }),
}));

let capturedCharacterListener: Listener | null = null;
const mockOnCharacterUpdate = jest.fn((cb: Listener) => {
  capturedCharacterListener = cb;
  return () => {
    capturedCharacterListener = null;
  };
});

jest.mock("./realtime-context", () => ({
  useRealtime: () => ({
    onCharacterUpdate: mockOnCharacterUpdate,
    isConnected: true,
    connectionError: null,
    onRewardUpdate: jest.fn(() => () => {}),
    onRewardRedemptionUpdate: jest.fn(() => () => {}),
    onFamilyMemberUpdate: jest.fn(() => () => {}),
    onQuestUpdate: jest.fn(() => () => {}),
    onQuestTemplateUpdate: jest.fn(() => () => {}),
    onBossQuestUpdate: jest.fn(() => () => {}),
    onBossParticipantUpdate: jest.fn(() => () => {}),
    onAchievementUnlockUpdate: jest.fn(() => () => {}),
    onFamilyAchievementUnlockUpdate: jest.fn(() => () => {}),
    refreshQuests: jest.fn(),
    refreshQuestTemplates: jest.fn(),
    refreshCharacters: jest.fn(),
    refreshRewards: jest.fn(),
  }),
}));

jest.mock("./auth-context", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    session: { user: { id: "user-1" }, access_token: "tok" },
  }),
}));

// Capture refs from the factory so tests can seed initial state
type SetCharacter = (c: Character | null) => void;
let capturedSetCharacter: SetCharacter | null = null;
let capturedPreviousLevelRef: { current: number | null } | null = null;

jest.mock("./character/fetch-character", () => ({
  createCharacterFetcher: (deps: {
    setCharacter: SetCharacter;
    previousLevelRef: { current: number | null };
  }) => {
    capturedSetCharacter = deps.setCharacter;
    capturedPreviousLevelRef = deps.previousLevelRef;
    return jest.fn().mockResolvedValue(undefined);
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseCharacter: Character = {
  id: "char-1",
  user_id: "user-1",
  name: "Aria",
  class: "MAGE",
  level: 2,
  xp: 100, // level 2: 50 <= xp < 200
  gold: 500,
  gems: 10,
  honor_points: 20,
  avatar_url: null,
  active_family_quest_id: null,
  last_class_change_at: null,
  created_at: null,
  updated_at: null,
};

function TestConsumer() {
  const { character, levelUpEvent } = useCharacter();
  return (
    <div>
      <span data-testid="xp">{character?.xp ?? "null"}</span>
      <span data-testid="level">{character?.level ?? "null"}</span>
      <span data-testid="gold">{character?.gold ?? "null"}</span>
      <span data-testid="is-null">{character === null ? "null" : "set"}</span>
      <span data-testid="level-up">
        {levelUpEvent
          ? `${levelUpEvent.oldLevel}->${levelUpEvent.newLevel}`
          : "none"}
      </span>
    </div>
  );
}

function renderProvider() {
  return render(
    <CharacterProvider>
      <TestConsumer />
    </CharacterProvider>,
  );
}

function emitCharacterEvent(
  action: "INSERT" | "UPDATE" | "DELETE",
  record: Record<string, unknown>,
) {
  act(() => {
    capturedCharacterListener?.({
      type: "character_updated",
      table: "characters",
      action,
      record,
    });
  });
}

function seedCharacter(c: Character = baseCharacter) {
  act(() => {
    capturedSetCharacter?.(c);
    // Mirror what fetchCharacter does: initialize previousLevelRef so level-up
    // detection works on subsequent realtime events.
    if (capturedPreviousLevelRef) {
      capturedPreviousLevelRef.current = c.level ?? 1;
    }
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  capturedCharacterListener = null;
  capturedSetCharacter = null;
  capturedPreviousLevelRef = null;
});

describe("CharacterContext realtime handler", () => {
  it("3.1: UPDATE event merges changed fields into existing character", () => {
    renderProvider();
    seedCharacter();

    expect(screen.getByTestId("gold").textContent).toBe("500");

    emitCharacterEvent("UPDATE", { user_id: "user-1", xp: 150, gold: 750 });

    expect(screen.getByTestId("xp").textContent).toBe("150");
    expect(screen.getByTestId("gold").textContent).toBe("750");
    // Fields not in the event payload should be preserved
    expect(screen.getByTestId("is-null").textContent).toBe("set");
  });

  it("3.2: Level-up fires setLevelUpEvent when XP crosses a threshold", () => {
    renderProvider();
    // Seed at level 2 (xp=100), previousLevelRef set to 2 during fetch-character mock
    seedCharacter({ ...baseCharacter, xp: 100, level: 2 });

    // xp=200 → level 3 (50*(3-1)^2=200), up from 2
    emitCharacterEvent("UPDATE", { user_id: "user-1", xp: 200 });

    expect(screen.getByTestId("level-up").textContent).toBe("2->3");
    expect(screen.getByTestId("level").textContent).toBe("3");
  });

  it("3.2: No level-up event when XP increases but level stays the same", () => {
    renderProvider();
    seedCharacter({ ...baseCharacter, xp: 100, level: 2 });

    // xp=120 still level 2 (120 < 200)
    emitCharacterEvent("UPDATE", { user_id: "user-1", xp: 120 });

    expect(screen.getByTestId("level-up").textContent).toBe("none");
    expect(screen.getByTestId("level").textContent).toBe("2");
  });

  it("3.3: Events for other users are silently ignored", () => {
    renderProvider();
    seedCharacter();

    emitCharacterEvent("UPDATE", { user_id: "other-user", xp: 9999, gold: 0 });

    // Original values unchanged
    expect(screen.getByTestId("xp").textContent).toBe("100");
    expect(screen.getByTestId("gold").textContent).toBe("500");
  });

  it("3.4: DELETE event sets character to null", () => {
    renderProvider();
    seedCharacter();

    expect(screen.getByTestId("is-null").textContent).toBe("set");

    emitCharacterEvent("DELETE", { user_id: "user-1" });

    expect(screen.getByTestId("is-null").textContent).toBe("null");
  });

  it("3.6: INSERT event sets character when state is initially null", () => {
    renderProvider();
    // Do NOT seed a character — state stays null

    expect(screen.getByTestId("is-null").textContent).toBe("null");

    emitCharacterEvent("INSERT", { ...baseCharacter, user_id: "user-1" });

    expect(screen.getByTestId("is-null").textContent).toBe("set");
    expect(screen.getByTestId("xp").textContent).toBe("100");
  });

  it("3.5: Rapid successive UPDATE events each apply via functional updater", () => {
    renderProvider();
    seedCharacter({ ...baseCharacter, gold: 0 });

    // Fire two updates synchronously — both should apply
    act(() => {
      capturedCharacterListener?.({
        type: "character_updated",
        table: "characters",
        action: "UPDATE",
        record: { user_id: "user-1", gold: 100 },
      });
      capturedCharacterListener?.({
        type: "character_updated",
        table: "characters",
        action: "UPDATE",
        record: { user_id: "user-1", gold: 200 },
      });
    });

    // Both updates applied; last one wins on gold
    expect(screen.getByTestId("gold").textContent).toBe("200");
  });
});
