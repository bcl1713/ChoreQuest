"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { Tables } from "@/lib/types/database";

type Character = Tables<"characters">;

interface UseCharacterReturn {
  character: Character | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing the current user's character data.
 *
 * This hook loads the character associated with the currently authenticated user.
 * It handles the special case where no character exists yet (PGRST116 error code),
 * treating this as a valid state rather than an error.
 *
 * @returns {UseCharacterReturn} Object containing:
 *   - character: The user's character object, or null if no character exists
 *   - loading: Boolean indicating if data is currently being fetched
 *   - error: Error message string if fetch failed, null otherwise
 *   - reload: Function to manually trigger a data reload
 *
 * @example
 * const { character, loading, error, reload } = useCharacter();
 *
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 * if (!character) return <CreateCharacterPrompt />;
 *
 * return <CharacterDisplay character={character} />;
 */
export function useCharacter(): UseCharacterReturn {
  const { user } = useAuth();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCharacter = useCallback(async () => {
    if (!user?.id) {
      setCharacter(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: characterData, error: characterError } = await supabase
        .from("characters")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (characterError) {
        // PGRST116 is the error code for "no rows returned"
        // This is not an error - it just means the user hasn't created a character yet
        if (characterError.code === "PGRST116") {
          setCharacter(null);
        } else {
          throw new Error(`Failed to fetch character: ${characterError.message}`);
        }
      } else {
        setCharacter(characterData);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load character";
      setError(message);
      setCharacter(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadCharacter();
  }, [loadCharacter]);

  return {
    character,
    loading,
    error,
    reload: loadCharacter,
  };
}
