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
import { createFamilyRealtimeChannel } from "./realtime/channel-subscriptions";
import { createListenerRegistry } from "./realtime/listener-registry";
import type {
  Listener,
  RealtimeContextType,
  RealtimeEvent,
} from "./realtime/types";

const RealtimeContext = createContext<RealtimeContextType | undefined>(
  undefined,
);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    return {
      isConnected: false,
      connectionError: "Realtime provider missing",
      lastEvent: null,
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
  const { user, session, profile } = useAuth();
  const { waitForReady } = useNetworkReady();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);

  const currentChannelRef = useRef<RealtimeChannel | null>(null);
  const prevFamilyIdRef = useRef<string | null>(null);

  const questListeners = useRef(createListenerRegistry());
  const questTemplateListeners = useRef(createListenerRegistry());
  const characterListeners = useRef(createListenerRegistry());
  const rewardListeners = useRef(createListenerRegistry());
  const redemptionListeners = useRef(createListenerRegistry());
  const familyMemberListeners = useRef(createListenerRegistry());
  const bossQuestListeners = useRef(createListenerRegistry());
  const bossParticipantListeners = useRef(createListenerRegistry());

  const clearListeners = () => {
    questListeners.current.clear();
    questTemplateListeners.current.clear();
    characterListeners.current.clear();
    rewardListeners.current.clear();
    redemptionListeners.current.clear();
    familyMemberListeners.current.clear();
    bossQuestListeners.current.clear();
    bossParticipantListeners.current.clear();
  };

  const setUpChannel = useCallback(async () => {
    await waitForReady();
    const familyId = profile?.family_id;

    if (!user || !session || !familyId || !session.access_token) {
      setConnectionError("Authentication required for realtime connection");
      prevFamilyIdRef.current = null;
      setIsConnected(false);
      return;
    }

    if (prevFamilyIdRef.current === familyId && currentChannelRef.current) {
      return;
    }

    if (currentChannelRef.current) {
      supabase.removeChannel(currentChannelRef.current);
      currentChannelRef.current = null;
      setIsConnected(false);
    }

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

    const channel = createFamilyRealtimeChannel(familyId, registries, (event) =>
      setLastEvent(event),
    );
    currentChannelRef.current = channel;

    channel.subscribe((status) => {
      setIsConnected(status === "SUBSCRIBED");
      if (status === "CHANNEL_ERROR") {
        setConnectionError("Realtime channel error");
      }
      return status;
    });
  }, [waitForReady, user, session, profile?.family_id]);

  useEffect(() => {
    setUpChannel();
    return () => {
      if (currentChannelRef.current) {
        supabase.removeChannel(currentChannelRef.current);
        currentChannelRef.current = null;
      }
      clearListeners();
      setIsConnected(false);
    };
  }, [setUpChannel]);

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

  // Use useMemo to prevent context value recreation on every render
  // This ensures hook dependency arrays remain stable
  const value = React.useMemo(
    () => ({
      isConnected,
      connectionError,
      lastEvent,
      onQuestUpdate: (cb: Listener) => questListeners.current.add(cb),
      onQuestTemplateUpdate: (cb: Listener) =>
        questTemplateListeners.current.add(cb),
      onCharacterUpdate: (cb: Listener) => characterListeners.current.add(cb),
      onRewardUpdate: (cb: Listener) => rewardListeners.current.add(cb),
      onRewardRedemptionUpdate: (cb: Listener) =>
        redemptionListeners.current.add(cb),
      onFamilyMemberUpdate: (cb: Listener) =>
        familyMemberListeners.current.add(cb),
      onBossQuestUpdate: (cb: Listener) => bossQuestListeners.current.add(cb),
      onBossParticipantUpdate: (cb: Listener) =>
        bossParticipantListeners.current.add(cb),
      refreshQuests,
      refreshQuestTemplates,
      refreshCharacters,
      refreshRewards,
    }),
    [
      isConnected,
      connectionError,
      lastEvent,
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
