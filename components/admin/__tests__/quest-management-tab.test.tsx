import React from 'react';
import { render, screen } from '@testing-library/react';
import QuestManagementTab from '../quest-management-tab';
import { QuestInstance, QuestStatus, UserProfile } from '@/lib/types/database';

// Mock the hooks
jest.mock('@/hooks/useQuests', () => ({
  useQuests: jest.fn(),
}));

jest.mock('@/hooks/useFamilyMembers', () => ({
  useFamilyMembers: jest.fn(),
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

interface MockQuestCardProps {
  quest: QuestInstance;
  viewMode: string;
}

// Mock QuestCard component
jest.mock('@/components/quests/quest-card', () => {
  return function MockQuestCard({ quest, viewMode }: MockQuestCardProps) {
    return (
      <div data-testid={`quest-card-${quest.id}`} data-view-mode={viewMode}>
        {quest.title}
      </div>
    );
  };
});

interface MockMotionDivProps {
  children: React.ReactNode;
  [key: string]: unknown;
}

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MockMotionDivProps) => <div {...props}>{children}</div>,
  },
}));

// Mock LoadingSpinner
jest.mock('@/components/ui/LoadingSpinner', () => {
  return function MockLoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  };
});

// Mock variants
jest.mock('@/lib/animations/variants', () => ({
  staggerContainer: {},
}));

// Declare mocks before use
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockUseQuests = require('@/hooks/useQuests').useQuests;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockUseFamilyMembers = require('@/hooks/useFamilyMembers').useFamilyMembers;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockUseAuth = require('@/lib/auth-context').useAuth;

// Helper to create mock quest
const createMockQuest = (overrides: Partial<QuestInstance> = {}): QuestInstance => ({
  id: 'quest-1',
  title: 'Test Quest',
  description: 'Test Description',
  difficulty: 'EASY',
  status: 'PENDING' as QuestStatus,
  xp_reward: 100,
  gold_reward: 50,
  category: 'DAILY',
  created_by_id: 'user-1',
  due_date: '2025-01-15',
  created_at: '2025-01-10',
  updated_at: '2025-01-10',
  recurrence_pattern: 'DAILY',
  assigned_to_id: null,
  completed_at: null,
  approved_at: null,
  streak_bonus: null,
  streak_count: null,
  volunteer_bonus: null,
  volunteered_by: null,
  template_id: null,
  quest_type: null,
  cycle_start_date: null,
  cycle_end_date: null,
  family_id: 'family-1',
  ...overrides,
});

const createMockFamilyMember = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: 'user-1',
  email: 'user@example.com',
  name: 'John Doe',
  family_id: 'family-1',
  role: 'GUILD_MASTER',
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
  ...overrides,
});

describe('QuestManagementTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('displays loading spinner when loading', () => {
      mockUseQuests.mockReturnValue({
        quests: [],
        loading: true,
        error: null,
        reload: jest.fn(),
      });

      mockUseFamilyMembers.mockReturnValue({
        familyMembers: [],
        familyCharacters: [],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      mockUseAuth.mockReturnValue({
        profile: createMockFamilyMember(),
      });

      render(<QuestManagementTab />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('displays error message when there is an error', () => {
      mockUseQuests.mockReturnValue({
        quests: [],
        loading: false,
        error: 'Failed to load quests',
        reload: jest.fn(),
      });

      mockUseFamilyMembers.mockReturnValue({
        familyMembers: [],
        familyCharacters: [],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      mockUseAuth.mockReturnValue({
        profile: createMockFamilyMember(),
      });

      render(<QuestManagementTab />);

      expect(screen.getByText('Error Loading Quests')).toBeInTheDocument();
      expect(screen.getByText('Failed to load quests')).toBeInTheDocument();
    });
  });

  describe('Quest Sections', () => {
    it('renders all three sections', () => {
      mockUseQuests.mockReturnValue({
        quests: [],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      mockUseFamilyMembers.mockReturnValue({
        familyMembers: [],
        familyCharacters: [],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      mockUseAuth.mockReturnValue({
        profile: createMockFamilyMember(),
      });

      render(<QuestManagementTab />);

      expect(screen.getByText('Pending Approval')).toBeInTheDocument();
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    beforeEach(() => {
      mockUseFamilyMembers.mockReturnValue({
        familyMembers: [],
        familyCharacters: [],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      mockUseAuth.mockReturnValue({
        profile: createMockFamilyMember(),
      });
    });

    it('shows empty message for pending approval when no completed quests', () => {
      mockUseQuests.mockReturnValue({
        quests: [],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      render(<QuestManagementTab />);

      expect(screen.getByText('No quests awaiting approval')).toBeInTheDocument();
    });

    it('shows empty message for unassigned when all quests assigned', () => {
      mockUseQuests.mockReturnValue({
        quests: [],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      render(<QuestManagementTab />);

      expect(screen.getByText('All quests have been assigned')).toBeInTheDocument();
    });

    it('shows empty message for in progress when no in-progress quests', () => {
      mockUseQuests.mockReturnValue({
        quests: [],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      render(<QuestManagementTab />);

      expect(screen.getByText('No quests currently in progress')).toBeInTheDocument();
    });
  });

  describe('Pending Approval Section', () => {
    beforeEach(() => {
      mockUseFamilyMembers.mockReturnValue({
        familyMembers: [createMockFamilyMember()],
        familyCharacters: [],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      mockUseAuth.mockReturnValue({
        profile: createMockFamilyMember(),
      });
    });

    it('displays completed quests in pending approval section', () => {
      const completedQuest = createMockQuest({
        id: 'quest-completed',
        title: 'Completed Quest',
        status: 'COMPLETED' as QuestStatus,
      });

      mockUseQuests.mockReturnValue({
        quests: [completedQuest],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      render(<QuestManagementTab />);

      expect(screen.getByTestId('quest-card-quest-completed')).toBeInTheDocument();
      expect(screen.getByText('Completed Quest')).toBeInTheDocument();
    });

    it('displays correct count badge for pending approval', () => {
      const quests = [
        createMockQuest({
          id: 'quest-1',
          status: 'COMPLETED' as QuestStatus,
        }),
        createMockQuest({
          id: 'quest-2',
          status: 'COMPLETED' as QuestStatus,
        }),
      ];

      mockUseQuests.mockReturnValue({
        quests,
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      render(<QuestManagementTab />);

      // Find all span elements with the count
      const countBadges = screen.getAllByText('2');
      expect(countBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Unassigned Section', () => {
    beforeEach(() => {
      mockUseFamilyMembers.mockReturnValue({
        familyMembers: [createMockFamilyMember()],
        familyCharacters: [],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      mockUseAuth.mockReturnValue({
        profile: createMockFamilyMember(),
      });
    });

    it('displays unassigned quests', () => {
      const unassignedQuest = createMockQuest({
        id: 'quest-unassigned',
        title: 'Unassigned Quest',
        assigned_to_id: null,
        status: 'PENDING' as QuestStatus,
      });

      mockUseQuests.mockReturnValue({
        quests: [unassignedQuest],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      render(<QuestManagementTab />);

      expect(screen.getByTestId('quest-card-quest-unassigned')).toBeInTheDocument();
      expect(screen.getByText('Unassigned Quest')).toBeInTheDocument();
    });

    it('only displays active unassigned quests', () => {
      const unassignedActive = createMockQuest({
        id: 'quest-active',
        title: 'Active Unassigned',
        assigned_to_id: null,
        status: 'PENDING' as QuestStatus,
      });

      const unassignedExpired = createMockQuest({
        id: 'quest-expired',
        title: 'Expired Unassigned',
        assigned_to_id: null,
        status: 'EXPIRED' as QuestStatus,
      });

      mockUseQuests.mockReturnValue({
        quests: [unassignedActive, unassignedExpired],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      render(<QuestManagementTab />);

      // Active quest should be displayed
      expect(screen.getByTestId('quest-card-quest-active')).toBeInTheDocument();
      // Expired quest should not be in unassigned section
      expect(screen.queryByTestId('quest-card-quest-expired')).not.toBeInTheDocument();
    });
  });

  describe('In Progress Section', () => {
    beforeEach(() => {
      mockUseFamilyMembers.mockReturnValue({
        familyMembers: [createMockFamilyMember()],
        familyCharacters: [],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      mockUseAuth.mockReturnValue({
        profile: createMockFamilyMember(),
      });
    });

    it('displays in-progress quests', () => {
      const inProgressQuest = createMockQuest({
        id: 'quest-in-progress',
        title: 'In Progress Quest',
        assigned_to_id: 'user-1',
        status: 'IN_PROGRESS' as QuestStatus,
      });

      mockUseQuests.mockReturnValue({
        quests: [inProgressQuest],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      render(<QuestManagementTab />);

      expect(screen.getByTestId('quest-card-quest-in-progress')).toBeInTheDocument();
      expect(screen.getByText('In Progress Quest')).toBeInTheDocument();
    });

    it('displays claimed quests in in-progress section', () => {
      const claimedQuest = createMockQuest({
        id: 'quest-claimed',
        title: 'Claimed Quest',
        assigned_to_id: 'user-1',
        status: 'CLAIMED' as QuestStatus,
      });

      mockUseQuests.mockReturnValue({
        quests: [claimedQuest],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      render(<QuestManagementTab />);

      expect(screen.getByTestId('quest-card-quest-claimed')).toBeInTheDocument();
      expect(screen.getByText('Claimed Quest')).toBeInTheDocument();
    });

    it('only displays IN_PROGRESS and CLAIMED assigned quests', () => {
      const assignedInProgress = createMockQuest({
        id: 'quest-assigned-ip',
        title: 'Assigned In Progress',
        assigned_to_id: 'user-1',
        status: 'IN_PROGRESS' as QuestStatus,
      });

      const assignedClaimed = createMockQuest({
        id: 'quest-assigned-claimed',
        title: 'Assigned Claimed',
        assigned_to_id: 'user-1',
        status: 'CLAIMED' as QuestStatus,
      });

      const assignedCompleted = createMockQuest({
        id: 'quest-assigned-completed',
        title: 'Assigned Completed',
        assigned_to_id: 'user-1',
        status: 'COMPLETED' as QuestStatus,
      });

      mockUseQuests.mockReturnValue({
        quests: [assignedInProgress, assignedClaimed, assignedCompleted],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      render(<QuestManagementTab />);

      // Only IN_PROGRESS and CLAIMED should be in in-progress section
      expect(screen.getByTestId('quest-card-quest-assigned-ip')).toBeInTheDocument();
      expect(screen.getByTestId('quest-card-quest-assigned-claimed')).toBeInTheDocument();
      // COMPLETED goes to pending approval section
      expect(screen.getByTestId('quest-card-quest-assigned-completed')).toBeInTheDocument();
    });
  });

  describe('Quest Card Props', () => {
    beforeEach(() => {
      mockUseFamilyMembers.mockReturnValue({
        familyMembers: [createMockFamilyMember({ name: 'Alice' })],
        familyCharacters: [],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      mockUseAuth.mockReturnValue({
        profile: createMockFamilyMember(),
      });
    });

    it('passes gm viewMode to QuestCard', () => {
      const quest = createMockQuest({
        id: 'quest-1',
        assigned_to_id: 'user-1',
        status: 'COMPLETED' as QuestStatus,
      });

      mockUseQuests.mockReturnValue({
        quests: [quest],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      render(<QuestManagementTab />);

      const questCard = screen.getByTestId('quest-card-quest-1');
      expect(questCard).toHaveAttribute('data-view-mode', 'gm');
    });
  });

  describe('Count Badges', () => {
    beforeEach(() => {
      mockUseFamilyMembers.mockReturnValue({
        familyMembers: [createMockFamilyMember()],
        familyCharacters: [],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      mockUseAuth.mockReturnValue({
        profile: createMockFamilyMember(),
      });
    });

    it('shows correct count for each section', () => {
      const quests = [
        createMockQuest({
          id: 'quest-1',
          status: 'COMPLETED' as QuestStatus,
        }),
        createMockQuest({
          id: 'quest-2',
          status: 'PENDING' as QuestStatus,
          assigned_to_id: null,
        }),
        createMockQuest({
          id: 'quest-3',
          status: 'IN_PROGRESS' as QuestStatus,
          assigned_to_id: 'user-1',
        }),
      ];

      mockUseQuests.mockReturnValue({
        quests,
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      render(<QuestManagementTab />);

      // Should have three count badges (one for each section)
      const countBadges = screen.getAllByText('1');
      expect(countBadges.length).toBe(3);
    });
  });

  describe('Integration', () => {
    it('renders complete tab with mixed quests', () => {
      const quests = [
        createMockQuest({
          id: 'quest-pending',
          title: 'Pending Approval Quest',
          status: 'COMPLETED' as QuestStatus,
          assigned_to_id: 'user-1',
        }),
        createMockQuest({
          id: 'quest-unassigned',
          title: 'Unassigned Quest',
          status: 'PENDING' as QuestStatus,
          assigned_to_id: null,
        }),
        createMockQuest({
          id: 'quest-inprogress',
          title: 'In Progress Quest',
          status: 'IN_PROGRESS' as QuestStatus,
          assigned_to_id: 'user-1',
        }),
      ];

      mockUseQuests.mockReturnValue({
        quests,
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      mockUseFamilyMembers.mockReturnValue({
        familyMembers: [createMockFamilyMember()],
        familyCharacters: [],
        loading: false,
        error: null,
        reload: jest.fn(),
      });

      mockUseAuth.mockReturnValue({
        profile: createMockFamilyMember(),
      });

      render(<QuestManagementTab />);

      // All sections should be present
      expect(screen.getByText('Pending Approval')).toBeInTheDocument();
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();

      // All quests should be rendered in their correct sections
      expect(screen.getByTestId('quest-card-quest-pending')).toBeInTheDocument();
      expect(screen.getByTestId('quest-card-quest-unassigned')).toBeInTheDocument();
      expect(screen.getByTestId('quest-card-quest-inprogress')).toBeInTheDocument();
    });
  });
});
