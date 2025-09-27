'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './auth-context';
import { supabase } from './supabase';

interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  xp: number;
  gold: number;
  gems: number;
  honorPoints: number;
  avatarUrl?: string;
}

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
        // Transform Supabase data to match our interface
        setCharacter({
          id: data.id,
          name: data.name,
          class: data.class,
          level: data.level,
          xp: data.xp,
          gold: data.gold,
          gems: data.gems,
          honorPoints: data.honor_points,
          avatarUrl: data.avatar_url || undefined,
        });
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