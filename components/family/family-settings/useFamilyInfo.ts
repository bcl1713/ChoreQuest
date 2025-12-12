"use client";

import { useAuth } from "@/lib/auth-context";
import { FamilyService, type FamilyInfo } from "@/lib/family-service";
import { useCallback, useMemo, useState } from "react";

export function useFamilyInfo() {
  const { profile } = useAuth();
  const familyService = useMemo(() => new FamilyService(), []);
  const [familyInfo, setFamilyInfo] = useState<FamilyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [updatingTimezone, setUpdatingTimezone] = useState(false);

  const loadFamilyInfo = useCallback(async () => {
    if (!profile?.family_id) return;

    try {
      setLoading(true);
      setError(null);
      const info = await familyService.getFamilyInfo(profile.family_id);
      setFamilyInfo(info);
    } catch (err) {
      console.error("Failed to load family info:", err);
      setError("Failed to load family information");
    } finally {
      setLoading(false);
    }
  }, [profile?.family_id, familyService]);

  const regenerateInviteCode = useCallback(async () => {
    if (!profile?.family_id) return;

    try {
      setRegenerating(true);
      const newCode = await familyService.regenerateInviteCode(profile.family_id);
      setFamilyInfo((current) => (current ? { ...current, code: newCode } : current));
      return newCode;
    } catch (err) {
      console.error("Failed to regenerate code:", err);
      setError("Failed to regenerate invite code");
      throw err;
    } finally {
      setRegenerating(false);
    }
  }, [familyService, profile?.family_id]);

  const updateTimezone = useCallback(async (timezone: string) => {
    if (!profile?.family_id || !timezone) return;

    try {
      setUpdatingTimezone(true);
      await familyService.updateTimezone(profile.family_id, timezone);
      setFamilyInfo((current) => (current ? { ...current, timezone } : current));
    } catch (err) {
      console.error("Failed to update timezone:", err);
      setError("Failed to update timezone");
      throw err;
    } finally {
      setUpdatingTimezone(false);
    }
  }, [familyService, profile?.family_id]);

  return {
    familyInfo,
    loading,
    error,
    regenerating,
    updatingTimezone,
    loadFamilyInfo,
    regenerateInviteCode,
    updateTimezone,
    setError,
  };
}
