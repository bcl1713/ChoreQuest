import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type RealtimeEventType =
  | "quest_updated"
  | "quest_template_updated"
  | "character_updated"
  | "reward_updated"
  | "reward_redemption_updated"
  | "family_member_updated"
  | "boss_quest_updated"
  | "boss_participant_updated";

export interface RealtimeEvent {
  type: RealtimeEventType;
  table: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  record: Record<string, unknown>;
  old_record?: Record<string, unknown>;
}

export type Listener = (event: RealtimeEvent) => void;

export type ListenerRegistry = {
  add: (callback: Listener) => () => void;
  emit: (event: RealtimeEvent) => void;
  clear: () => void;
};

export interface RealtimeContextType {
  isConnected: boolean;
  connectionError: string | null;
  onQuestUpdate: (callback: Listener) => () => void;
  onQuestTemplateUpdate: (callback: Listener) => () => void;
  onCharacterUpdate: (callback: Listener) => () => void;
  onRewardUpdate: (callback: Listener) => () => void;
  onRewardRedemptionUpdate: (callback: Listener) => () => void;
  onFamilyMemberUpdate: (callback: Listener) => () => void;
  onBossQuestUpdate: (callback: Listener) => () => void;
  onBossParticipantUpdate: (callback: Listener) => () => void;
  refreshQuests: () => void;
  refreshQuestTemplates: () => void;
  refreshCharacters: () => void;
  refreshRewards: () => void;
}

export type SubscriptionPayload = RealtimePostgresChangesPayload<
  Record<string, unknown>
>;
