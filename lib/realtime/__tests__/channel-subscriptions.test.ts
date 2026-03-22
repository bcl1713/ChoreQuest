import { createFamilyRealtimeChannels } from "../channel-subscriptions";
import { createListenerRegistry } from "../listener-registry";

const mockOn = jest.fn().mockReturnThis();
const mockChannel = jest.fn(() => ({ on: mockOn }));

jest.mock("@/lib/supabase", () => ({
  supabase: { channel: (...args: unknown[]) => mockChannel(...args) },
}));

const FAMILY_ID = "family-123";

function makeRegistries() {
  return {
    quest: createListenerRegistry(),
    questTemplate: createListenerRegistry(),
    character: createListenerRegistry(),
    reward: createListenerRegistry(),
    rewardRedemption: createListenerRegistry(),
    familyMember: createListenerRegistry(),
    bossQuest: createListenerRegistry(),
    bossParticipant: createListenerRegistry(),
    achievementUnlock: createListenerRegistry(),
  };
}

describe("createFamilyRealtimeChannels", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChannel.mockReturnValue({ on: mockOn });
  });

  it("creates a channel for character_achievements", () => {
    const registries = makeRegistries();
    createFamilyRealtimeChannels(FAMILY_ID, registries);

    const channelNames = mockChannel.mock.calls.map((c) => c[0]);
    expect(channelNames).toContain(
      `family_${FAMILY_ID}_character_achievements`,
    );
  });

  it("subscribes to character_achievements without a family_id filter", () => {
    const registries = makeRegistries();
    createFamilyRealtimeChannels(FAMILY_ID, registries);

    const achIdx = mockChannel.mock.calls.findIndex(
      (c) => c[0] === `family_${FAMILY_ID}_character_achievements`,
    );
    expect(achIdx).toBeGreaterThanOrEqual(0);

    // The postgres_changes subscription options for that channel's .on() call
    const onCall = mockOn.mock.calls[achIdx];
    const opts = onCall[1] as Record<string, unknown>;
    expect(opts.table).toBe("character_achievements");
    expect(opts.filter).toBeUndefined();
  });

  it("maps achievement channel events to achievement_unlock_updated type", () => {
    const registries = makeRegistries();
    const emitSpy = jest.spyOn(registries.achievementUnlock, "emit");

    // Capture the postgres_changes callback for the achievement channel
    let achievementCallback: ((payload: unknown) => void) | null = null;
    mockChannel.mockImplementation((name: string) => {
      return {
        on: (_event: string, _opts: unknown, cb: (p: unknown) => void) => {
          if (name === `family_${FAMILY_ID}_character_achievements`) {
            achievementCallback = cb;
          }
          return { on: mockOn };
        },
      };
    });

    createFamilyRealtimeChannels(FAMILY_ID, registries);

    expect(achievementCallback).not.toBeNull();

    achievementCallback!({
      eventType: "UPDATE",
      new: { id: "ca-1", character_id: "char-1", unlocked_at: "2026-01-01" },
      old: { id: "ca-1", character_id: "char-1", unlocked_at: null },
    });

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "achievement_unlock_updated",
        table: "character_achievements",
        action: "UPDATE",
      }),
    );
  });

  it("creates channels for all expected tables including character_achievements", () => {
    const registries = makeRegistries();
    createFamilyRealtimeChannels(FAMILY_ID, registries);

    const channelNames = mockChannel.mock.calls.map((c) => c[0] as string);
    expect(channelNames).toContain(`family_${FAMILY_ID}_quest_instances`);
    expect(channelNames).toContain(`family_${FAMILY_ID}_characters`);
    expect(channelNames).toContain(
      `family_${FAMILY_ID}_character_achievements`,
    );
  });
});
