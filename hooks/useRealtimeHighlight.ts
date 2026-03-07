"use client";

import { useState, useCallback, useRef } from "react";

/**
 * Hook that tracks recently-updated item IDs for visual highlight effects.
 * Call `highlight(id)` when a realtime update occurs, and check `isHighlighted(id)`
 * to determine if the RealtimeUpdateEffect should be active for that item.
 *
 * Highlights auto-expire after the specified duration.
 *
 * @param duration - How long highlights last in ms (default: 600)
 */
export function useRealtimeHighlight(duration = 600) {
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const highlight = useCallback(
    (id: string) => {
      // Clear existing timer for this ID
      const existing = timersRef.current.get(id);
      if (existing) clearTimeout(existing);

      setHighlightedIds((prev) => new Set(prev).add(id));

      const timer = setTimeout(() => {
        setHighlightedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        timersRef.current.delete(id);
      }, duration);

      timersRef.current.set(id, timer);
    },
    [duration],
  );

  const isHighlighted = useCallback(
    (id: string) => highlightedIds.has(id),
    [highlightedIds],
  );

  return { highlight, isHighlighted };
}
