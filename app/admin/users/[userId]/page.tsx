"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Crown } from "lucide-react";
import { AdminUserDetailView } from "@/components/admin/admin-user-detail-view";
import { AuthenticatedPageShell } from "@/components/layout/authenticated-page-shell";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { useCharacter } from "@/lib/character-context";
import { supabase } from "@/lib/supabase";
import type { AdminUserDetail } from "@/lib/admin-user-detail-service";

function resolveUserId(param: string | string[] | undefined): string | null {
  if (Array.isArray(param)) return param[0] ?? null;
  return param ?? null;
}

export default function AdminUserPage() {
  const router = useRouter();
  const params = useParams();
  const targetUserId = useMemo(() => resolveUserId(params.userId), [params.userId]);
  const { user, profile, family, isLoading } = useAuth();
  const { character, isLoading: characterLoading } = useCharacter();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
      return;
    }

    if (!isLoading && user && profile?.role !== "GUILD_MASTER") {
      router.push("/dashboard?error=unauthorized");
    }
  }, [isLoading, profile?.role, router, user]);

  useEffect(() => {
    if (isLoading || !user || profile?.role !== "GUILD_MASTER" || !targetUserId) {
      return;
    }

    let isMounted = true;

    async function loadUserDetail() {
      try {
        setLoadingDetail(true);
        setError(null);
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        if (!token) {
          throw new Error("Authentication required");
        }

        const response = await fetch(`/api/admin/users/${targetUserId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Failed to load user profile");
        }

        if (isMounted) {
          setDetail(payload.detail);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load user profile");
        }
      } finally {
        if (isMounted) {
          setLoadingDetail(false);
        }
      }
    }

    loadUserDetail();

    return () => {
      isMounted = false;
    };
  }, [isLoading, profile?.role, targetUserId, user]);

  if (isLoading || characterLoading || loadingDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (!user || profile?.role !== "GUILD_MASTER" || !character) {
    return null;
  }

  return (
    <AuthenticatedPageShell
      character={character}
      family={family}
      profile={profile}
      title="Admin User Profile"
      titleIcon={<Crown size={32} />}
      actions={
        <Button onClick={() => router.push("/admin?tab=guild-masters")} variant="secondary" size="sm">
          ← Back to Roster
        </Button>
      }
    >
      {error ? (
        <div className="rounded-lg border border-red-500 bg-red-900/20 p-4 text-red-200">
          {error}
        </div>
      ) : detail ? (
        <AdminUserDetailView detail={detail} />
      ) : null}
    </AuthenticatedPageShell>
  );
}
