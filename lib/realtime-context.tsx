'use client';

/**
 * Supabase Realtime Context for ChoreQuest
 * Provides family-scoped real-time data synchronization for:
 * - Quest instances (status updates, assignments, completions)
 * - Character stats (XP, gold, level changes)
 * - Reward redemptions (new requests, approvals, fulfillments)
 * - Family member changes (new members, role updates)
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { useAuth } from './auth-context';

// Event types for realtime updates
export type RealtimeEventType =
  | 'quest_updated'
  | 'character_updated'
  | 'reward_redemption_updated'
  | 'family_member_updated';

export interface RealtimeEvent {
  type: RealtimeEventType;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  record: Record<string, unknown>;
  old_record?: Record<string, unknown>;
}

export interface RealtimeContextType {
  isConnected: boolean;
  connectionError: string | null;
  lastEvent: RealtimeEvent | null;
  // Event listeners
  onQuestUpdate: (callback: (event: RealtimeEvent) => void) => () => void;
  onCharacterUpdate: (callback: (event: RealtimeEvent) => void) => () => void;
  onRewardRedemptionUpdate: (callback: (event: RealtimeEvent) => void) => () => void;
  onFamilyMemberUpdate: (callback: (event: RealtimeEvent) => void) => () => void;
  // Manual refresh triggers
  refreshQuests: () => void;
  refreshCharacters: () => void;
  refreshRewards: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const { user, session, profile } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  
  // Use ref to store current channel without causing re-renders
  const currentChannelRef = useRef<RealtimeChannel | null>(null);

  // Event listener management using refs to avoid dependency issues
  const questListeners = useRef<Set<(event: RealtimeEvent) => void>>(new Set());
  const characterListeners = useRef<Set<(event: RealtimeEvent) => void>>(new Set());
  const rewardListeners = useRef<Set<(event: RealtimeEvent) => void>>(new Set());
  const familyMemberListeners = useRef<Set<(event: RealtimeEvent) => void>>(new Set());

  // Setup realtime connection when user and family are available
  useEffect(() => {
    // Clean up any existing connection first
    if (currentChannelRef.current) {
      supabase.removeChannel(currentChannelRef.current);
      currentChannelRef.current = null;
      setIsConnected(false);
    }

    if (!user || !session || !profile?.family_id) {
      return;
    }

    const familyId = profile.family_id;
    const channelName = `family_${familyId}`;

    console.log('Setting up realtime connection for family:', familyId);

    // Create a family-scoped channel
    const realtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quest_instances',
          filter: `family_id=eq.${familyId}`
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const event: RealtimeEvent = {
            type: 'quest_updated',
            table: 'quest_instances',
            action: payload.eventType,
            record: payload.new,
            old_record: payload.old
          };
          setLastEvent(event);
          questListeners.current.forEach(listener => listener(event));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'characters'
        },
        async (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          // Filter characters to only include family members
          const newRecord = payload.new as Record<string, unknown>;
          if (newRecord?.user_id) {
            const { data: userProfile } = await supabase
              .from('user_profiles')
              .select('family_id')
              .eq('id', newRecord.user_id)
              .single();

            if (userProfile?.family_id === familyId) {
              const event: RealtimeEvent = {
                type: 'character_updated',
                table: 'characters',
                action: payload.eventType,
                record: payload.new,
                old_record: payload.old
              };
              setLastEvent(event);
              characterListeners.current.forEach(listener => listener(event));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reward_redemptions'
        },
        async (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          // Filter reward redemptions to only include family members
          const newRecord = payload.new as Record<string, unknown>;
          if (newRecord?.user_id) {
            const { data: userProfile } = await supabase
              .from('user_profiles')
              .select('family_id')
              .eq('id', newRecord.user_id)
              .single();

            if (userProfile?.family_id === familyId) {
              const event: RealtimeEvent = {
                type: 'reward_redemption_updated',
                table: 'reward_redemptions',
                action: payload.eventType,
                record: payload.new,
                old_record: payload.old
              };
              setLastEvent(event);
              rewardListeners.current.forEach(listener => listener(event));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `family_id=eq.${familyId}`
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const event: RealtimeEvent = {
            type: 'family_member_updated',
            table: 'user_profiles',
            action: payload.eventType,
            record: payload.new,
            old_record: payload.old
          };
          setLastEvent(event);
          familyMemberListeners.current.forEach(listener => listener(event));
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionError(null);
          console.log('Successfully connected to realtime for family:', familyId);
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setConnectionError('Failed to connect to realtime updates');
          console.error('Realtime connection error for family:', familyId);
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false);
          setConnectionError('Realtime connection timed out');
          console.error('Realtime connection timed out for family:', familyId);
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          setConnectionError(null);
          console.log('Realtime connection closed for family:', familyId);
        }
      });

    // Store the channel in ref for cleanup
    currentChannelRef.current = realtimeChannel;

    // Cleanup function
    return () => {
      console.log('Cleaning up realtime connection for family:', familyId);
      if (currentChannelRef.current) {
        supabase.removeChannel(currentChannelRef.current);
        currentChannelRef.current = null;
      }
      setIsConnected(false);
      setConnectionError(null);
    };
  }, [user, session, profile?.family_id]);

  // Event listener registration functions
  const onQuestUpdate = useCallback((callback: (event: RealtimeEvent) => void) => {
    questListeners.current.add(callback);
    return () => {
      questListeners.current.delete(callback);
    };
  }, []);

  const onCharacterUpdate = useCallback((callback: (event: RealtimeEvent) => void) => {
    characterListeners.current.add(callback);
    return () => {
      characterListeners.current.delete(callback);
    };
  }, []);

  const onRewardRedemptionUpdate = useCallback((callback: (event: RealtimeEvent) => void) => {
    rewardListeners.current.add(callback);
    return () => {
      rewardListeners.current.delete(callback);
    };
  }, []);

  const onFamilyMemberUpdate = useCallback((callback: (event: RealtimeEvent) => void) => {
    familyMemberListeners.current.add(callback);
    return () => {
      familyMemberListeners.current.delete(callback);
    };
  }, []);

  // Manual refresh triggers (for fallback scenarios)
  const refreshQuests = useCallback(() => {
    window.dispatchEvent(new CustomEvent('refreshQuests'));
  }, []);

  const refreshCharacters = useCallback(() => {
    window.dispatchEvent(new CustomEvent('refreshCharacters'));
  }, []);

  const refreshRewards = useCallback(() => {
    window.dispatchEvent(new CustomEvent('refreshRewards'));
  }, []);

  const contextValue: RealtimeContextType = {
    isConnected,
    connectionError,
    lastEvent,
    onQuestUpdate,
    onCharacterUpdate,
    onRewardRedemptionUpdate,
    onFamilyMemberUpdate,
    refreshQuests,
    refreshCharacters,
    refreshRewards,
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
};