'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './auth-context';
import { useRealtime } from './realtime-context';
import { supabase } from './supabase';
import { Character } from '@/lib/types/database';

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
  const { user } = useAuth();
  const { onCharacterUpdate } = useRealtime();
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

  // Detect if we're on a mobile browser
  const isMobileBrowser = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const userAgent = navigator.userAgent || navigator.vendor || '';
    return /android|iphone|ipad|ipod/i.test(userAgent);
  }, []);

  const fetchCharacter = useCallback(async () => {
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

    // On mobile browsers during initial load, wait for page to fully load
    // This prevents race conditions with browser lifecycle during page refresh
    const isMobile = isMobileBrowser();
    const readyState = typeof window !== 'undefined' ? document.readyState : 'complete';
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] CharacterContext: Mobile=${isMobile}, InitialLoad=${isInitialLoadRef.current}, ReadyState=${readyState}`);

    if (isMobile && isInitialLoadRef.current && typeof window !== 'undefined' && readyState !== 'complete') {
      console.log(`[${timestamp}] CharacterContext: Mobile browser detected, waiting for page load...`);

      return new Promise<void>((resolve) => {
        const handler = () => {
          console.log(`[${new Date().toISOString()}] CharacterContext: Page loaded, proceeding with fetch`);
          window.removeEventListener('load', handler);
          fetchCharacter().then(resolve);
        };
        window.addEventListener('load', handler);
      });
    }

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
        const result = await supabase
          .from('characters')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // Clear timeout if we finished before it fired
        if (timeoutId && !didTimeout) {
          clearTimeout(timeoutId);
        }

        return result;
      })();

      const result = await Promise.race([fetchPromise, timeoutPromise]);
      const { data, error } = result;

      if (error) {
        if (error.code === 'PGRST116') {
          // No character found - this is not an error, just no character created yet
          console.log('CharacterContext: No character found for user');
          setCharacter(null);
        } else {
          throw error;
        }
      } else {
        // Use Supabase data directly
        console.log('CharacterContext: Character fetched successfully:', data);

        // Check for level up
        if (previousLevelRef.current !== null && data.level > previousLevelRef.current) {
          console.log(`CharacterContext: Level up detected! ${previousLevelRef.current} -> ${data.level}`);
          setLevelUpEvent({
            oldLevel: previousLevelRef.current,
            newLevel: data.level,
            characterName: data.name,
            characterClass: data.class || 'Adventurer',
          });
        }

        // Update previous level reference
        previousLevelRef.current = data.level;

        setCharacter(data);
        retryCountRef.current = 0; // Reset retry count on success
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

        // Clear fetch guard to allow retry
        isFetchingRef.current = false;
        // DON'T reset timestamp yet - let the next attempt set it
        abortControllerRef.current = null;

        // Wait with exponential backoff before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));

        // Retry the fetch (will set new timestamp)
        return fetchCharacter();
      }

      // After all retries exhausted, set error
      setError(message);
      console.error(`[${errorTimestamp}] CharacterContext: All retry attempts exhausted`);
    } finally {
      // Mark as loaded and clear loading state
      updateHasLoaded(true);
      setIsLoading(false);
      isInitialLoadRef.current = false;
      isFetchingRef.current = false;
      fetchStartTimeRef.current = 0;
      abortControllerRef.current = null;
    }
  }, [user, updateHasLoaded, isMobileBrowser]);

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
