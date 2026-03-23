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
  achievementUnlock: ListenerRegistry;
  familyAchievementUnlock: ListenerRegistry;
};

const mapEvent =
  (type: RealtimeEvent["type"], table: string) =>
  (payload: SubscriptionPayload): RealtimeEvent => ({
    type,
    table,
    action: payload.eventType,
    record: payload.new,
    old_record: payload.old,
  });

// Supabase Realtime has a bug where multiple postgres_changes subscriptions
// on a single channel silently fail to register. Work around this by creating
// one channel per table subscription.

type TableSubscription = {
  channelName: string;
  table: string;
  filter?: string;
  eventType: RealtimeEvent["type"];
  registry: ListenerRegistry;
};

export const createFamilyRealtimeChannels = (
  familyId: string,
  registries: ChannelRegistries,
): RealtimeChannel[] => {
  const subscriptions: TableSubscription[] = [
    {
      channelName: `family_${familyId}_quest_instances`,
      table: "quest_instances",
      filter: `family_id=eq.${familyId}`,
      eventType: "quest_updated",
      registry: registries.quest,
    },
    {
      channelName: `family_${familyId}_quest_templates`,
      table: "quest_templates",
      filter: `family_id=eq.${familyId}`,
      eventType: "quest_template_updated",
      registry: registries.questTemplate,
    },
    {
      channelName: `family_${familyId}_characters`,
      table: "characters",
      filter: `family_id=eq.${familyId}`,
      eventType: "character_updated",
      registry: registries.character,
    },
    {
      channelName: `family_${familyId}_rewards`,
      table: "rewards",
      filter: `family_id=eq.${familyId}`,
      eventType: "reward_updated",
      registry: registries.reward,
    },
    {
      channelName: `family_${familyId}_reward_redemptions`,
      table: "reward_redemptions",
      // reward_redemptions has no family_id column; omit filter so events
      // are delivered.  mergeRedemptionUpdate only matches by ID, so
      // cross-family events are harmless no-ops.
      eventType: "reward_redemption_updated",
      registry: registries.rewardRedemption,
    },
    {
      channelName: `family_${familyId}_user_profiles`,
      table: "user_profiles",
      filter: `family_id=eq.${familyId}`,
      eventType: "family_member_updated",
      registry: registries.familyMember,
    },
    {
      channelName: `family_${familyId}_boss_battles`,
      table: "boss_battles",
      filter: `family_id=eq.${familyId}`,
      eventType: "boss_quest_updated",
      registry: registries.bossQuest,
    },
    {
      channelName: `family_${familyId}_boss_participants`,
      table: "boss_battle_participants",
      eventType: "boss_participant_updated",
      registry: registries.bossParticipant,
    },
    {
      channelName: `family_${familyId}_character_achievements`,
      table: "character_achievements",
      // character_achievements has no family_id column; omit filter so events
      // are delivered. The notification hook filters client-side by character_id.
      eventType: "achievement_unlock_updated",
      registry: registries.achievementUnlock,
    },
    {
      channelName: `family_${familyId}_family_achievement_progress`,
      table: "family_achievement_progress",
      filter: `family_id=eq.${familyId}`,
      eventType: "family_achievement_unlock_updated",
      registry: registries.familyAchievementUnlock,
    },
  ];

  return subscriptions.map(
    ({ channelName, table, filter, eventType, registry }) => {
      const channel = supabase.channel(channelName);
      const opts: {
        event: "*";
        schema: "public";
        table: string;
        filter?: string;
      } = {
        event: "*",
        schema: "public",
        table,
      };
      if (filter) {
        opts.filter = filter;
      }

      channel.on("postgres_changes", opts, (payload) => {
        registry.emit(mapEvent(eventType, table)(payload));
      });

      return channel;
    },
  );
};
