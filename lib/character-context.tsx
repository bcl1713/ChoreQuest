'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './auth-context';
import { useRealtime } from './realtime-context';
import { supabase } from './supabase';
import { Character } from '@/lib/types/database';

// Using Character type from @/lib/types/database

interface CharacterContextType {
  character: Character | null;
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean; // true when character fetch completed (regardless of result)
  refreshCharacter: () => Promise<void>;
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { onCharacterUpdate } = useRealtime();
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with true to prevent premature redirects
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false); // Track if character fetch completed
  const hasLoadedRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const isFetchingRef = useRef(false);
  const fetchStartTimeRef = useRef<number>(0);

  const updateHasLoaded = useCallback((value: boolean) => {
    hasLoadedRef.current = value;
    setHasLoaded(value);
  }, []);

  const retryCountRef = useRef(0);

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
      return;
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

    try {
      // Add timeout to prevent infinite hanging
      const fetchPromise = supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Character fetch timeout after 5s')), 5000)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

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
        setCharacter(data);
        retryCountRef.current = 0; // Reset retry count on success
      }
    } catch (err) {
      const fetchDuration = Date.now() - fetchStartTimeRef.current;
      const errorTimestamp = new Date().toISOString();
      const message = err instanceof Error ? err.message : 'Failed to fetch character';

      console.error(`[${errorTimestamp}] CharacterContext: Character fetch error after ${fetchDuration}ms for user ${user.id}:`, err);

      // Retry logic: on fetch failure, wait 1 second and retry once
      if (retryCountRef.current < 1) {
        retryCountRef.current++;
        console.log(`[${errorTimestamp}] CharacterContext: Retrying fetch (attempt ${retryCountRef.current})...`);

        // Clear fetch guard to allow retry
        isFetchingRef.current = false;

        // Wait 1 second before retry
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Retry the fetch
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
    }
  }, [user, updateHasLoaded]);

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

  return (
    <CharacterContext.Provider value={{
      character,
      isLoading,
      error,
      hasLoaded,
      refreshCharacter
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
