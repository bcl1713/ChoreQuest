'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

  // Safely get realtime context, handle case where it's not available during SSR/SSG
  let onCharacterUpdate: ((callback: (event: { record?: { user_id?: string } }) => void) => () => void) | undefined;
  try {
    const realtimeContext = useRealtime();
    onCharacterUpdate = realtimeContext.onCharacterUpdate;
  } catch {
    // Realtime not available during SSR/SSG, continue without it
    onCharacterUpdate = undefined;
  }
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with true to prevent premature redirects
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false); // Track if character fetch completed

  const fetchCharacter = useCallback(async () => {
    if (!user) {
      setCharacter(null);
      setIsLoading(false);
      // Don't set hasLoaded=true here - we haven't actually tried to fetch
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasLoaded(false);

    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No character found - this is not an error, just no character created yet
          setCharacter(null);
        } else {
          throw error;
        }
      } else {
        // Use Supabase data directly
        setCharacter(data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch character';
      setError(message);
      console.error('Character fetch error:', err);
    } finally {
      setIsLoading(false);
      setHasLoaded(true); // Mark as loaded regardless of success/failure
    }
  }, [user]);

  useEffect(() => {
    fetchCharacter();
  }, [fetchCharacter]);

  // Set up realtime character update listener to automatically refresh
  // when character stats change (e.g., after quest approval by Guild Master)
  useEffect(() => {
    if (!user || !onCharacterUpdate) return;

    const unsubscribe = onCharacterUpdate((event) => {
      // Only refresh if this is our character being updated
      if (event.record?.user_id === user.id) {
        // Automatically refresh character data when realtime event detected
        fetchCharacter().catch(console.error);
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