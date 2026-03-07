"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { useAuth } from "./auth-context";
import { useNetworkReady } from "./network-ready-context";
import { createFamilyRealtimeChannels } from "./realtime/channel-subscriptions";
import { createListenerRegistry } from "./realtime/listener-registry";
import type { Listener, RealtimeContextType } from "./realtime/types";

const RealtimeContext = createContext<RealtimeContextType | undefined>(
  undefined,
);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    return {
      isConnected: false,
      connectionError: "Realtime provider missing",
      onQuestUpdate: () => () => {},
      onQuestTemplateUpdate: () => () => {},
      onCharacterUpdate: () => () => {},
      onRewardUpdate: () => () => {},
      onRewardRedemptionUpdate: () => () => {},
      onFamilyMemberUpdate: () => () => {},
      onBossQuestUpdate: () => () => {},
      onBossParticipantUpdate: () => () => {},
      refreshQuests: () => {},
      refreshQuestTemplates: () => {},
      refreshCharacters: () => {},
      refreshRewards: () => {},
    } satisfies RealtimeContextType;
  }
  return context;
};

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const { waitForReady } = useNetworkReady();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const currentChannelsRef = useRef<RealtimeChannel[]>([]);
  const prevFamilyIdRef = useRef<string | null>(null);

  const questListeners = useRef(createListenerRegistry());
  const questTemplateListeners = useRef(createListenerRegistry());
  const characterListeners = useRef(createListenerRegistry());
  const rewardListeners = useRef(createListenerRegistry());
  const redemptionListeners = useRef(createListenerRegistry());
  const familyMemberListeners = useRef(createListenerRegistry());
  const bossQuestListeners = useRef(createListenerRegistry());
  const bossParticipantListeners = useRef(createListenerRegistry());

  const clearListenersRef = useRef(() => {
    questListeners.current.clear();
    questTemplateListeners.current.clear();
    characterListeners.current.clear();
    rewardListeners.current.clear();
    redemptionListeners.current.clear();
    familyMemberListeners.current.clear();
    bossQuestListeners.current.clear();
    bossParticipantListeners.current.clear();
  });

  const setUpChannel = useCallback(async () => {
    await waitForReady();
    const familyId = profile?.family_id;

    if (!familyId) {
      setConnectionError("Authentication required for realtime connection");
      prevFamilyIdRef.current = null;
      setIsConnected(false);
      return;
    }

    if (
      prevFamilyIdRef.current === familyId &&
      currentChannelsRef.current.length > 0
    ) {
      return;
    }

    for (const ch of currentChannelsRef.current) {
      supabase.removeChannel(ch);
    }
    currentChannelsRef.current = [];
    setIsConnected(false);

    prevFamilyIdRef.current = familyId;
    setConnectionError(null);

    const registries = {
      quest: questListeners.current,
      questTemplate: questTemplateListeners.current,
      character: characterListeners.current,
      reward: rewardListeners.current,
      rewardRedemption: redemptionListeners.current,
      familyMember: familyMemberListeners.current,
      bossQuest: bossQuestListeners.current,
      bossParticipant: bossParticipantListeners.current,
    };

    const channels = createFamilyRealtimeChannels(familyId, registries);
    currentChannelsRef.current = channels;

    // Track which channels have subscribed successfully
    const channelStatuses = new Map<RealtimeChannel, string>();

    channels.forEach((channel) => {
      channel.subscribe((status) => {
        channelStatuses.set(channel, status);

        // Connected when all channels are SUBSCRIBED
        const allSubscribed = channels.every(
          (ch) => channelStatuses.get(ch) === "SUBSCRIBED",
        );
        setIsConnected(allSubscribed);

        if (status === "CHANNEL_ERROR") {
          setConnectionError("Realtime channel error");
        } else if (allSubscribed) {
          setConnectionError(null);
        }
      });
    });
  }, [waitForReady, profile?.family_id]);

  // Channel lifecycle: rebuild channel when auth/family changes
  // IMPORTANT: Do NOT clear listener registries here. The registries are independent
  // of the channel — they persist across channel rebuilds. Data hooks register their
  // callbacks once (based on family_id), and those registrations must survive channel
  // reconnections (e.g., session token refresh). Clearing listeners here would leave
  // the registries empty because hooks don't re-register when only the channel changes.
  useEffect(() => {
    setUpChannel();
    return () => {
      for (const ch of currentChannelsRef.current) {
        supabase.removeChannel(ch);
      }
      currentChannelsRef.current = [];
      prevFamilyIdRef.current = null;
      setIsConnected(false);
    };
  }, [setUpChannel]);

  // Clear listeners only on true unmount (provider destroyed, e.g., logout)
  useEffect(() => {
    const clearListeners = clearListenersRef.current;
    return () => {
      clearListeners();
    };
  }, []);

  const refreshQuests = useCallback(
    () =>
      questListeners.current.emit({
        type: "quest_updated",
        table: "quest_instances",
        action: "UPDATE",
        record: {},
      }),
    [],
  );
  const refreshQuestTemplates = useCallback(
    () =>
      questTemplateListeners.current.emit({
        type: "quest_template_updated",
        table: "quest_templates",
        action: "UPDATE",
        record: {},
      }),
    [],
  );
  const refreshCharacters = useCallback(
    () =>
      characterListeners.current.emit({
        type: "character_updated",
        table: "characters",
        action: "UPDATE",
        record: {},
      }),
    [],
  );
  const refreshRewards = useCallback(
    () =>
      rewardListeners.current.emit({
        type: "reward_updated",
        table: "rewards",
        action: "UPDATE",
        record: {},
      }),
    [],
  );

  const onQuestUpdate = useCallback(
    (cb: Listener) => questListeners.current.add(cb),
    [],
  );
  const onQuestTemplateUpdate = useCallback(
    (cb: Listener) => questTemplateListeners.current.add(cb),
    [],
  );
  const onCharacterUpdate = useCallback(
    (cb: Listener) => characterListeners.current.add(cb),
    [],
  );
  const onRewardUpdate = useCallback(
    (cb: Listener) => rewardListeners.current.add(cb),
    [],
  );
  const onRewardRedemptionUpdate = useCallback(
    (cb: Listener) => redemptionListeners.current.add(cb),
    [],
  );
  const onFamilyMemberUpdate = useCallback(
    (cb: Listener) => familyMemberListeners.current.add(cb),
    [],
  );
  const onBossQuestUpdate = useCallback(
    (cb: Listener) => bossQuestListeners.current.add(cb),
    [],
  );
  const onBossParticipantUpdate = useCallback(
    (cb: Listener) => bossParticipantListeners.current.add(cb),
    [],
  );

  const value = React.useMemo(
    () => ({
      isConnected,
      connectionError,
      onQuestUpdate,
      onQuestTemplateUpdate,
      onCharacterUpdate,
      onRewardUpdate,
      onRewardRedemptionUpdate,
      onFamilyMemberUpdate,
      onBossQuestUpdate,
      onBossParticipantUpdate,
      refreshQuests,
      refreshQuestTemplates,
      refreshCharacters,
      refreshRewards,
    }),
    [
      isConnected,
      connectionError,
      onBossParticipantUpdate,
      onBossQuestUpdate,
      onCharacterUpdate,
      onFamilyMemberUpdate,
      onQuestTemplateUpdate,
      onQuestUpdate,
      onRewardRedemptionUpdate,
      onRewardUpdate,
      refreshQuests,
      refreshQuestTemplates,
      refreshCharacters,
      refreshRewards,
    ],
  );

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export type { RealtimeEvent } from "./realtime/types";
