import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { ListenerRegistry, RealtimeEvent, SubscriptionPayload } from "./types";

type ChannelRegistries = {
  quest: ListenerRegistry;
  questTemplate: ListenerRegistry;
  character: ListenerRegistry;
  reward: ListenerRegistry;
  rewardRedemption: ListenerRegistry;
  familyMember: ListenerRegistry;
  bossQuest: ListenerRegistry;
  bossParticipant: ListenerRegistry;
};

const mapEvent = (type: RealtimeEvent["type"], table: string) =>
  (payload: SubscriptionPayload): RealtimeEvent => ({
    type,
    table,
    action: payload.eventType,
    record: payload.new,
    old_record: payload.old,
  });

const subscribeTable = (
  channel: RealtimeChannel,
  table: string,
  familyId: string,
  handler: (payload: SubscriptionPayload) => void
) =>
  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table, filter: `family_id=eq.${familyId}` },
    handler
  );

export const createFamilyRealtimeChannel = (
  familyId: string,
  registries: ChannelRegistries,
  setLastEvent: (event: RealtimeEvent) => void
) => {
  const channel = supabase.channel(`family_${familyId}`);

  subscribeTable(channel, "quest_instances", familyId, (payload) => {
    const event = mapEvent("quest_updated", "quest_instances")(payload);
    setLastEvent(event);
    registries.quest.emit(event);
  });

  subscribeTable(channel, "quest_templates", familyId, (payload) => {
    const event = mapEvent("quest_template_updated", "quest_templates")(payload);
    setLastEvent(event);
    registries.questTemplate.emit(event);
  });

  subscribeTable(channel, "characters", familyId, (payload) => {
    const event = mapEvent("character_updated", "characters")(payload);
    setLastEvent(event);
    registries.character.emit(event);
  });

  subscribeTable(channel, "rewards", familyId, (payload) => {
    const event = mapEvent("reward_updated", "rewards")(payload);
    setLastEvent(event);
    registries.reward.emit(event);
  });

  subscribeTable(channel, "reward_redemptions", familyId, (payload) => {
    const event = mapEvent("reward_redemption_updated", "reward_redemptions")(payload);
    setLastEvent(event);
    registries.rewardRedemption.emit(event);
  });

  subscribeTable(channel, "user_profiles", familyId, (payload) => {
    const event = mapEvent("family_member_updated", "user_profiles")(payload);
    setLastEvent(event);
    registries.familyMember.emit(event);
  });

  subscribeTable(channel, "boss_battles", familyId, (payload) => {
    const event = mapEvent("boss_quest_updated", "boss_battles")(payload);
    setLastEvent(event);
    registries.bossQuest.emit(event);
  });

  subscribeTable(channel, "boss_battle_participants", familyId, (payload) => {
    const event = mapEvent("boss_participant_updated", "boss_battle_participants")(payload);
    setLastEvent(event);
    registries.bossParticipant.emit(event);
  });

  return channel;
};
