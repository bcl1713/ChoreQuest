"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import type { UserProfile } from "@/lib/types/database";

export interface FamilyMemberWithCharacter extends UserProfile {
  characters: {
    name: string;
    level: number;
  } | null;
}

export function useGuildMembers() {
  const { profile } = useAuth();
  const { onFamilyMemberUpdate } = useRealtime();
  const [members, setMembers] = useState<FamilyMemberWithCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!profile?.family_id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("user_profiles")
        .select(
          `
          *,
          characters (
            name,
            level
          )
        `,
        )
        .eq("family_id", profile.family_id)
        .order("role", { ascending: false })
        .order("name", { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const transformedData =
        data?.map((member) => ({
          ...member,
          characters: Array.isArray(member.characters)
            ? member.characters[0] || null
            : member.characters,
        })) || [];

      setMembers(transformedData);
    } catch (err) {
      console.error("Failed to load family members:", err);
      setError("Failed to load family members");
    } finally {
      setLoading(false);
    }
  }, [profile?.family_id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    const unsubscribe = onFamilyMemberUpdate(() => {
      loadMembers();
    });

    return unsubscribe;
  }, [onFamilyMemberUpdate, loadMembers]);

  return { members, loading, error, reload: loadMembers };
}
