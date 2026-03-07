import { RewardCalculator } from "@/lib/reward-calculator";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase";
import type { Character } from "@/lib/types/database";
import type { CharacterState, LevelUpEvent } from "./types";
import type { MutableRefObject, Dispatch, SetStateAction } from "react";

type CharacterFetcherDeps = {
  user: { id: string } | null;
  session: { user?: { id?: string } | null; access_token?: string | null } | null;
  waitForReady: () => Promise<void>;
  setCharacter: Dispatch<SetStateAction<CharacterState>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  updateHasLoaded: (value: boolean) => void;
  setLevelUpEvent: Dispatch<SetStateAction<LevelUpEvent | null>>;
  isInitialLoadRef: MutableRefObject<boolean>;
  isFetchingRef: MutableRefObject<boolean>;
  fetchStartTimeRef: MutableRefObject<number>;
  previousLevelRef: MutableRefObject<number | null>;
  retryCountRef: MutableRefObject<number>;
  abortControllerRef: MutableRefObject<AbortController | null>;
};

export const createCharacterFetcher = (deps: CharacterFetcherDeps) => {
  const {
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
  } = deps;

  return async (): Promise<void> => {
    if (!user) {
      setCharacter(null);
      setIsLoading(false);
      updateHasLoaded(false);
      isInitialLoadRef.current = true;
      isFetchingRef.current = false;
      fetchStartTimeRef.current = 0;
      retryCountRef.current = 0;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      return;
    }

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] CharacterContext: Waiting for network ready...`);
    await waitForReady();
    console.log(`[${new Date().toISOString()}] CharacterContext: Network ready, proceeding with fetch`);

    if (!session || !session.user) {
      const errorTimestamp = new Date().toISOString();
      console.error(
        `[${errorTimestamp}] CharacterContext: No active session from AuthContext, cannot fetch character`
      );
      setError("Session expired. Please log in again.");
      setIsLoading(false);
      updateHasLoaded(true);
      isFetchingRef.current = false;
      fetchStartTimeRef.current = 0;
      return;
    }
    console.log(`[${new Date().toISOString()}] CharacterContext: Session validated for user:`, session.user.id);

    const now = Date.now();
    if (isFetchingRef.current && fetchStartTimeRef.current > 0) {
      const elapsed = now - fetchStartTimeRef.current;
      if (elapsed > 5000) {
        const stuckTimestamp = new Date().toISOString();
        console.error(`[${stuckTimestamp}] CharacterContext: Fetch guard stuck for ${elapsed}ms, force clearing`);
        isFetchingRef.current = false;
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
      }
    }

    if (isFetchingRef.current) {
      const elapsed = now - fetchStartTimeRef.current;
      const logTimestamp = new Date().toISOString();
      console.log(`[${logTimestamp}] CharacterContext: Fetch already in progress (${elapsed}ms elapsed), skipping`);
      return;
    }

    isFetchingRef.current = true;
    fetchStartTimeRef.current = now;

    const startTimestamp = new Date().toISOString();
    console.log(`[${startTimestamp}] CharacterContext: Fetching character for user:`, user.id);

    setIsLoading(true);
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      let timeoutId: NodeJS.Timeout | null = null;
      let didTimeout = false;

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          didTimeout = true;
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
          reject(new Error("Character fetch timeout after 15s"));
        }, 15000);
      });

      const fetchPromise = (async () => {
        const restUrl = new URL("/rest/v1/characters", SUPABASE_URL);
        restUrl.searchParams.set("select", "*");
        restUrl.searchParams.set("user_id", `eq.${user.id}`);

        const requestInit: RequestInit = {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.access_token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
          cache: "no-store",
          signal: abortControllerRef.current?.signal,
        };

        const logLabel = `${restUrl.pathname}${restUrl.search}`;
        console.log(`[${new Date().toISOString()}] CharacterContext: REST fetch start ${logLabel}`);

        const response = await fetch(restUrl.toString(), requestInit);

        console.log(
          `[${new Date().toISOString()}] CharacterContext: REST fetch status ${response.status} for ${logLabel}`
        );

        if (timeoutId && !didTimeout) {
          clearTimeout(timeoutId);
        }

        if (response.status === 404 || response.status === 406) {
          return { data: null as Character | null };
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          throw new Error(`Supabase REST error ${response.status}: ${errorText}`);
        }

        const rows = await response.json();
        const record = Array.isArray(rows) ? rows[0] ?? null : rows;
        return { data: record as Character | null };
      })();

      const { data } = await Promise.race([fetchPromise, timeoutPromise]);

      if (!data) {
        console.log("CharacterContext: No character found for user");
        setCharacter(null);
        previousLevelRef.current = null;
      } else {
        console.log("CharacterContext: Character fetched successfully:", data);

        const rawLevel =
          typeof (data as { level?: number | string | null }).level === "number"
            ? (data as { level: number }).level
            : Number((data as { level?: number | string | null }).level ?? 0);
        const derivedLevel = RewardCalculator.calculateLevelFromTotalXP(
          Number((data as { xp?: number | null }).xp ?? 0)
        );
        const currentLevel = Math.max(1, Number.isFinite(rawLevel) ? Math.floor(rawLevel) : 1, derivedLevel);

        if (previousLevelRef.current !== null && currentLevel > previousLevelRef.current) {
          console.log(`CharacterContext: Level up detected! ${previousLevelRef.current} -> ${currentLevel}`);
          setLevelUpEvent({
            oldLevel: previousLevelRef.current,
            newLevel: currentLevel,
            characterName: (data as { name?: string }).name ?? "Adventurer",
            characterClass: (data as { class?: string }).class || "Adventurer",
          });
        }

        previousLevelRef.current = currentLevel;

        const nextCharacter: Character = {
          ...(data as Character),
          level: currentLevel,
        };

        setCharacter(nextCharacter);
        retryCountRef.current = 0;
      }
    } catch (err) {
      const fetchDuration = fetchStartTimeRef.current > 0 ? Date.now() - fetchStartTimeRef.current : 0;
      const errorTimestamp = new Date().toISOString();
      const message = err instanceof Error ? err.message : "Failed to fetch character";

      if (err instanceof Error && err.name === "AbortError") {
        console.log(`[${errorTimestamp}] CharacterContext: Fetch aborted (expected during cleanup)`);
        return;
      }

      console.error(
        `[${errorTimestamp}] CharacterContext: Character fetch error after ${fetchDuration}ms for user ${user.id}:`,
        err
      );

      const MAX_RETRIES = 3;
      if (retryCountRef.current < MAX_RETRIES) {
        const retryDelay = Math.pow(2, retryCountRef.current) * 1000;
        retryCountRef.current++;
        console.log(
          `[${errorTimestamp}] CharacterContext: Retrying fetch (attempt ${retryCountRef.current}/${MAX_RETRIES}) after ${retryDelay}ms...`
        );

        isFetchingRef.current = false;
        abortControllerRef.current = null;

        await new Promise((resolve) => setTimeout(resolve, retryDelay));

        return await createCharacterFetcher(deps)();
      }

      setError(message);
      console.error(`[${errorTimestamp}] CharacterContext: All retry attempts exhausted`);
    } finally {
      updateHasLoaded(true);
      setIsLoading(false);
      isInitialLoadRef.current = false;
      isFetchingRef.current = false;
      fetchStartTimeRef.current = 0;
      abortControllerRef.current = null;
    }
  };
};
