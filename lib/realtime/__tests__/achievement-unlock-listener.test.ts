import { createListenerRegistry } from "../listener-registry";
import type { RealtimeEvent } from "../types";

const makeUnlockEvent = (
  overrides: Partial<RealtimeEvent> = {},
): RealtimeEvent => ({
  type: "achievement_unlock_updated",
  table: "character_achievements",
  action: "UPDATE",
  record: {
    id: "ca-1",
    character_id: "char-1",
    unlocked_at: "2026-01-01",
    notified: false,
  },
  old_record: {
    id: "ca-1",
    character_id: "char-1",
    unlocked_at: null,
    notified: false,
  },
  ...overrides,
});

describe("achievement unlock listener registry", () => {
  it("registers and receives an achievement unlock event", () => {
    const registry = createListenerRegistry();
    const listener = jest.fn();

    registry.add(listener);
    registry.emit(makeUnlockEvent());

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: "achievement_unlock_updated" }),
    );
  });

  it("delivers events to multiple registered listeners", () => {
    const registry = createListenerRegistry();
    const listenerA = jest.fn();
    const listenerB = jest.fn();

    registry.add(listenerA);
    registry.add(listenerB);
    registry.emit(makeUnlockEvent());

    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(1);
  });

  it("unsubscribing removes the listener from future events", () => {
    const registry = createListenerRegistry();
    const listener = jest.fn();

    const unsubscribe = registry.add(listener);
    unsubscribe();
    registry.emit(makeUnlockEvent());

    expect(listener).not.toHaveBeenCalled();
  });

  it("clear() removes all listeners", () => {
    const registry = createListenerRegistry();
    const listener = jest.fn();

    registry.add(listener);
    registry.clear();
    registry.emit(makeUnlockEvent());

    expect(listener).not.toHaveBeenCalled();
  });

  it("emits correct old_record on UPDATE events (null to non-null transition)", () => {
    const registry = createListenerRegistry();
    const listener = jest.fn();

    registry.add(listener);
    registry.emit(
      makeUnlockEvent({
        old_record: { id: "ca-1", unlocked_at: null },
        record: { id: "ca-1", unlocked_at: "2026-03-22", notified: false },
      }),
    );

    const event = listener.mock.calls[0][0] as RealtimeEvent;
    expect(event.old_record?.unlocked_at).toBeNull();
    expect(event.record.unlocked_at).toBe("2026-03-22");
  });
});
