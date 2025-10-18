"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { Tables } from "@/lib/types/database";

type UserProfile = Tables<"user_profiles">;
type Character = Tables<"characters">;

interface UseFamilyMembersReturn {
  familyMembers: UserProfile[];
  familyCharacters: Character[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing family member data.
 *
 * This hook consolidates the family member loading logic used across multiple components.
 * It fetches both user profiles and their associated characters for all members of the
 * current user's family.
 *
 * @returns {UseFamilyMembersReturn} Object containing:
 *   - familyMembers: Array of user profile objects for all family members
 *   - familyCharacters: Array of character objects for all family members
 *   - loading: Boolean indicating if data is currently being fetched
 *   - error: Error message string if fetch failed, null otherwise
 *   - reload: Function to manually trigger a data reload
 *
 * @example
 * const { familyMembers, familyCharacters, loading, error, reload } = useFamilyMembers();
 *
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return <MemberList members={familyMembers} />;
 */
export function useFamilyMembers(): UseFamilyMembersReturn {
  const { profile } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<UserProfile[]>([]);
  const [familyCharacters, setFamilyCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFamilyMembers = useCallback(async () => {
    if (!profile?.family_id) {
      setFamilyMembers([]);
      setFamilyCharacters([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load family members (user profiles)
      const { data: familyMembersData, error: familyMembersError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("family_id", profile.family_id);

      if (familyMembersError) {
        throw new Error(`Failed to fetch family members: ${familyMembersError.message}`);
      }

      const members = familyMembersData || [];
      setFamilyMembers(members);

      // Load characters for all family members
      const memberIds = members.map((member) => member.id);
      if (memberIds.length > 0) {
        const { data: charactersData, error: charactersError } = await supabase
          .from("characters")
          .select("*")
          .in("user_id", memberIds);

        if (charactersError) {
          throw new Error(`Failed to fetch family characters: ${charactersError.message}`);
        }

        setFamilyCharacters(charactersData || []);
      } else {
        setFamilyCharacters([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load family members";
      setError(message);
      // Clear state on error to ensure consistent state
      setFamilyMembers([]);
      setFamilyCharacters([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.family_id]);

  useEffect(() => {
    void loadFamilyMembers();
  }, [loadFamilyMembers]);

  return {
    familyMembers,
    familyCharacters,
    loading,
    error,
    reload: loadFamilyMembers,
  };
}
