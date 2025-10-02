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
  | 'quest_template_updated'
  | 'character_updated'
  | 'reward_updated'
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
  onQuestTemplateUpdate: (callback: (event: RealtimeEvent) => void) => () => void;
  onCharacterUpdate: (callback: (event: RealtimeEvent) => void) => () => void;
  onRewardUpdate: (callback: (event: RealtimeEvent) => void) => () => void;
  onRewardRedemptionUpdate: (callback: (event: RealtimeEvent) => void) => () => void;
  onFamilyMemberUpdate: (callback: (event: RealtimeEvent) => void) => () => void;
  // Manual refresh triggers
  refreshQuests: () => void;
  refreshQuestTemplates: () => void;
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
  const questTemplateListeners = useRef<Set<(event: RealtimeEvent) => void>>(new Set());
  const characterListeners = useRef<Set<(event: RealtimeEvent) => void>>(new Set());
  const rewardUpdateListeners = useRef<Set<(event: RealtimeEvent) => void>>(new Set());
  const rewardRedemptionListeners = useRef<Set<(event: RealtimeEvent) => void>>(new Set());
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
      setConnectionError('Authentication required for realtime connection');
      return;
    }

    // Ensure session is valid and token is available
    if (!session.access_token) {
      setConnectionError('Valid authentication token required');
      return;
    }

    const familyId = profile.family_id;
    const channelName = `family_${familyId}`;

    console.log('Setting up realtime connection for family:', familyId);
    console.log('User ID:', user.id);
    console.log('Session access token exists:', !!session.access_token);

    // Clear any previous error
    setConnectionError(null);

    // For local development, provide fallback if realtime fails
    const isLocalDevelopment = process.env.NODE_ENV === 'development' &&
                               process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1');

    if (isLocalDevelopment) {
      console.log('RealtimeContext: Local development detected, setting up authenticated realtime');
    }

    // Create a family-scoped channel with authentication
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
          table: 'quest_templates',
          filter: `family_id=eq.${familyId}`
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const event: RealtimeEvent = {
            type: 'quest_template_updated',
            table: 'quest_templates',
            action: payload.eventType,
            record: payload.new,
            old_record: payload.old
          };
          setLastEvent(event);
          questTemplateListeners.current.forEach(listener => listener(event));
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
              rewardRedemptionListeners.current.forEach(listener => listener(event));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rewards',
          filter: `family_id=eq.${familyId}`
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const event: RealtimeEvent = {
            type: 'reward_updated',
            table: 'rewards',
            action: payload.eventType,
            record: payload.new,
            old_record: payload.old
          };
          setLastEvent(event);
          rewardUpdateListeners.current.forEach(listener => listener(event));
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
      .subscribe(async (status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionError(null);
          console.log('Successfully connected to realtime for family:', familyId);
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          if (isLocalDevelopment) {
            setConnectionError('Realtime authentication failed in local development');
            console.warn('Realtime connection failed - this may be due to authentication requirements');
          } else {
            setConnectionError('Failed to connect to realtime updates');
            console.error('Realtime connection error for family:', familyId);
          }
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false);
          if (isLocalDevelopment) {
            setConnectionError('Realtime connection timed out - check authentication');
            console.warn('Realtime connection timed out - may be authentication related');
          } else {
            setConnectionError('Realtime connection timed out');
            console.error('Realtime connection timed out for family:', familyId);
          }
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

  const onQuestTemplateUpdate = useCallback((callback: (event: RealtimeEvent) => void) => {
    questTemplateListeners.current.add(callback);
    return () => {
      questTemplateListeners.current.delete(callback);
    };
  }, []);

  const onCharacterUpdate = useCallback((callback: (event: RealtimeEvent) => void) => {
    characterListeners.current.add(callback);
    return () => {
      characterListeners.current.delete(callback);
    };
  }, []);

  const onRewardUpdate = useCallback((callback: (event: RealtimeEvent) => void) => {
    rewardUpdateListeners.current.add(callback);
    return () => {
      rewardUpdateListeners.current.delete(callback);
    };
  }, []);

  const onRewardRedemptionUpdate = useCallback((callback: (event: RealtimeEvent) => void) => {
    rewardRedemptionListeners.current.add(callback);
    return () => {
      rewardRedemptionListeners.current.delete(callback);
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

  const refreshQuestTemplates = useCallback(() => {
    window.dispatchEvent(new CustomEvent('refreshQuestTemplates'));
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
    onQuestTemplateUpdate,
    onCharacterUpdate,
    onRewardUpdate,
    onRewardRedemptionUpdate,
    onFamilyMemberUpdate,
    refreshQuests,
    refreshQuestTemplates,
    refreshCharacters,
    refreshRewards,
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
};