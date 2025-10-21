import React from 'react';
import { render, screen } from '@testing-library/react';
import type { QuestInstance, QuestStatus } from '@/lib/types/database';
import PendingApprovalsSection from '../pending-approvals-section';

// Capture QuestCard props for assertions
const mockQuestCard = jest.fn();

jest.mock('../quest-card', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    mockQuestCard(props);
    const quest = props.quest as QuestInstance;
    return (
      <div data-testid={`quest-card-${quest.id}`}>
        {quest.title}
      </div>
    );
  },
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...rest }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...rest}>{children}</div>
    ),
  },
}));

jest.mock('@/lib/animations/variants', () => ({
  staggerContainer: {},
}));

const createMockQuest = (overrides: Partial<QuestInstance> = {}): QuestInstance => ({
  id: 'quest-1',
  title: 'Laundry Duty',
  description: 'Wash, dry, and fold the laundry.',
  difficulty: 'EASY',
  status: 'COMPLETED' as QuestStatus,
  xp_reward: 150,
  gold_reward: 30,
  category: 'DAILY',
  created_by_id: 'gm-1',
  due_date: '2025-11-01',
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

describe('PendingApprovalsSection', () => {
  const defaultProps = {
    quests: [createMockQuest()],
    assignmentOptions: [
      { id: 'hero-1', name: 'Sir Testalot' },
      { id: 'hero-2', name: 'Lady Mockingham' },
    ],
    selectedAssignees: { 'quest-1': 'hero-1' },
    onAssigneeChange: jest.fn(),
    onAssign: jest.fn(),
    onApprove: jest.fn(),
    onDeny: jest.fn(),
    onCancel: jest.fn(),
    onRelease: jest.fn(),
    getAssignedHeroName: jest.fn(() => 'Sir Testalot'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders heading, count badge, and quest cards for pending approvals', () => {
    render(<PendingApprovalsSection {...defaultProps} />);

    expect(screen.getByText('Pending Approval')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByTestId('quest-card-quest-1')).toBeInTheDocument();

    const questCardProps = mockQuestCard.mock.calls[0][0] as Record<string, unknown>;
    expect(questCardProps.viewMode).toBe('gm');
    expect(questCardProps.onApprove).toBe(defaultProps.onApprove);
    expect(questCardProps.familyMembers).toEqual(defaultProps.assignmentOptions);
    expect(questCardProps.selectedAssignee).toBe('hero-1');
    expect(questCardProps.assignedHeroName).toBe('Sir Testalot');
  });

  it('forwards callback props to QuestCard', () => {
    render(<PendingApprovalsSection {...defaultProps} />);

    const questCardProps = mockQuestCard.mock.calls[0][0] as Record<string, unknown>;
    expect(questCardProps.onAssign).toBe(defaultProps.onAssign);
    expect(questCardProps.onDeny).toBe(defaultProps.onDeny);
    expect(questCardProps.onCancel).toBe(defaultProps.onCancel);
    expect(questCardProps.onRelease).toBe(defaultProps.onRelease);
    expect(questCardProps.onAssigneeChange).toBe(defaultProps.onAssigneeChange);
  });

  it('renders empty state when there are no pending quests', () => {
    render(
      <PendingApprovalsSection
        {...defaultProps}
        quests={[]}
        selectedAssignees={{}}
      />
    );

    expect(screen.getByText('Pending Approval')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('No quests awaiting approval')).toBeInTheDocument();
    expect(mockQuestCard).not.toHaveBeenCalled();
  });

  it('supports custom title and empty message overrides', () => {
    render(
      <PendingApprovalsSection
        {...defaultProps}
        quests={[]}
        selectedAssignees={{}}
        title="GM Approvals"
        emptyMessage="You are all caught up."
      />
    );

    expect(screen.getByText('GM Approvals')).toBeInTheDocument();
    expect(screen.getByText('You are all caught up.')).toBeInTheDocument();
  });
});
