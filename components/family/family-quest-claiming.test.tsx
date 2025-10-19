import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FamilyQuestClaiming from './family-quest-claiming';
import { Character, QuestInstance } from '@/lib/types/database';

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
  },
  {
    id: '2',
    title: 'Take out the trash',
    quest_type: 'FAMILY',
    status: 'AVAILABLE',
    xp_reward: 30,
    gold_reward: 10,
    recurrence_pattern: 'DAILY',
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

    it('should call onClaimQuest with the quest id when the claim button is clicked', () => {
      render(<FamilyQuestClaiming quests={mockQuests} character={mockCharacterWithoutActiveQuest} onClaimQuest={onClaimQuest} />);
      const claimButtons = screen.getAllByText('Claim Quest');
      fireEvent.click(claimButtons[0]);
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

    it('should disable all "Claim Quest" buttons', () => {
      render(<FamilyQuestClaiming quests={mockQuests} character={mockCharacterWithActiveQuest} onClaimQuest={onClaimQuest} />);
      const claimButtons = screen.getAllByText('Claim Quest');
      claimButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('should not call onClaimQuest when a disabled button is clicked', () => {
      render(<FamilyQuestClaiming quests={mockQuests} character={mockCharacterWithActiveQuest} onClaimQuest={onClaimQuest} />);
      const claimButtons = screen.getAllByText('Claim Quest');
      fireEvent.click(claimButtons[0]);
      expect(onClaimQuest).not.toHaveBeenCalled();
    });
  });
});
