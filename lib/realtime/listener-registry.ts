import { Listener, ListenerRegistry, RealtimeEvent } from "./types";

export const createListenerRegistry = (): ListenerRegistry => {
  const listeners = new Set<Listener>();
  const bufferedEvents: RealtimeEvent[] = [];
  const MAX_BUFFER_SIZE = 100;

  const add = (callback: Listener) => {
    listeners.add(callback);

    // Replay buffered events to the newly added listener
    if (bufferedEvents.length > 0) {
      // Clone the buffer to avoid issues if the listener modifies it
      const eventsToReplay = [...bufferedEvents];
      // Clear the buffer once we've queued replays
      bufferedEvents.length = 0;
      // Replay events asynchronously to avoid blocking
      eventsToReplay.forEach((event) => {
        // Use setTimeout to avoid synchronous recursion
        setTimeout(() => callback(event), 0);
      });
    }

    return () => listeners.delete(callback);
  };

  const emit = (event: RealtimeEvent) => {
    listeners.forEach((listener) => listener(event));

    // Buffer the event if no listeners are registered yet
    // This ensures events that arrive before listeners are set up aren't lost
    if (listeners.size === 0) {
      if (bufferedEvents.length < MAX_BUFFER_SIZE) {
        bufferedEvents.push(event);
      }
    }
  };

  const clear = () => {
    listeners.clear();
    bufferedEvents.length = 0;
  };

  return { add, emit, clear };
};
