import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestCard from './index';
import { QuestInstance } from '@/lib/types/database';

// Mock Framer Motion to avoid animation complexity in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <div {...props}>{children}</div>,
  },
}));

// Mock the helper functions
jest.mock('./quest-card-helpers', () => ({
  getButtonVisibility: jest.fn((status, viewMode, questType) => {
    const buttonVis = {
      canStart: false,
      canComplete: false,
      canPickup: false,
      canAbandon: false,
      canApprove: false,
      canDeny: false,
      canCancel: false,
      canTogglePause: false,
      showAssignment: false,
    };

    if (viewMode === 'hero') {
      buttonVis.canStart = status === 'PENDING' || status === 'CLAIMED' || status === 'AVAILABLE';
      buttonVis.canComplete = status === 'IN_PROGRESS';
      buttonVis.canPickup = status === 'AVAILABLE';
      buttonVis.canAbandon = questType === 'FAMILY' &&
        (status === 'PENDING' || status === 'CLAIMED' || status === 'IN_PROGRESS');
    } else if (viewMode === 'gm') {
      buttonVis.canApprove = status === 'COMPLETED';
      buttonVis.canDeny = status === 'COMPLETED';
      buttonVis.canCancel = status === 'PENDING' || status === 'IN_PROGRESS' ||
        status === 'AVAILABLE' || status === 'CLAIMED';
      buttonVis.showAssignment = status === 'PENDING' || status === 'AVAILABLE' ||
        status === 'IN_PROGRESS' || status === 'CLAIMED';
    }

    return buttonVis;
  }),
  getRecurrenceLabel: jest.fn((pattern) => {
    if (pattern === 'DAILY') return '📅 Daily';
    if (pattern === 'WEEKLY') return '📅 Weekly';
    if (pattern === 'CUSTOM') return '📅 Custom';
    return null;
  }),
}));

// Mock utility functions
jest.mock('@/lib/utils/colors', () => ({
  getDifficultyColor: jest.fn((difficulty) => `difficulty-${difficulty}`),
  getStatusColor: jest.fn((status) => `status-${status}`),
}));

jest.mock('@/lib/utils/formatting', () => ({
  formatDueDate: jest.fn((date) => `Due: ${date}`),
  formatPercent: jest.fn((percent) => percent ? `${percent}%` : null),
}));

// Mock Button component
jest.mock('@/components/ui', () => ({
  Button: ({ children, onClick, 'data-testid': testid, ...props }: { children: React.ReactNode; onClick?: () => void; 'data-testid'?: string; [key: string]: unknown }) => (
    <button onClick={onClick} data-testid={testid} {...props}>
      {children}
    </button>
  ),
}));

const createMockQuest = (overrides?: Partial<QuestInstance>): QuestInstance => ({
  id: 'quest-1',
  title: 'Test Quest',
  description: 'Test quest description',
  status: 'PENDING',
  quest_type: 'FAMILY',
  difficulty: 'MEDIUM',
  xp_reward: 100,
  gold_reward: 50,
  category: 'DAILY',
  created_by_id: 'gm-1',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  assigned_to_id: null,
  approved_at: null,
  completed_at: null,
  cycle_end_date: null,
  cycle_start_date: null,
  due_date: null,
  family_id: 'family-1',
  recurrence_pattern: null,
  streak_bonus: null,
  streak_count: null,
  template_id: null,
  volunteer_bonus: null,
  volunteered_by: null,
  ...overrides,
});

describe('QuestCard - Abandon Button Visibility', () => {
  describe('Hero view - FAMILY quest abandon button', () => {
    it('should display abandon button for FAMILY quest with PENDING status', () => {
      const quest = createMockQuest({ quest_type: 'FAMILY', status: 'PENDING' });
      const onRelease = jest.fn();

      render(
        <QuestCard
          quest={quest}
          viewMode="hero"
          onRelease={onRelease}
        />
      );

      expect(screen.getByTestId('hero-release-quest')).toBeInTheDocument();
      expect(screen.getByText('Abandon Quest')).toBeInTheDocument();
    });

    it('should display abandon button for FAMILY quest with CLAIMED status', () => {
      const quest = createMockQuest({ quest_type: 'FAMILY', status: 'CLAIMED' });
      const onRelease = jest.fn();

      render(
        <QuestCard
          quest={quest}
          viewMode="hero"
          onRelease={onRelease}
        />
      );

      expect(screen.getByTestId('hero-release-quest')).toBeInTheDocument();
    });

    it('should display abandon button for FAMILY quest with IN_PROGRESS status', () => {
      const quest = createMockQuest({ quest_type: 'FAMILY', status: 'IN_PROGRESS' });
      const onRelease = jest.fn();

      render(
        <QuestCard
          quest={quest}
          viewMode="hero"
          onRelease={onRelease}
        />
      );

      expect(screen.getByTestId('hero-release-quest')).toBeInTheDocument();
    });

    it('should NOT display abandon button for FAMILY quest with COMPLETED status', () => {
      const quest = createMockQuest({ quest_type: 'FAMILY', status: 'COMPLETED' });
      const onRelease = jest.fn();

      render(
        <QuestCard
          quest={quest}
          viewMode="hero"
          onRelease={onRelease}
        />
      );

      expect(screen.queryByTestId('hero-release-quest')).not.toBeInTheDocument();
    });

    it('should NOT display abandon button for FAMILY quest with AVAILABLE status', () => {
      const quest = createMockQuest({ quest_type: 'FAMILY', status: 'AVAILABLE' });
      const onRelease = jest.fn();

      render(
        <QuestCard
          quest={quest}
          viewMode="hero"
          onRelease={onRelease}
        />
      );

      expect(screen.queryByTestId('hero-release-quest')).not.toBeInTheDocument();
    });
  });

  describe('Hero view - INDIVIDUAL quest abandon button', () => {
    it('should NOT display abandon button for INDIVIDUAL quest in PENDING status', () => {
      const quest = createMockQuest({ quest_type: 'INDIVIDUAL', status: 'PENDING' });
      const onRelease = jest.fn();

      render(
        <QuestCard
          quest={quest}
          viewMode="hero"
          onRelease={onRelease}
        />
      );

      expect(screen.queryByTestId('hero-release-quest')).not.toBeInTheDocument();
    });

    it('should NOT display abandon button for INDIVIDUAL quest in any status', () => {
      const statuses = ['PENDING', 'CLAIMED', 'IN_PROGRESS', 'COMPLETED'] as const;

      statuses.forEach((status) => {
        const { unmount } = render(
          <QuestCard
            quest={createMockQuest({ quest_type: 'INDIVIDUAL', status })}
            viewMode="hero"
            onRelease={jest.fn()}
          />
        );

        expect(screen.queryByTestId('hero-release-quest')).not.toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('GM view - abandon button', () => {
    it('should NOT display abandon button in GM view for FAMILY quest PENDING status', () => {
      const quest = createMockQuest({ quest_type: 'FAMILY', status: 'PENDING' });
      const onRelease = jest.fn();

      render(
        <QuestCard
          quest={quest}
          viewMode="gm"
          onRelease={onRelease}
          familyMembers={[]}
        />
      );

      expect(screen.queryByTestId('hero-release-quest')).not.toBeInTheDocument();
    });

    it('should NOT display abandon button in GM view for any quest type', () => {
      const quest = createMockQuest({ quest_type: 'FAMILY', status: 'IN_PROGRESS' });
      const onRelease = jest.fn();

      render(
        <QuestCard
          quest={quest}
          viewMode="gm"
          onRelease={onRelease}
          familyMembers={[]}
        />
      );

      expect(screen.queryByTestId('hero-release-quest')).not.toBeInTheDocument();
    });
  });

  describe('Abandon button interactions', () => {
    it('should call onRelease with quest id when abandon button is clicked', () => {
      const quest = createMockQuest({ quest_type: 'FAMILY', status: 'PENDING', id: 'quest-123' });
      const onRelease = jest.fn();

      render(
        <QuestCard
          quest={quest}
          viewMode="hero"
          onRelease={onRelease}
        />
      );

      const abandonButton = screen.getByTestId('hero-release-quest');
      fireEvent.click(abandonButton);

      expect(onRelease).toHaveBeenCalledWith('quest-123');
      expect(onRelease).toHaveBeenCalledTimes(1);
    });

    it('should not render abandon button when onRelease callback is not provided', () => {
      const quest = createMockQuest({ quest_type: 'FAMILY', status: 'PENDING' });

      render(
        <QuestCard
          quest={quest}
          viewMode="hero"
        />
      );

      expect(screen.queryByTestId('hero-release-quest')).not.toBeInTheDocument();
    });
  });

  describe('Abandon button with null/undefined quest_type', () => {
    it('should NOT display abandon button when quest_type is null', () => {
      const quest = createMockQuest({ quest_type: null, status: 'PENDING' });
      const onRelease = jest.fn();

      render(
        <QuestCard
          quest={quest}
          viewMode="hero"
          onRelease={onRelease}
        />
      );

      expect(screen.queryByTestId('hero-release-quest')).not.toBeInTheDocument();
    });

    it('should NOT display abandon button when quest_type is undefined', () => {
      const quest = createMockQuest({ quest_type: undefined, status: 'PENDING' });
      const onRelease = jest.fn();

      render(
        <QuestCard
          quest={quest}
          viewMode="hero"
          onRelease={onRelease}
        />
      );

      expect(screen.queryByTestId('hero-release-quest')).not.toBeInTheDocument();
    });
  });

  describe('Existing hero buttons still work', () => {
    it('should display start button for PENDING quest in hero view', () => {
      const quest = createMockQuest({ status: 'PENDING' });
      const onStart = jest.fn();

      render(
        <QuestCard
          quest={quest}
          viewMode="hero"
          onStart={onStart}
        />
      );

      expect(screen.getByTestId('hero-start-quest')).toBeInTheDocument();
      expect(screen.getByText('Start Quest')).toBeInTheDocument();
    });

    it('should display complete button for IN_PROGRESS quest in hero view', () => {
      const quest = createMockQuest({ status: 'IN_PROGRESS' });
      const onComplete = jest.fn();

      render(
        <QuestCard
          quest={quest}
          viewMode="hero"
          onComplete={onComplete}
        />
      );

      expect(screen.getByTestId('hero-complete-quest')).toBeInTheDocument();
      expect(screen.getByText('Complete Quest')).toBeInTheDocument();
    });

    it('should display pickup button for AVAILABLE quest in hero view', () => {
      const quest = createMockQuest({ status: 'AVAILABLE' });
      const onPickup = jest.fn();

      render(
        <QuestCard
          quest={quest}
          viewMode="hero"
          onPickup={onPickup}
        />
      );

      expect(screen.getByTestId('hero-pickup-quest')).toBeInTheDocument();
      expect(screen.getByText('Pick Up Quest')).toBeInTheDocument();
    });
  });

  describe('Existing GM buttons still work', () => {
    it('should display approve button for COMPLETED quest in GM view', () => {
      const quest = createMockQuest({ status: 'COMPLETED' });
      const onApprove = jest.fn();

      render(
        <QuestCard
          quest={quest}
          viewMode="gm"
          onApprove={onApprove}
          familyMembers={[]}
        />
      );

      expect(screen.getByTestId('gm-approve-quest')).toBeInTheDocument();
    });

    it('should display deny button for COMPLETED quest in GM view', () => {
      const quest = createMockQuest({ status: 'COMPLETED' });
      const onDeny = jest.fn();

      render(
        <QuestCard
          quest={quest}
          viewMode="gm"
          onDeny={onDeny}
          familyMembers={[]}
        />
      );

      expect(screen.getByTestId('gm-deny-quest')).toBeInTheDocument();
    });

    it('should display cancel button for PENDING quest in GM view', () => {
      const quest = createMockQuest({ status: 'PENDING' });
      const onCancel = jest.fn();

      render(
        <QuestCard
          quest={quest}
          viewMode="gm"
          onCancel={onCancel}
          familyMembers={[]}
        />
      );

      expect(screen.getByTestId('gm-cancel-quest')).toBeInTheDocument();
    });
  });
});
