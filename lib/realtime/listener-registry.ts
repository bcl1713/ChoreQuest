import { Listener, ListenerRegistry, RealtimeEvent } from "./types";

export const createListenerRegistry = (): ListenerRegistry => {
  const listeners = new Set<Listener>();

  const add = (callback: Listener) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  };

  const emit = (event: RealtimeEvent) => {
    listeners.forEach((listener) => listener(event));
  };

  const clear = () => listeners.clear();

  return { add, emit, clear };
};
