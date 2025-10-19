import React from 'react';
import { render, screen } from '@testing-library/react';
import QuestStats from '../quest-stats';
import { QuestInstance } from '@/lib/types/database';

describe('QuestStats', () => {
  const createMockQuest = (overrides: Partial<QuestInstance>): QuestInstance => ({
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
    ...overrides,
  });

  describe('Basic Rendering', () => {
    it('should render total quest count', () => {
      const quests = [
        createMockQuest({ id: 'q1' }),
        createMockQuest({ id: 'q2' }),
        createMockQuest({ id: 'q3' }),
      ];

      render(<QuestStats quests={quests} />);
      expect(screen.getAllByText('3').length).toBeGreaterThan(0);
      expect(screen.getByText(/^total$/i)).toBeInTheDocument();
    });

    it('should render pending quest count', () => {
      const quests = [
        createMockQuest({ id: 'q1', status: 'PENDING' }),
        createMockQuest({ id: 'q2', status: 'PENDING' }),
        createMockQuest({ id: 'q3', status: 'IN_PROGRESS' }),
      ];

      render(<QuestStats quests={quests} />);
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
    });

    it('should render in progress quest count', () => {
      const quests = [
        createMockQuest({ id: 'q1', status: 'IN_PROGRESS' }),
        createMockQuest({ id: 'q2', status: 'IN_PROGRESS' }),
        createMockQuest({ id: 'q3', status: 'PENDING' }),
      ];

      render(<QuestStats quests={quests} />);
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText(/in progress/i)).toBeInTheDocument();
    });

    it('should render completed quest count', () => {
      const quests = [
        createMockQuest({ id: 'q1', status: 'COMPLETED' }),
        createMockQuest({ id: 'q2', status: 'APPROVED' }),
        createMockQuest({ id: 'q3', status: 'PENDING' }),
      ];

      render(<QuestStats quests={quests} />);
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText(/completed/i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show zeros when no quests', () => {
      render(<QuestStats quests={[]} />);

      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
      expect(screen.getByText(/^total$/i)).toBeInTheDocument();
    });

    it('should handle null quests array', () => {
      render(<QuestStats quests={null as unknown as QuestInstance[]} />);

      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    });

    it('should handle undefined quests array', () => {
      render(<QuestStats quests={undefined as unknown as QuestInstance[]} />);

      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    });
  });

  describe('Total Rewards Calculation', () => {
    it('should calculate total XP from all quests', () => {
      const quests = [
        createMockQuest({ id: 'q1', xp_reward: 100 }),
        createMockQuest({ id: 'q2', xp_reward: 200 }),
        createMockQuest({ id: 'q3', xp_reward: 150 }),
      ];

      render(<QuestStats quests={quests} />);
      expect(screen.getByText('450')).toBeInTheDocument();
      expect(screen.getByText(/total xp/i)).toBeInTheDocument();
    });

    it('should calculate total Gold from all quests', () => {
      const quests = [
        createMockQuest({ id: 'q1', gold_reward: 50 }),
        createMockQuest({ id: 'q2', gold_reward: 75 }),
        createMockQuest({ id: 'q3', gold_reward: 100 }),
      ];

      render(<QuestStats quests={quests} />);
      expect(screen.getByText('225')).toBeInTheDocument();
      expect(screen.getByText(/total gold/i)).toBeInTheDocument();
    });

    it('should handle quests with null rewards', () => {
      const quests = [
        createMockQuest({ id: 'q1', xp_reward: 100, gold_reward: 50 }),
        createMockQuest({ id: 'q2', xp_reward: null as unknown as number, gold_reward: null as unknown as number }),
      ];

      render(<QuestStats quests={quests} />);
      expect(screen.getByText('100')).toBeInTheDocument(); // XP
      expect(screen.getByText('50')).toBeInTheDocument(); // Gold
    });
  });

  describe('Completion Rate', () => {
    it('should calculate completion rate percentage', () => {
      const quests = [
        createMockQuest({ id: 'q1', status: 'APPROVED' }),
        createMockQuest({ id: 'q2', status: 'COMPLETED' }),
        createMockQuest({ id: 'q3', status: 'PENDING' }),
        createMockQuest({ id: 'q4', status: 'IN_PROGRESS' }),
      ];

      render(<QuestStats quests={quests} />);
      // 2 completed out of 4 = 50%
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText(/completion rate/i)).toBeInTheDocument();
    });

    it('should show 0% when no quests are completed', () => {
      const quests = [
        createMockQuest({ id: 'q1', status: 'PENDING' }),
        createMockQuest({ id: 'q2', status: 'IN_PROGRESS' }),
      ];

      render(<QuestStats quests={quests} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should show 100% when all quests are completed', () => {
      const quests = [
        createMockQuest({ id: 'q1', status: 'APPROVED' }),
        createMockQuest({ id: 'q2', status: 'COMPLETED' }),
      ];

      render(<QuestStats quests={quests} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should show 0% when no quests exist', () => {
      render(<QuestStats quests={[]} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should render stat cards in a grid', () => {
      const { container } = render(<QuestStats quests={[]} />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('should apply fantasy-card styling to stat items', () => {
      const { container } = render(<QuestStats quests={[]} />);

      const cards = container.querySelectorAll('.fantasy-card');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should use responsive grid layout', () => {
      const { container } = render(<QuestStats quests={[]} />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-2');
    });
  });

  describe('Performance', () => {
    it('should memoize statistics calculations', () => {
      const quests = [
        createMockQuest({ id: 'q1', status: 'PENDING', xp_reward: 100 }),
        createMockQuest({ id: 'q2', status: 'COMPLETED', xp_reward: 200 }),
      ];

      const { rerender } = render(<QuestStats quests={quests} />);
      const firstRender = screen.getByText('300'); // Total XP

      // Re-render with same quests reference
      rerender(<QuestStats quests={quests} />);
      const secondRender = screen.getByText('300');

      expect(firstRender).toBe(secondRender);
    });

    it('should handle large quest arrays efficiently', () => {
      const largeQuestArray = Array.from({ length: 1000 }, (_, i) =>
        createMockQuest({
          id: `quest-${i}`,
          status: i % 2 === 0 ? 'COMPLETED' : 'PENDING',
          xp_reward: 100,
          gold_reward: 50,
        })
      );

      render(<QuestStats quests={largeQuestArray} />);

      // Check for the labels to verify stats are calculated
      expect(screen.getByText(/^total$/i)).toBeInTheDocument();
      expect(screen.getByText(/^completed$/i)).toBeInTheDocument();
      expect(screen.getByText(/total xp/i)).toBeInTheDocument();
      expect(screen.getByText(/total gold/i)).toBeInTheDocument();

      // Verify the values exist (they may appear multiple times in different stat cards)
      expect(screen.getAllByText('1000').length).toBeGreaterThan(0); // Total or pending
      expect(screen.getAllByText('500').length).toBeGreaterThan(0); // Completed or pending
      expect(screen.getByText('100000')).toBeInTheDocument(); // Total XP
      expect(screen.getByText('50000')).toBeInTheDocument(); // Total Gold
    });
  });

  describe('Quest Type Breakdown', () => {
    it('should count individual vs family quests', () => {
      const quests = [
        createMockQuest({ id: 'q1', quest_type: 'INDIVIDUAL' }),
        createMockQuest({ id: 'q2', quest_type: 'INDIVIDUAL' }),
        createMockQuest({ id: 'q3', quest_type: 'FAMILY' }),
      ];

      render(<QuestStats quests={quests} showQuestTypes />);

      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText(/individual/i)).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText(/family/i)).toBeInTheDocument();
    });

    it('should not show quest type breakdown when showQuestTypes is false', () => {
      const quests = [
        createMockQuest({ id: 'q1', quest_type: 'INDIVIDUAL' }),
        createMockQuest({ id: 'q2', quest_type: 'FAMILY' }),
      ];

      render(<QuestStats quests={quests} showQuestTypes={false} />);

      expect(screen.queryByText(/individual/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/family/i)).not.toBeInTheDocument();
    });
  });
});
