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

  const updateHasLoaded = useCallback((value: boolean) => {
    hasLoadedRef.current = value;
    setHasLoaded(value);
  }, []);

  const fetchCharacter = useCallback(async () => {
    if (!user) {
      setCharacter(null);
      setIsLoading(false);
      // Don't set hasLoaded=true here - we haven't actually tried to fetch
      updateHasLoaded(false);
      isInitialLoadRef.current = true;
      return;
    }

    console.log('CharacterContext: Fetching character for user:', user.id);

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
        setTimeout(() => reject(new Error('Character fetch timeout after 10s')), 10000)
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
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch character';
      setError(message);
      console.error('Character fetch error:', err);
    } finally {
      updateHasLoaded(true); // Mark as loaded regardless of success/failure
      setIsLoading(false);
      isInitialLoadRef.current = false;
    }
  }, [user, updateHasLoaded]);

  useEffect(() => {
    fetchCharacter();
  }, [fetchCharacter]);

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
