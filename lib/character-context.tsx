"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useAuth } from "./auth-context";
import { useRealtime } from "./realtime-context";
import { useNetworkReady } from "./network-ready-context";
import { Character } from "@/lib/types/database";
import { createCharacterFetcher } from "./character/fetch-character";
import { RewardCalculator } from "./reward-calculator";
import type { LevelUpEvent } from "./character/types";

interface CharacterContextType {
  character: Character | null;
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean; // true when character fetch completed (regardless of result)
  refreshCharacter: () => Promise<void>;
  levelUpEvent: LevelUpEvent | null;
  clearLevelUpEvent: () => void;
}

const CharacterContext = createContext<CharacterContextType | undefined>(
  undefined,
);

export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth();
  const { onCharacterUpdate } = useRealtime();
  const { waitForReady } = useNetworkReady();
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with true to prevent premature redirects
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false); // Track if character fetch completed
  const [levelUpEvent, setLevelUpEvent] = useState<LevelUpEvent | null>(null);
  const hasLoadedRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const isFetchingRef = useRef(false);
  const fetchStartTimeRef = useRef<number>(0);
  const previousLevelRef = useRef<number | null>(null);

  const updateHasLoaded = useCallback((value: boolean) => {
    hasLoadedRef.current = value;
    setHasLoaded(value);
  }, []);

  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchCharacter = useMemo(
    () =>
      createCharacterFetcher({
        user,
        session,
        waitForReady,
        setCharacter,
        setIsLoading,
        setError,
        updateHasLoaded,
        setLevelUpEvent,
        isInitialLoadRef,
        isFetchingRef,
        fetchStartTimeRef,
        previousLevelRef,
        retryCountRef,
        abortControllerRef,
      }),
    [user, session, waitForReady, updateHasLoaded],
  );

  useEffect(() => {
    fetchCharacter();
  }, [fetchCharacter]);

  // Add visibility change listener to clear stuck fetch guard
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] CharacterContext: Tab became visible`);

        // If fetch guard has been set for more than 2 seconds, clear it
        const now = Date.now();
        if (isFetchingRef.current && fetchStartTimeRef.current > 0) {
          const elapsed = now - fetchStartTimeRef.current;
          if (elapsed > 2000) {
            console.log(
              `[${timestamp}] CharacterContext: Clearing stuck fetch guard (${elapsed}ms) on visibility change`,
            );
            isFetchingRef.current = false;
            fetchStartTimeRef.current = 0;
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Set up realtime character update listener — merges event payload in-place
  // instead of refetching, matching the pattern used by useQuests/useRewards.
  useEffect(() => {
    if (!user || !onCharacterUpdate) return;

    const unsubscribe = onCharacterUpdate((event) => {
      if (event.record?.user_id !== user.id) return;

      if (event.action === "DELETE") {
        setCharacter(null);
        previousLevelRef.current = null;
        return;
      }

      if (event.action === "UPDATE" || event.action === "INSERT") {
        setCharacter((prev) => {
          const baseCharacter = prev ?? ({} as Partial<Character>);
          const merged = { ...baseCharacter, ...event.record } as Character;
          const newLevel = Math.max(
            1,
            RewardCalculator.calculateLevelFromTotalXP(merged.xp ?? 0),
          );
          merged.level = newLevel;

          if (
            previousLevelRef.current !== null &&
            newLevel > previousLevelRef.current
          ) {
            setLevelUpEvent({
              oldLevel: previousLevelRef.current,
              newLevel,
              characterName: merged.name ?? "Adventurer",
              characterClass: (merged.class as string) || "Adventurer",
            });
          }
          previousLevelRef.current = newLevel;

          return merged;
        });
      }
    });

    return unsubscribe;
  }, [user, onCharacterUpdate]);

  const refreshCharacter = async () => {
    await fetchCharacter();
  };

  const clearLevelUpEvent = useCallback(() => {
    setLevelUpEvent(null);
  }, []);

  return (
    <CharacterContext.Provider
      value={{
        character,
        isLoading,
        error,
        hasLoaded,
        refreshCharacter,
        levelUpEvent,
        clearLevelUpEvent,
      }}
    >
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter() {
  const context = useContext(CharacterContext);
  if (context === undefined) {
    throw new Error("useCharacter must be used within a CharacterProvider");
  }
  return context;
}
