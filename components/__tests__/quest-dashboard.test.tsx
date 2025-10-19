import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import QuestDashboard from '../quests/quest-dashboard';
import { useAuth } from '@/lib/auth-context';
import { useRealtime } from '@/lib/realtime-context';
import { supabase } from '@/lib/supabase';

// Mock dependencies
jest.mock('@/lib/auth-context');
jest.mock('@/lib/realtime-context');
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    removeChannel: jest.fn(),
  },
}));
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRealtime = useRealtime as jest.MockedFunction<typeof useRealtime>;

interface RealtimeEvent {
  type: string;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  record: Record<string, unknown>;
  old_record?: Record<string, unknown>;
}

describe('QuestDashboard - Realtime DELETE Events', () => {
  let onQuestUpdateCallback: ((event: RealtimeEvent) => void) | null = null;

  const mockUser = {
    id: 'user-123',
    email: 'gm@test.com',
  };

  const mockProfile = {
    id: 'user-123',
    name: 'Guild Master',
    family_id: 'family-456',
    role: 'GUILD_MASTER' as const,
  };

  const mockQuest = {
    id: 'quest-789',
    title: 'Test Quest',
    description: 'Test Description',
    difficulty: 'EASY' as const,
    xp_reward: 100,
    gold_reward: 50,
    status: 'AVAILABLE' as const,
    quest_type: 'INDIVIDUAL' as const,
    family_id: 'family-456',
    assigned_to_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    onQuestUpdateCallback = null;

    // Mock useAuth
    mockUseAuth.mockReturnValue({
      user: mockUser,
      session: { access_token: 'fake-token' } as unknown as Parameters<typeof mockUseAuth>[0]['session'],
      profile: mockProfile,
      loading: false,
      signOut: jest.fn(),
      signInWithPassword: jest.fn(),
      signUpWithPassword: jest.fn(),
    });

    // Mock useRealtime with callback capture
    mockUseRealtime.mockReturnValue({
      isConnected: true,
      connectionError: null,
      lastEvent: null,
      onQuestUpdate: jest.fn((callback) => {
        onQuestUpdateCallback = callback;
        return jest.fn(); // unsubscribe function
      }),
      onQuestTemplateUpdate: jest.fn(),
      onCharacterUpdate: jest.fn(),
      onRewardUpdate: jest.fn(),
      onRewardRedemptionUpdate: jest.fn(),
      onFamilyMemberUpdate: jest.fn(),
      refreshQuests: jest.fn(),
      refreshQuestTemplates: jest.fn(),
      refreshCharacters: jest.fn(),
      refreshRewards: jest.fn(),
    });

    // Mock Supabase queries with full chain
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' }, // No character found
    });

    const mockOrder = jest.fn().mockResolvedValue({
      data: [mockQuest],
      error: null,
    });

    const mockIn = jest.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    const mockEq = jest.fn().mockReturnValue({
      single: mockSingle,
      order: mockOrder,
      in: mockIn,
    });

    const mockSelect = jest.fn().mockReturnValue({
      eq: mockEq,
      in: mockIn,
      order: mockOrder,
      single: mockSingle,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      in: mockIn,
      single: mockSingle,
    });
  });

  it('should remove quest from UI when DELETE event is received', async () => {
    render(
      <QuestDashboard onError={jest.fn()} />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText('Test Quest')).toBeInTheDocument();
    });

    // Simulate DELETE event from Supabase Realtime
    if (onQuestUpdateCallback) {
      onQuestUpdateCallback({
        type: 'quest_updated',
        table: 'quest_instances',
        action: 'DELETE',
        record: {},
        old_record: {
          id: 'quest-789',
          family_id: 'family-456',
          title: 'Test Quest',
        },
      });
    }

    // Quest should be removed from UI
    await waitFor(() => {
      expect(screen.queryByText('Test Quest')).not.toBeInTheDocument();
    });
  });

  it('should handle DELETE event with full old_record (REPLICA IDENTITY FULL)', async () => {
    render(<QuestDashboard onError={jest.fn()} />);

    await waitFor(() => {
      expect(screen.queryByText('Test Quest')).toBeInTheDocument();
    });

    // Simulate DELETE event with full old_record (what REPLICA IDENTITY FULL provides)
    if (onQuestUpdateCallback) {
      onQuestUpdateCallback({
        type: 'quest_updated',
        table: 'quest_instances',
        action: 'DELETE',
        record: {},
        old_record: {
          id: 'quest-789',
          family_id: 'family-456',
          title: 'Test Quest',
          description: 'Test Description',
          difficulty: 'EASY',
          xp_reward: 100,
          gold_reward: 50,
          status: 'AVAILABLE',
          quest_type: 'FAMILY',
          assigned_to_id: null,
          created_at: mockQuest.created_at,
          updated_at: mockQuest.updated_at,
        },
      });
    }

    await waitFor(() => {
      expect(screen.queryByText('Test Quest')).not.toBeInTheDocument();
    });
  });

  it('should not crash when DELETE event has no old_record.id', async () => {
    render(<QuestDashboard onError={jest.fn()} />);

    await waitFor(() => {
      expect(screen.queryByText('Test Quest')).toBeInTheDocument();
    });

    // Simulate malformed DELETE event (missing old_record.id)
    if (onQuestUpdateCallback) {
      onQuestUpdateCallback({
        type: 'quest_updated',
        table: 'quest_instances',
        action: 'DELETE',
        record: {},
        old_record: {}, // No id field
      });
    }

    // Quest should still be visible (event ignored)
    await waitFor(() => {
      expect(screen.queryByText('Test Quest')).toBeInTheDocument();
    });
  });

  it('should deduplicate quests after DELETE event', async () => {
    // Mock duplicate quests in initial load
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    });

    const mockOrder = jest.fn().mockResolvedValue({
      data: [mockQuest, { ...mockQuest }], // Duplicate
      error: null,
    });

    const mockIn = jest.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    const mockEq = jest.fn().mockReturnValue({
      single: mockSingle,
      order: mockOrder,
      in: mockIn,
    });

    const mockSelect = jest.fn().mockReturnValue({
      eq: mockEq,
      in: mockIn,
      order: mockOrder,
      single: mockSingle,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      in: mockIn,
      single: mockSingle,
    });

    render(<QuestDashboard onError={jest.fn()} />);

    await waitFor(() => {
      const questCards = screen.queryAllByText('Test Quest');
      // Should be deduplicated to 1
      expect(questCards.length).toBe(1);
    });

    // Now delete it
    if (onQuestUpdateCallback) {
      onQuestUpdateCallback({
        type: 'quest_updated',
        table: 'quest_instances',
        action: 'DELETE',
        record: {},
        old_record: { id: 'quest-789' },
      });
    }

    await waitFor(() => {
      expect(screen.queryByText('Test Quest')).not.toBeInTheDocument();
    });
  });
});
