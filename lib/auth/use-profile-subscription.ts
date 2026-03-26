import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNetworkReady } from "@/lib/network-ready-context";

export function useProfileSubscription(
  userId: string | undefined,
  onProfileUpdate: (userId: string) => Promise<void>,
) {
  const { waitForReady } = useNetworkReady();

  useEffect(() => {
    if (!userId) {
      return;
    }

    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      // Wait for network to be ready before establishing realtime connection
      await waitForReady();

      if (!mounted || !userId) return;

      channel = supabase
        .channel(`user-profile-updates-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "user_profiles",
            filter: `id=eq.${userId}`,
          },
          async (payload) => {
            console.log(
              "AuthContext: Detected profile update via realtime",
              payload,
            );
            await onProfileUpdate(userId);
          },
        )
        .subscribe((status) => {
          console.log("AuthContext: Profile subscription status", status);
          return status;
        });
    })();

    return () => {
      mounted = false;
      if (channel) {
        console.log("AuthContext: Unsubscribing from profile updates");
        supabase.removeChannel(channel);
      }
    };
  }, [userId, onProfileUpdate, waitForReady]);
}
