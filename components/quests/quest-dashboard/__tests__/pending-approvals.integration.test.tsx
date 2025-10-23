import React from 'react';
import { render, screen } from '@testing-library/react';
import QuestDashboard from '..';
import type { QuestInstance, QuestStatus } from '@/lib/types/database';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useCharacter } from '@/hooks/useCharacter';
import { useQuests } from '@/hooks/useQuests';
import { useAuth } from '@/lib/auth-context';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...rest }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...rest}>{children}</div>
    ),
  },
}));

jest.mock('@/components/ui', () => {
  const actual = jest.requireActual('@/components/ui');
  return {
    ...actual,
    LoadingSpinner: () => <div data-testid="loading-spinner" />,
  };
});

jest.mock('../quest-list', () => ({
  __esModule: true,
  default: ({ quests }: { quests: QuestInstance[] }) => (
    <div data-testid="quest-list">{quests.map((quest) => quest.title).join(',')}</div>
  ),
}));

jest.mock('@/components/family/family-quest-claiming', () => ({
  __esModule: true,
  default: () => <div data-testid="family-quest-claiming" />,
}));

const mockPendingSection = jest.fn();

jest.mock('../../pending-approvals-section', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockPendingSection(props);
    return <div data-testid="pending-approvals-section-mock" />;
  },
}));

jest.mock('@/lib/quest-instance-api-service', () => ({
  questInstanceApiService: {
    approveQuest: jest.fn(),
    claimQuest: jest.fn(),
    releaseQuest: jest.fn(),
    assignFamilyQuest: jest.fn(),
    denyQuest: jest.fn(),
    cancelQuest: jest.fn(),
  },
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })),
    })),
  },
}));

jest.mock('@/hooks/useFamilyMembers', () => ({
  useFamilyMembers: jest.fn(),
}));

jest.mock('@/hooks/useCharacter', () => ({
  useCharacter: jest.fn(),
}));

jest.mock('@/hooks/useQuests', () => ({
  useQuests: jest.fn(),
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

const mockUseFamilyMembers = jest.mocked(useFamilyMembers);
const mockUseCharacter = jest.mocked(useCharacter);
const mockUseQuests = jest.mocked(useQuests);
const mockUseAuth = jest.mocked(useAuth);

const createQuest = (overrides: Partial<QuestInstance> = {}): QuestInstance => ({
  id: 'quest-1',
  title: 'Test Quest',
  description: 'Test Quest Description',
  difficulty: 'EASY',
  status: 'COMPLETED' as QuestStatus,
  xp_reward: 100,
  gold_reward: 50,
  category: 'DAILY',
  created_by_id: 'gm-1',
  due_date: null,
  created_at: '2025-10-20T00:00:00.000Z',
  updated_at: '2025-10-21T00:00:00.000Z',
  recurrence_pattern: 'DAILY',
  assigned_to_id: 'hero-1',
  completed_at: '2025-10-21T00:00:00.000Z',
  approved_at: null,
  streak_bonus: null,
  streak_count: null,
  volunteer_bonus: null,
  volunteered_by: null,
  template_id: null,
  quest_type: 'INDIVIDUAL',
  cycle_start_date: null,
  cycle_end_date: null,
  family_id: 'family-1',
  ...overrides,
});

const character = {
  id: 'hero-1',
  name: 'Sir Testalot',
  class: 'KNIGHT',
  level: 5,
  xp: 500,
};

beforeEach(() => {
  jest.clearAllMocks();

  mockUseAuth.mockReturnValue({
    user: { id: 'gm-1' },
    profile: { id: 'gm-1', role: 'GUILD_MASTER' },
  });

  mockUseFamilyMembers.mockReturnValue({
    familyMembers: [{ id: 'hero-1', name: 'Sir Testalot', role: 'HERO' }],
    familyCharacters: [{ id: 'hero-1', name: 'Sir Testalot', user_id: 'gm-1' }],
    loading: false,
    error: null,
    reload: jest.fn().mockResolvedValue(undefined),
  });

  mockUseCharacter.mockReturnValue({
    character,
    loading: false,
    error: null,
    reload: jest.fn().mockResolvedValue(undefined),
  });

  mockUseQuests.mockReturnValue({
    quests: [createQuest()],
    loading: false,
    error: null,
    reload: jest.fn().mockResolvedValue(undefined),
  });
});

const renderDashboard = () => render(<QuestDashboard onError={jest.fn()} />);

describe('QuestDashboard pending approvals integration', () => {
  it('renders pending approvals section for guild masters with completed quests', () => {
    renderDashboard();

    expect(screen.getByTestId('pending-approvals-section-mock')).toBeInTheDocument();
    expect(mockPendingSection).toHaveBeenCalled();

    const props = mockPendingSection.mock.calls[0][0] as Record<string, unknown>;
    expect(Array.isArray(props.quests)).toBe(true);
    expect((props.quests as QuestInstance[]).length).toBe(1);
  });

  it('does not render pending approvals when user is not a guild master', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'hero-1' },
      profile: { id: 'hero-1', role: 'HERO' },
    });

    renderDashboard();

    expect(screen.queryByTestId('pending-approvals-section-mock')).not.toBeInTheDocument();
    expect(mockPendingSection).not.toHaveBeenCalled();
  });

  it('does not render pending approvals when there are no completed quests', () => {
    mockUseQuests.mockReturnValue({
      quests: [createQuest({ status: 'IN_PROGRESS' as QuestStatus })],
      loading: false,
      error: null,
      reload: jest.fn().mockResolvedValue(undefined),
    });

    renderDashboard();

    expect(screen.queryByTestId('pending-approvals-section-mock')).not.toBeInTheDocument();
    expect(mockPendingSection).not.toHaveBeenCalled();
  });
});
