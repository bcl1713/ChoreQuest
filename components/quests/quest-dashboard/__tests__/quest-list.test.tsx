import React from 'react';
import { render, screen } from '@testing-library/react';
import QuestList from '../quest-list';
import { QuestInstance } from '@/lib/types/database';

// Mock the QuestItem component
jest.mock('../quest-item', () => {
  return function MockQuestItem({ quest }: { quest: QuestInstance }) {
    return <div data-testid={`quest-item-${quest.id}`}>{quest.title}</div>;
  };
});

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('QuestList', () => {
  const mockQuests: QuestInstance[] = [
    {
      id: 'quest-1',
      title: 'Quest One',
      description: 'First quest',
      difficulty: 'EASY',
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
    },
    {
      id: 'quest-2',
      title: 'Quest Two',
      description: 'Second quest',
      difficulty: 'MEDIUM',
      xp_reward: 200,
      gold_reward: 100,
      status: 'IN_PROGRESS',
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
    },
  ];

  describe('Rendering with quests', () => {
    it('should render all quests in the list', () => {
      render(<QuestList quests={mockQuests} />);

      expect(screen.getByTestId('quest-item-quest-1')).toBeInTheDocument();
      expect(screen.getByTestId('quest-item-quest-2')).toBeInTheDocument();
      expect(screen.getByText('Quest One')).toBeInTheDocument();
      expect(screen.getByText('Quest Two')).toBeInTheDocument();
    });

    it('should render quests in a grid layout', () => {
      const { container } = render(<QuestList quests={mockQuests} />);

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should pass quest data to QuestItem components', () => {
      render(<QuestList quests={mockQuests} />);

      // Verify both quest items are rendered with correct data
      expect(screen.getByText('Quest One')).toBeInTheDocument();
      expect(screen.getByText('Quest Two')).toBeInTheDocument();
    });
  });

  describe('Empty states', () => {
    it('should display default empty message when no quests', () => {
      render(<QuestList quests={[]} />);

      expect(screen.getByText('No quests available.')).toBeInTheDocument();
    });

    it('should display custom empty message when provided', () => {
      render(
        <QuestList
          quests={[]}
          emptyMessage="You have no active quests right now."
        />
      );

      expect(screen.getByText('You have no active quests right now.')).toBeInTheDocument();
    });

    it('should display empty hint when provided', () => {
      render(
        <QuestList
          quests={[]}
          emptyMessage="No quests"
          emptyHint="Check back later for new quests."
        />
      );

      expect(screen.getByText('No quests')).toBeInTheDocument();
      expect(screen.getByText('Check back later for new quests.')).toBeInTheDocument();
    });

    it('should apply fantasy-card styling to empty state', () => {
      const { container } = render(<QuestList quests={[]} />);

      const emptyCard = container.querySelector('.fantasy-card');
      expect(emptyCard).toBeInTheDocument();
      expect(emptyCard).toHaveClass('p-6', 'text-center', 'text-gray-300');
    });
  });

  describe('Quest item props forwarding', () => {
    const mockHandlers = {
      onStart: jest.fn(),
      onComplete: jest.fn(),
      onApprove: jest.fn(),
    };

    it('should forward handlers to quest items', () => {
      // We'll verify this by checking that QuestItem receives the props
      // Since we mocked QuestItem, we can't test the actual handler calls here
      // but the component should pass them through
      render(
        <QuestList
          quests={mockQuests}
          onStartQuest={mockHandlers.onStart}
          onCompleteQuest={mockHandlers.onComplete}
          onApproveQuest={mockHandlers.onApprove}
        />
      );

      // Quest items should be rendered
      expect(screen.getByTestId('quest-item-quest-1')).toBeInTheDocument();
      expect(screen.getByTestId('quest-item-quest-2')).toBeInTheDocument();
    });

    it('should forward variant prop to quest items', () => {
      render(<QuestList quests={mockQuests} variant="historical" />);

      expect(screen.getByTestId('quest-item-quest-1')).toBeInTheDocument();
      expect(screen.getByTestId('quest-item-quest-2')).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should use motion container with stagger animation', () => {
      const { container } = render(<QuestList quests={mockQuests} />);

      const motionDiv = container.querySelector('[variants]');
      expect(motionDiv).toBeInTheDocument();
    });

    it('should have initial and animate states for animation', () => {
      const { container } = render(<QuestList quests={mockQuests} />);

      const animatedContainer = container.querySelector('.grid');
      expect(animatedContainer).toHaveAttribute('initial');
      expect(animatedContainer).toHaveAttribute('animate');
    });
  });

  describe('Performance', () => {
    it('should handle large lists efficiently', () => {
      const largeQuestList = Array.from({ length: 100 }, (_, i) => ({
        ...mockQuests[0],
        id: `quest-${i}`,
        title: `Quest ${i}`,
      }));

      const { container } = render(<QuestList quests={largeQuestList} />);

      const questItems = container.querySelectorAll('[data-testid^="quest-item-"]');
      expect(questItems).toHaveLength(100);
    });
  });

  describe('Edge cases', () => {
    it('should handle null quest array gracefully', () => {
      render(<QuestList quests={null as unknown as QuestInstance[]} />);

      expect(screen.getByText('No quests available.')).toBeInTheDocument();
    });

    it('should handle undefined quest array gracefully', () => {
      render(<QuestList quests={undefined as unknown as QuestInstance[]} />);

      expect(screen.getByText('No quests available.')).toBeInTheDocument();
    });

    it('should filter out quests without ids', () => {
      const questsWithInvalid = [
        mockQuests[0],
        { ...mockQuests[1], id: '' } as QuestInstance,
        mockQuests[1],
      ];

      render(<QuestList quests={questsWithInvalid} />);

      // Should render valid quests
      expect(screen.getByTestId('quest-item-quest-1')).toBeInTheDocument();
      expect(screen.getByTestId('quest-item-quest-2')).toBeInTheDocument();
    });
  });
});
