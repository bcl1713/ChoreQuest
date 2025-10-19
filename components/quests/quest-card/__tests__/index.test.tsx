import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestCard from '../index';
import { QuestInstance, QuestStatus } from '@/lib/types/database';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    div: ({ children, ...props }: Record<string, unknown>) => <div {...(props as any)}>{children}</div>,
  },
}));

// Mock the utilities
jest.mock('@/lib/utils/colors', () => ({
  getDifficultyColor: (difficulty: string) => `text-${difficulty?.toLowerCase() || 'gray'}-400`,
  getStatusColor: (status: string | null | undefined) => `bg-${status?.toLowerCase() || 'gray'}-600`,
}));

jest.mock('@/lib/utils/formatting', () => ({
  formatDueDate: (date: string) => `Due: ${date}`,
  formatPercent: (value: number | null) => (value ? `${Math.round(value * 100)}%` : null),
}));

jest.mock('@/lib/animations/variants', () => ({
  staggerItem: {},
}));

// Helper to create mock quest data
const createMockQuest = (overrides: Partial<QuestInstance> = {}): QuestInstance => ({
  id: 'quest-1',
  title: 'Clean the Kitchen',
  description: 'Wash dishes and wipe counters',
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

describe('QuestCard Component', () => {
  describe('Hero View Mode', () => {
    describe('Quest Display', () => {
      it('renders quest title and description', () => {
        const quest = createMockQuest();
        render(
          <QuestCard
            quest={quest}
            viewMode="hero"
          />
        );

        expect(screen.getByText('Clean the Kitchen')).toBeInTheDocument();
        expect(screen.getByText('Wash dishes and wipe counters')).toBeInTheDocument();
      });

      it('displays quest metadata (XP, gold, difficulty, due date)', () => {
        const quest = createMockQuest({
          xp_reward: 150,
          gold_reward: 75,
          difficulty: 'HARD',
        });
        render(
          <QuestCard
            quest={quest}
            viewMode="hero"
          />
        );

        expect(screen.getByText('⚡ 150 XP')).toBeInTheDocument();
        expect(screen.getByText('💰 75 Gold')).toBeInTheDocument();
        expect(screen.getByText('HARD')).toBeInTheDocument();
      });

      it('displays recurrence pattern when present', () => {
        const quest = createMockQuest({
          recurrence_pattern: 'WEEKLY',
        });
        render(
          <QuestCard
            quest={quest}
            viewMode="hero"
          />
        );

        expect(screen.getByText('📅 Weekly')).toBeInTheDocument();
      });

      it('displays assigned hero name when provided', () => {
        const quest = createMockQuest();
        render(
          <QuestCard
            quest={quest}
            viewMode="hero"
            assignedHeroName="Alice"
          />
        );

        expect(screen.getByText('👤 Alice')).toBeInTheDocument();
      });

      it('displays streak bonus when present', () => {
        const quest = createMockQuest({
          streak_bonus: 0.2,
          streak_count: 5,
        });
        render(
          <QuestCard
            quest={quest}
            viewMode="hero"
          />
        );

        expect(screen.getByText('🔥 5-day streak (+20%)')).toBeInTheDocument();
      });

      it('displays volunteer bonus when present', () => {
        const quest = createMockQuest({
          volunteer_bonus: 0.15,
        });
        render(
          <QuestCard
            quest={quest}
            viewMode="hero"
          />
        );

        expect(screen.getByText('+15% Volunteer Bonus')).toBeInTheDocument();
      });

      it('renders status badge with correct status', () => {
        const quest = createMockQuest({
          status: 'IN_PROGRESS' as QuestStatus,
        });
        render(
          <QuestCard
            quest={quest}
            viewMode="hero"
          />
        );

        expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
      });
    });

    describe('Hero Action Buttons', () => {
      it('shows Start button for PENDING quest', () => {
        const quest = createMockQuest({ status: 'PENDING' as QuestStatus });
        const onStart = jest.fn();

        render(
          <QuestCard
            quest={quest}
            viewMode="hero"
            onStart={onStart}
          />
        );

        expect(screen.getByTestId('hero-start-quest')).toBeInTheDocument();
      });

      it('shows Start button for AVAILABLE quest', () => {
        const quest = createMockQuest({ status: 'AVAILABLE' as QuestStatus });
        const onStart = jest.fn();

        render(
          <QuestCard
            quest={quest}
            viewMode="hero"
            onStart={onStart}
          />
        );

        expect(screen.getByTestId('hero-start-quest')).toBeInTheDocument();
      });

      it('shows Complete button for IN_PROGRESS quest', () => {
        const quest = createMockQuest({ status: 'IN_PROGRESS' as QuestStatus });
        const onComplete = jest.fn();

        render(
          <QuestCard
            quest={quest}
            viewMode="hero"
            onComplete={onComplete}
          />
        );

        expect(screen.getByTestId('hero-complete-quest')).toBeInTheDocument();
      });

      it('shows Pick Up button for AVAILABLE quest', () => {
        const quest = createMockQuest({ status: 'AVAILABLE' as QuestStatus });
        const onPickup = jest.fn();

        render(
          <QuestCard
            quest={quest}
            viewMode="hero"
            onPickup={onPickup}
          />
        );

        expect(screen.getByTestId('hero-pickup-quest')).toBeInTheDocument();
      });

      it('hides action buttons for COMPLETED quest', () => {
        const quest = createMockQuest({ status: 'COMPLETED' as QuestStatus });

        render(
          <QuestCard
            quest={quest}
            viewMode="hero"
          />
        );

        expect(screen.queryByTestId('hero-start-quest')).not.toBeInTheDocument();
        expect(screen.queryByTestId('hero-complete-quest')).not.toBeInTheDocument();
        expect(screen.queryByTestId('hero-pickup-quest')).not.toBeInTheDocument();
      });

      it('calls onStart when Start button clicked', () => {
        const quest = createMockQuest({ status: 'PENDING' as QuestStatus });
        const onStart = jest.fn();

        render(
          <QuestCard
            quest={quest}
            viewMode="hero"
            onStart={onStart}
          />
        );

        fireEvent.click(screen.getByTestId('hero-start-quest'));
        expect(onStart).toHaveBeenCalledWith('quest-1');
      });

      it('calls onComplete when Complete button clicked', () => {
        const quest = createMockQuest({ status: 'IN_PROGRESS' as QuestStatus });
        const onComplete = jest.fn();

        render(
          <QuestCard
            quest={quest}
            viewMode="hero"
            onComplete={onComplete}
          />
        );

        fireEvent.click(screen.getByTestId('hero-complete-quest'));
        expect(onComplete).toHaveBeenCalledWith('quest-1');
      });

      it('calls onPickup when Pick Up button clicked', () => {
        const quest = createMockQuest({ status: 'AVAILABLE' as QuestStatus });
        const onPickup = jest.fn();

        render(
          <QuestCard
            quest={quest}
            viewMode="hero"
            onPickup={onPickup}
          />
        );

        fireEvent.click(screen.getByTestId('hero-pickup-quest'));
        expect(onPickup).toHaveBeenCalledWith(quest);
      });
    });
  });

  describe('GM View Mode', () => {
    describe('Quest Display', () => {
      it('renders quest title and description in GM view', () => {
        const quest = createMockQuest();
        render(
          <QuestCard
            quest={quest}
            viewMode="gm"
          />
        );

        expect(screen.getByText('Clean the Kitchen')).toBeInTheDocument();
        expect(screen.getByText('Wash dishes and wipe counters')).toBeInTheDocument();
      });

      it('displays pause icon when quest is paused', () => {
        const quest = createMockQuest({
          ...({
            is_paused: true,
          } as Partial<QuestInstance> & { is_paused: boolean }),
        });
        render(
          <QuestCard
            quest={quest}
            viewMode="gm"
          />
        );

        expect(screen.getByText('⏸️')).toBeInTheDocument();
      });
    });

    describe('GM Action Buttons', () => {
      it('shows Approve button for COMPLETED quest', () => {
        const quest = createMockQuest({ status: 'COMPLETED' as QuestStatus });
        const onApprove = jest.fn();

        render(
          <QuestCard
            quest={quest}
            viewMode="gm"
            onApprove={onApprove}
          />
        );

        expect(screen.getByTestId('gm-approve-quest')).toBeInTheDocument();
      });

      it('shows Cancel button for active quests', () => {
        const quest = createMockQuest({ status: 'PENDING' as QuestStatus });
        const onCancel = jest.fn();

        render(
          <QuestCard
            quest={quest}
            viewMode="gm"
            onCancel={onCancel}
          />
        );

        expect(screen.getByTestId('gm-cancel-quest')).toBeInTheDocument();
      });

      it('shows Pause button for active quests', () => {
        const quest = createMockQuest({ status: 'IN_PROGRESS' as QuestStatus });
        const onTogglePause = jest.fn();

        render(
          <QuestCard
            quest={quest}
            viewMode="gm"
            onTogglePause={onTogglePause}
          />
        );

        expect(screen.getByTestId('gm-toggle-pause')).toBeInTheDocument();
      });

      it('shows Resume button when quest is paused', () => {
        const quest = createMockQuest({
          status: 'IN_PROGRESS' as QuestStatus,
          ...({
            is_paused: true,
          } as Partial<QuestInstance> & { is_paused: boolean }),
        });
        const onTogglePause = jest.fn();

        render(
          <QuestCard
            quest={quest}
            viewMode="gm"
            onTogglePause={onTogglePause}
          />
        );

        expect(screen.getByText('Resume')).toBeInTheDocument();
      });

      it('calls onApprove when Approve button clicked', () => {
        const quest = createMockQuest({ status: 'COMPLETED' as QuestStatus });
        const onApprove = jest.fn();

        render(
          <QuestCard
            quest={quest}
            viewMode="gm"
            onApprove={onApprove}
          />
        );

        fireEvent.click(screen.getByTestId('gm-approve-quest'));
        expect(onApprove).toHaveBeenCalledWith('quest-1');
      });

      it('calls onCancel when Cancel button clicked', () => {
        const quest = createMockQuest({ status: 'PENDING' as QuestStatus });
        const onCancel = jest.fn();

        render(
          <QuestCard
            quest={quest}
            viewMode="gm"
            onCancel={onCancel}
          />
        );

        fireEvent.click(screen.getByTestId('gm-cancel-quest'));
        expect(onCancel).toHaveBeenCalledWith('quest-1');
      });

      it('calls onTogglePause with correct pause state when Pause button clicked', () => {
        const quest = createMockQuest({ status: 'IN_PROGRESS' as QuestStatus });
        const onTogglePause = jest.fn();

        render(
          <QuestCard
            quest={quest}
            viewMode="gm"
            onTogglePause={onTogglePause}
          />
        );

        fireEvent.click(screen.getByTestId('gm-toggle-pause'));
        expect(onTogglePause).toHaveBeenCalledWith('quest-1', true);
      });

      it('calls onTogglePause with correct resume state when Resume button clicked', () => {
        const quest = createMockQuest({
          status: 'IN_PROGRESS' as QuestStatus,
          ...({
            is_paused: true,
          } as Partial<QuestInstance> & { is_paused: boolean }),
        });
        const onTogglePause = jest.fn();

        render(
          <QuestCard
            quest={quest}
            viewMode="gm"
            onTogglePause={onTogglePause}
          />
        );

        fireEvent.click(screen.getByTestId('gm-toggle-pause'));
        expect(onTogglePause).toHaveBeenCalledWith('quest-1', false);
      });
    });

    describe('Assignment Dropdown', () => {
      it('shows assignment dropdown when family members provided', () => {
        const quest = createMockQuest({ status: 'PENDING' as QuestStatus });
        const familyMembers = [
          { id: 'member-1', name: 'Alice' },
          { id: 'member-2', name: 'Bob' },
        ];

        render(
          <QuestCard
            quest={quest}
            viewMode="gm"
            familyMembers={familyMembers}
          />
        );

        expect(screen.getByTestId('gm-assign-dropdown')).toBeInTheDocument();
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
      });

      it('Assign button is disabled when no assignee selected', () => {
        const quest = createMockQuest({ status: 'PENDING' as QuestStatus });
        const familyMembers = [{ id: 'member-1', name: 'Alice' }];

        render(
          <QuestCard
            quest={quest}
            viewMode="gm"
            familyMembers={familyMembers}
          />
        );

        expect(screen.getByTestId('gm-assign-button')).toBeDisabled();
      });

      it('Assign button is enabled when assignee selected', () => {
        const quest = createMockQuest({ status: 'PENDING' as QuestStatus });
        const familyMembers = [{ id: 'member-1', name: 'Alice' }];

        render(
          <QuestCard
            quest={quest}
            viewMode="gm"
            familyMembers={familyMembers}
            selectedAssignee="member-1"
          />
        );

        expect(screen.getByTestId('gm-assign-button')).not.toBeDisabled();
      });

      it('calls onAssign when Assign button clicked', () => {
        const quest = createMockQuest({ status: 'PENDING' as QuestStatus });
        const familyMembers = [{ id: 'member-1', name: 'Alice' }];
        const onAssign = jest.fn();

        render(
          <QuestCard
            quest={quest}
            viewMode="gm"
            familyMembers={familyMembers}
            selectedAssignee="member-1"
            onAssign={onAssign}
          />
        );

        fireEvent.click(screen.getByTestId('gm-assign-button'));
        expect(onAssign).toHaveBeenCalledWith('quest-1', 'member-1');
      });

      it('calls onAssigneeChange when dropdown selection changes', () => {
        const quest = createMockQuest({ status: 'PENDING' as QuestStatus });
        const familyMembers = [
          { id: 'member-1', name: 'Alice' },
          { id: 'member-2', name: 'Bob' },
        ];
        const onAssigneeChange = jest.fn();

        render(
          <QuestCard
            quest={quest}
            viewMode="gm"
            familyMembers={familyMembers}
            onAssigneeChange={onAssigneeChange}
          />
        );

        fireEvent.change(screen.getByTestId('gm-assign-dropdown'), {
          target: { value: 'member-2' },
        });

        expect(onAssigneeChange).toHaveBeenCalledWith('quest-1', 'member-2');
      });
    });

    describe('Quest States', () => {
      it('hides Approve button for non-completed quests', () => {
        const quest = createMockQuest({ status: 'IN_PROGRESS' as QuestStatus });

        render(
          <QuestCard
            quest={quest}
            viewMode="gm"
          />
        );

        expect(screen.queryByTestId('gm-approve-quest')).not.toBeInTheDocument();
      });

      it('hides Cancel button for approved/expired quests', () => {
        const quest = createMockQuest({ status: 'APPROVED' as QuestStatus });

        render(
          <QuestCard
            quest={quest}
            viewMode="gm"
          />
        );

        expect(screen.queryByTestId('gm-cancel-quest')).not.toBeInTheDocument();
      });

      it('does not show assignment for approved quests', () => {
        const quest = createMockQuest({ status: 'APPROVED' as QuestStatus });
        const familyMembers = [{ id: 'member-1', name: 'Alice' }];

        render(
          <QuestCard
            quest={quest}
            viewMode="gm"
            familyMembers={familyMembers}
          />
        );

        expect(screen.queryByTestId('gm-assign-dropdown')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and Edge Cases', () => {
    it('renders with null status gracefully', () => {
      const quest = createMockQuest({ status: null });
      render(
        <QuestCard
          quest={quest}
          viewMode="hero"
        />
      );

      expect(screen.getByText('PENDING')).toBeInTheDocument();
    });

    it('renders with no due date', () => {
      const quest = createMockQuest({ due_date: null });
      render(
        <QuestCard
          quest={quest}
          viewMode="hero"
        />
      );

      expect(screen.getByText('Clean the Kitchen')).toBeInTheDocument();
    });

    it('renders with no recurrence pattern', () => {
      const quest = createMockQuest({ recurrence_pattern: null });
      render(
        <QuestCard
          quest={quest}
          viewMode="hero"
        />
      );

      expect(screen.getByText('Clean the Kitchen')).toBeInTheDocument();
    });

    it('renders with empty family members list', () => {
      const quest = createMockQuest({ status: 'PENDING' as QuestStatus });
      render(
        <QuestCard
          quest={quest}
          viewMode="gm"
          familyMembers={[]}
        />
      );

      expect(screen.getByText('Clean the Kitchen')).toBeInTheDocument();
      expect(screen.queryByTestId('gm-assign-dropdown')).not.toBeInTheDocument();
    });
  });
});
