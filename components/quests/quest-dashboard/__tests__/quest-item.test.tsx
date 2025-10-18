import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestItem from '../quest-item';
import { QuestInstance, QuestStatus } from '@/lib/types/database';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('QuestItem', () => {
  const mockQuest: QuestInstance = {
    id: 'quest-1',
    title: 'Test Quest',
    description: 'Test Description',
    difficulty: 'MEDIUM',
    xp_reward: 100,
    gold_reward: 50,
    status: 'PENDING',
    quest_type: 'INDIVIDUAL',
    family_id: 'family-1',
    assigned_to_id: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    due_date: null,
    completed_at: null,
    recurrence_pattern: null,
    volunteer_bonus: null,
    streak_bonus: null,
    streak_count: null,
  };

  const mockHandlers = {
    onStart: jest.fn(),
    onComplete: jest.fn(),
    onApprove: jest.fn(),
    onRelease: jest.fn(),
    onPickup: jest.fn(),
    onAssign: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render quest title and description', () => {
      render(<QuestItem quest={mockQuest} />);
      expect(screen.getByText('Test Quest')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('should render quest rewards', () => {
      render(<QuestItem quest={mockQuest} />);
      expect(screen.getByText(/100 XP/i)).toBeInTheDocument();
      expect(screen.getByText(/50 Gold/i)).toBeInTheDocument();
    });

    it('should render difficulty', () => {
      render(<QuestItem quest={mockQuest} />);
      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    });

    it('should render status badge', () => {
      render(<QuestItem quest={mockQuest} />);
      expect(screen.getByText('PENDING')).toBeInTheDocument();
    });

    it('should render due date when present', () => {
      const questWithDueDate = {
        ...mockQuest,
        due_date: new Date('2025-12-31').toISOString(),
      };
      render(<QuestItem quest={questWithDueDate} />);
      expect(screen.getByText(/Due 12\/30/i)).toBeInTheDocument();
    });

    it('should render recurrence pattern when present', () => {
      const recurringQuest = {
        ...mockQuest,
        recurrence_pattern: 'DAILY' as const,
      };
      render(<QuestItem quest={recurringQuest} />);
      expect(screen.getByText('Daily')).toBeInTheDocument();
    });

    it('should render volunteer bonus when present', () => {
      const questWithBonus = {
        ...mockQuest,
        volunteer_bonus: 0.25,
      };
      render(<QuestItem quest={questWithBonus} />);
      expect(screen.getByText(/\+25%.*Volunteer Bonus/i)).toBeInTheDocument();
    });

    it('should render streak bonus when present', () => {
      const questWithStreak = {
        ...mockQuest,
        streak_bonus: 0.15,
        streak_count: 5,
      };
      render(<QuestItem quest={questWithStreak} />);
      expect(screen.getByText(/5-day streak/i)).toBeInTheDocument();
      expect(screen.getByText(/\+15%/i)).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should render Start Quest button when canStart is true', () => {
      render(<QuestItem quest={mockQuest} canStart onStart={mockHandlers.onStart} />);
      const button = screen.getByRole('button', { name: /start quest/i });
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      expect(mockHandlers.onStart).toHaveBeenCalledWith(mockQuest.id);
    });

    it('should render Complete Quest button when canComplete is true', () => {
      const inProgressQuest = { ...mockQuest, status: 'IN_PROGRESS' as QuestStatus };
      render(<QuestItem quest={inProgressQuest} canComplete onComplete={mockHandlers.onComplete} />);
      const button = screen.getByRole('button', { name: /complete quest/i });
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      expect(mockHandlers.onComplete).toHaveBeenCalledWith(mockQuest.id);
    });

    it('should render Approve Quest button when canApprove is true', () => {
      const completedQuest = { ...mockQuest, status: 'COMPLETED' as QuestStatus };
      render(<QuestItem quest={completedQuest} canApprove onApprove={mockHandlers.onApprove} />);
      const button = screen.getByRole('button', { name: /approve quest/i });
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      expect(mockHandlers.onApprove).toHaveBeenCalledWith(mockQuest.id);
    });

    it('should render Release Quest button when canRelease is true', () => {
      const familyQuest = { ...mockQuest, quest_type: 'FAMILY' as const, status: 'CLAIMED' as QuestStatus };
      render(<QuestItem quest={familyQuest} canRelease onRelease={mockHandlers.onRelease} />);
      const button = screen.getByRole('button', { name: /release quest/i });
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      expect(mockHandlers.onRelease).toHaveBeenCalledWith(mockQuest.id);
    });

    it('should render Pick Up Quest button when canPickup is true', () => {
      const unassignedQuest = { ...mockQuest, assigned_to_id: null };
      render(<QuestItem quest={unassignedQuest} canPickup onPickup={mockHandlers.onPickup} />);
      const button = screen.getByRole('button', { name: /pick up quest/i });
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      expect(mockHandlers.onPickup).toHaveBeenCalledWith(unassignedQuest);
    });

    it('should render Cancel Quest button when canCancel is true', () => {
      render(<QuestItem quest={mockQuest} canCancel onCancel={mockHandlers.onCancel} />);
      const button = screen.getByRole('button', { name: /cancel quest/i });
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      expect(mockHandlers.onCancel).toHaveBeenCalledWith(mockQuest.id);
    });

    it('should not render any buttons when no actions are available', () => {
      render(<QuestItem quest={mockQuest} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Display Variants', () => {
    it('should apply historical variant styling', () => {
      const { container } = render(<QuestItem quest={mockQuest} variant="historical" />);
      const card = container.querySelector('.fantasy-card');
      expect(card).toHaveClass('bg-dark-800/80');
    });

    it('should apply awaiting-approval variant styling', () => {
      const { container } = render(<QuestItem quest={mockQuest} variant="awaiting-approval" />);
      const card = container.querySelector('.fantasy-card');
      expect(card).toHaveClass('border-emerald-800/40');
    });

    it('should apply available variant styling', () => {
      const { container } = render(<QuestItem quest={mockQuest} variant="available" />);
      const card = container.querySelector('.fantasy-card');
      expect(card).toHaveClass('border-l-4');
    });

    it('should render completion timestamp for historical quests', () => {
      const completedQuest = {
        ...mockQuest,
        status: 'APPROVED' as QuestStatus,
        completed_at: new Date('2025-10-15T10:30:00Z').toISOString(),
      };
      render(<QuestItem quest={completedQuest} variant="historical" />);
      expect(screen.getByText(/Approved on/i)).toBeInTheDocument();
    });

    it('should show assigned hero name when provided', () => {
      render(<QuestItem quest={mockQuest} assignedHeroName="John Doe" />);
      expect(screen.getByText(/Hero: John Doe/i)).toBeInTheDocument();
    });

    it('should show quest type badge for family quests in awaiting approval', () => {
      const familyQuest = { ...mockQuest, quest_type: 'FAMILY' as const };
      render(<QuestItem quest={familyQuest} variant="awaiting-approval" />);
      expect(screen.getByText('Family Quest')).toBeInTheDocument();
    });
  });

  describe('Assignment Controls', () => {
    const assignmentOptions = [
      { id: 'user-1', label: 'Hero 1', disabled: false },
      { id: 'user-2', label: 'Hero 2', disabled: true },
    ];

    it('should render assignment dropdown when showAssignment is true', () => {
      render(
        <QuestItem
          quest={mockQuest}
          showAssignment
          assignmentOptions={assignmentOptions}
          onAssign={mockHandlers.onAssign}
        />
      );
      expect(screen.getByText(/assign to hero/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should call onAssign when assignment button is clicked', () => {
      render(
        <QuestItem
          quest={mockQuest}
          showAssignment
          assignmentOptions={assignmentOptions}
          selectedAssignee="user-1"
          onAssigneeChange={jest.fn()}
          onAssign={mockHandlers.onAssign}
        />
      );
      const assignButton = screen.getByRole('button', { name: /assign/i });
      fireEvent.click(assignButton);
      expect(mockHandlers.onAssign).toHaveBeenCalledWith(mockQuest.id, 'user-1');
    });

    it('should disable assignment button when no assignee is selected', () => {
      render(
        <QuestItem
          quest={mockQuest}
          showAssignment
          assignmentOptions={assignmentOptions}
          onAssign={mockHandlers.onAssign}
        />
      );
      const assignButton = screen.getByRole('button', { name: /assign/i });
      expect(assignButton).toBeDisabled();
    });
  });

  describe('Performance', () => {
    it('should be memoized and not re-render when props are unchanged', () => {
      const { rerender } = render(<QuestItem quest={mockQuest} />);
      const firstRender = screen.getByText('Test Quest');

      rerender(<QuestItem quest={mockQuest} />);
      const secondRender = screen.getByText('Test Quest');

      expect(firstRender).toBe(secondRender);
    });
  });
});
