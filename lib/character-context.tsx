'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './auth-context';
import { useRealtime } from './realtime-context';
import { useNetworkReady } from './network-ready-context';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';
import { Character } from '@/lib/types/database';
import { RewardCalculator } from '@/lib/reward-calculator';

// Using Character type from @/lib/types/database

export interface LevelUpEvent {
  oldLevel: number;
  newLevel: number;
  characterName: string;
  characterClass: string;
}

interface CharacterContextType {
  character: Character | null;
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean; // true when character fetch completed (regardless of result)
  refreshCharacter: () => Promise<void>;
  levelUpEvent: LevelUpEvent | null;
  clearLevelUpEvent: () => void;
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

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

  const fetchCharacter = useCallback(async (): Promise<void> => {
    if (!user) {
      setCharacter(null);
      setIsLoading(false);
      // Don't set hasLoaded=true here - we haven't actually tried to fetch
      updateHasLoaded(false);
      isInitialLoadRef.current = true;
      isFetchingRef.current = false;
      fetchStartTimeRef.current = 0;
      retryCountRef.current = 0;
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      return;
    }

    // Wait for network to be ready before making any Supabase calls
    // This prevents HTTP request hangs on mobile browsers during page reload
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] CharacterContext: Waiting for network ready...`);
    await waitForReady();
    console.log(`[${new Date().toISOString()}] CharacterContext: Network ready, proceeding with fetch`);

    // Validate session via AuthContext to avoid hanging on Supabase auth.getSession()
    if (!session || !session.user) {
      const errorTimestamp = new Date().toISOString();
      console.error(`[${errorTimestamp}] CharacterContext: No active session from AuthContext, cannot fetch character`);
      setError('Session expired. Please log in again.');
      setIsLoading(false);
      updateHasLoaded(true);
      isFetchingRef.current = false;
      fetchStartTimeRef.current = 0;
      return;
    }
    console.log(`[${new Date().toISOString()}] CharacterContext: Session validated for user:`, session.user.id);


    // Safety valve: if fetch guard has been set for more than 5 seconds, force clear it
    // This prevents permanent hangs if finally block never executes
    const now = Date.now();
    if (isFetchingRef.current && fetchStartTimeRef.current > 0) {
      const elapsed = now - fetchStartTimeRef.current;
      if (elapsed > 5000) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] CharacterContext: Fetch guard stuck for ${elapsed}ms, force clearing`);
        isFetchingRef.current = false;
        // Also abort any stuck requests
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
      }
    }

    // If already fetching, skip this request (latest data will be fetched by running fetch)
    if (isFetchingRef.current) {
      const elapsed = now - fetchStartTimeRef.current;
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] CharacterContext: Fetch already in progress (${elapsed}ms elapsed), skipping`);
      return;
    }

    isFetchingRef.current = true;
    fetchStartTimeRef.current = now;

    const startTimestamp = new Date().toISOString();
    console.log(`[${startTimestamp}] CharacterContext: Fetching character for user:`, user.id);

    // Set loading state to true whenever we fetch
    // This ensures UI shows proper loading feedback
    setIsLoading(true);
    setError(null);

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      // Add timeout to prevent infinite hanging
      // Use longer timeout (15s) to handle slow database queries during E2E tests

      // Create a timeout that will reject if fetch takes too long
      let timeoutId: NodeJS.Timeout | null = null;
      let didTimeout = false;

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          didTimeout = true;
          // Abort the request when timeout occurs
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
          reject(new Error('Character fetch timeout after 15s'));
        }, 15000);
      });

      // Start the fetch
      const fetchPromise = (async () => {
        const restUrl = new URL('/rest/v1/characters', SUPABASE_URL);
        restUrl.searchParams.set('select', '*');
        restUrl.searchParams.set('user_id', `eq.${user.id}`);

        const requestInit: RequestInit = {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.access_token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
          cache: 'no-store',
          signal: abortControllerRef.current?.signal,
        };

        const logLabel = `${restUrl.pathname}${restUrl.search}`;
        console.log(`[${new Date().toISOString()}] CharacterContext: REST fetch start ${logLabel}`);

        const response = await fetch(restUrl.toString(), requestInit);

        console.log(`[${new Date().toISOString()}] CharacterContext: REST fetch status ${response.status} for ${logLabel}`);

        if (timeoutId && !didTimeout) {
          clearTimeout(timeoutId);
        }

        if (response.status === 404 || response.status === 406) {
          return { data: null as Character | null };
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(`Supabase REST error ${response.status}: ${errorText}`);
        }

        const rows = await response.json();
        const record = Array.isArray(rows) ? rows[0] ?? null : rows;
        return { data: record as Character | null };
      })();

      const { data } = await Promise.race([fetchPromise, timeoutPromise]);

      if (!data) {
        console.log('CharacterContext: No character found for user');
        setCharacter(null);
        previousLevelRef.current = null;
      } else {
        console.log('CharacterContext: Character fetched successfully:', data);

        const rawLevel = typeof (data as { level?: number | string | null }).level === 'number'
          ? (data as { level: number }).level
          : Number((data as { level?: number | string | null }).level ?? 0);
        const derivedLevel = RewardCalculator.calculateLevelFromTotalXP(
          Number((data as { xp?: number | null }).xp ?? 0)
        );
        const currentLevel = Math.max(
          1,
          Number.isFinite(rawLevel) ? Math.floor(rawLevel) : 1,
          derivedLevel
        );

        if (previousLevelRef.current !== null && currentLevel > previousLevelRef.current) {
          console.log(`CharacterContext: Level up detected! ${previousLevelRef.current} -> ${currentLevel}`);
          setLevelUpEvent({
            oldLevel: previousLevelRef.current,
            newLevel: currentLevel,
            characterName: (data as { name?: string }).name ?? 'Adventurer',
            characterClass: (data as { class?: string }).class || 'Adventurer',
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
      // Calculate duration BEFORE clearing the timestamp
      const fetchDuration = fetchStartTimeRef.current > 0
        ? Date.now() - fetchStartTimeRef.current
        : 0;
      const errorTimestamp = new Date().toISOString();
      const message = err instanceof Error ? err.message : 'Failed to fetch character';

      // Don't log errors for aborted requests (expected during cleanup)
      if (err instanceof Error && err.name === 'AbortError') {
        console.log(`[${errorTimestamp}] CharacterContext: Fetch aborted (expected during cleanup)`);
        return;
      }

      console.error(`[${errorTimestamp}] CharacterContext: Character fetch error after ${fetchDuration}ms for user ${user.id}:`, err);

      // Retry logic with exponential backoff: 1s, 2s, 4s (max 3 retries)
      const MAX_RETRIES = 3;
      if (retryCountRef.current < MAX_RETRIES) {
        const retryDelay = Math.pow(2, retryCountRef.current) * 1000; // Exponential backoff
        retryCountRef.current++;
        console.log(`[${errorTimestamp}] CharacterContext: Retrying fetch (attempt ${retryCountRef.current}/${MAX_RETRIES}) after ${retryDelay}ms...`);

        // Clear fetch guard to allow retry, but preserve timestamps for accurate duration logging
        isFetchingRef.current = false;
        abortControllerRef.current = null;

        // Wait with exponential backoff before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));

        // Retry the fetch (will set new timestamp)
        // NOTE: Return here prevents finally block from running
        return await fetchCharacter();
      }

      // After all retries exhausted, set error
      setError(message);
      console.error(`[${errorTimestamp}] CharacterContext: All retry attempts exhausted`);
    } finally {
      // Only clean up if we're not going to retry
      // Mark as loaded and clear loading state
      updateHasLoaded(true);
      setIsLoading(false);
      isInitialLoadRef.current = false;
      isFetchingRef.current = false;
      fetchStartTimeRef.current = 0;
      abortControllerRef.current = null;
    }
  }, [user, session, updateHasLoaded, waitForReady]);

  useEffect(() => {
    fetchCharacter();
  }, [fetchCharacter]);

  // Add visibility change listener to clear stuck fetch guard
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] CharacterContext: Tab became visible`);

        // If fetch guard has been set for more than 2 seconds, clear it
        const now = Date.now();
        if (isFetchingRef.current && fetchStartTimeRef.current > 0) {
          const elapsed = now - fetchStartTimeRef.current;
          if (elapsed > 2000) {
            console.log(`[${timestamp}] CharacterContext: Clearing stuck fetch guard (${elapsed}ms) on visibility change`);
            isFetchingRef.current = false;
            fetchStartTimeRef.current = 0;
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Set up realtime character update listener to automatically refresh
  // when character stats change (e.g., after quest approval by Guild Master)
  useEffect(() => {
    if (!user || !onCharacterUpdate) return;

    console.log('CharacterContext: Setting up realtime subscription for user:', user.id);

    const unsubscribe = onCharacterUpdate((event) => {
      console.log('CharacterContext: Received realtime event:', event);
      console.log('CharacterContext: Current user ID:', user.id);
      console.log('CharacterContext: Event user ID:', event.record?.user_id);

      // Only refresh if this is our character being updated
      if (event.record?.user_id === user.id) {
        console.log('CharacterContext: Event matches current user, refreshing character data');
        // Automatically refresh character data when realtime event detected
        fetchCharacter().catch(console.error);
      } else {
        console.log('CharacterContext: Event does not match current user, ignoring');
      }
    });

    return unsubscribe;
  }, [user, onCharacterUpdate, fetchCharacter]);

  const refreshCharacter = async () => {
    await fetchCharacter();
  };

  const clearLevelUpEvent = useCallback(() => {
    setLevelUpEvent(null);
  }, []);

  return (
    <CharacterContext.Provider value={{
      character,
      isLoading,
      error,
      hasLoaded,
      refreshCharacter,
      levelUpEvent,
      clearLevelUpEvent
    }}>
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter() {
  const context = useContext(CharacterContext);
  if (context === undefined) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
}
