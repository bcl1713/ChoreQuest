import { Listener, ListenerRegistry, RealtimeEvent } from "./types";

export const createListenerRegistry = (): ListenerRegistry => {
  const listeners = new Set<Listener>();
  const bufferedEvents: RealtimeEvent[] = [];
  const MAX_BUFFER_SIZE = 100;

  const add = (callback: Listener) => {
    listeners.add(callback);

    // Replay buffered events to the newly added listener synchronously
    // This ensures events are delivered in the correct order without timing issues
    if (bufferedEvents.length > 0) {
      const eventsToReplay = [...bufferedEvents];
      bufferedEvents.length = 0;
      eventsToReplay.forEach((event) => {
        callback(event);
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
