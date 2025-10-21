import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FamilyQuestClaiming from './family-quest-claiming';
import { Character, QuestInstance } from '@/lib/types/database';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => <div {...(props as Record<string, unknown>)}>{children}</div>,
  },
  AnimatePresence: ({ children }: Record<string, unknown>) => children,
}));

// Mock QuestCard component
jest.mock('@/components/quests/quest-card', () => {
  return function MockQuestCard({ quest, onPickup }: { quest: QuestInstance; onPickup?: (quest: QuestInstance) => void }) {
    return (
      <div data-testid={`quest-card-${quest.id}`}>
        <h4>{quest.title}</h4>
        {quest.recurrence_pattern && <p>📅 {quest.recurrence_pattern}</p>}
        <p>⚡ {quest.xp_reward} XP</p>
        <p>💰 {quest.gold_reward} Gold</p>
        {quest.assigned_to_id && <p>Assigned to another hero.</p>}
        {onPickup && (
          <button
            data-testid={`pickup-button-${quest.id}`}
            onClick={() => onPickup(quest)}
          >
            Pick Up Quest
          </button>
        )}
      </div>
    );
  };
});

// Mock data
const mockQuests: QuestInstance[] = [
  {
    id: '1',
    title: 'Load the dishwasher',
    quest_type: 'FAMILY',
    status: 'AVAILABLE',
    xp_reward: 50,
    gold_reward: 20,
    recurrence_pattern: 'DAILY',
    assigned_to_id: null,
  },
  {
    id: '2',
    title: 'Take out the trash',
    quest_type: 'FAMILY',
    status: 'AVAILABLE',
    xp_reward: 30,
    gold_reward: 10,
    recurrence_pattern: 'DAILY',
    assigned_to_id: null,
  },
  {
    id: '3',
    title: 'Walk the dog',
    quest_type: 'FAMILY',
    status: 'CLAIMED',
    assigned_to_id: 'hero-2',
    xp_reward: 40,
    gold_reward: 15,
    recurrence_pattern: 'DAILY',
  },
] as QuestInstance[];

const mockCharacterWithoutActiveQuest: Character = {
  id: 'hero-1',
  active_family_quest_id: null,
  name: 'Test Hero',
  // other fields are not relevant for this test
} as Character;

const mockCharacterWithActiveQuest: Character = {
  id: 'hero-1',
  active_family_quest_id: 'active-quest-123',
  name: 'Test Hero',
} as Character;

describe('FamilyQuestClaiming', () => {
  const onClaimQuest = jest.fn();

  beforeEach(() => {
    onClaimQuest.mockClear();
  });

  describe('when hero can claim quests', () => {
    it('should render a list of claimable quests', () => {
      render(<FamilyQuestClaiming quests={mockQuests} character={mockCharacterWithoutActiveQuest} onClaimQuest={onClaimQuest} />);
      expect(screen.getByText('Load the dishwasher')).toBeInTheDocument();
      expect(screen.getByText('Take out the trash')).toBeInTheDocument();
    });

    it('should show quests assigned to others as visually distinct', () => {
      render(<FamilyQuestClaiming quests={mockQuests} character={mockCharacterWithoutActiveQuest} onClaimQuest={onClaimQuest} />);
      expect(screen.getByText('Assigned to another hero.')).toBeInTheDocument();
    });

    it('should call onClaimQuest with the quest id when the pick up button is clicked', () => {
      render(<FamilyQuestClaiming quests={mockQuests} character={mockCharacterWithoutActiveQuest} onClaimQuest={onClaimQuest} />);
      const pickupButtons = screen.getAllByText('Pick Up Quest');
      fireEvent.click(pickupButtons[0]);
      expect(onClaimQuest).toHaveBeenCalledWith('1');
    });

    it('should not show the warning message', () => {
      render(<FamilyQuestClaiming quests={mockQuests} character={mockCharacterWithoutActiveQuest} onClaimQuest={onClaimQuest} />);
      expect(screen.queryByText(/You already have an active family quest/)).not.toBeInTheDocument();
    });
  });

  describe('when hero has an active family quest', () => {
    it('should display a warning message', () => {
      render(<FamilyQuestClaiming quests={mockQuests} character={mockCharacterWithActiveQuest} onClaimQuest={onClaimQuest} />);
      expect(screen.getByText(/You already have an active family quest/)).toBeInTheDocument();
    });

    it('should render QuestCard components for each quest', () => {
      render(<FamilyQuestClaiming quests={mockQuests} character={mockCharacterWithActiveQuest} onClaimQuest={onClaimQuest} />);
      expect(screen.getByTestId('quest-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('quest-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('quest-card-3')).toBeInTheDocument();
    });

    it('should still call onClaimQuest when clicking pick up button (parent component handles disabling)', () => {
      render(<FamilyQuestClaiming quests={mockQuests} character={mockCharacterWithActiveQuest} onClaimQuest={onClaimQuest} />);
      const pickupButtons = screen.getAllByText('Pick Up Quest');
      fireEvent.click(pickupButtons[0]);
      expect(onClaimQuest).toHaveBeenCalledWith('1');
    });
  });
});
