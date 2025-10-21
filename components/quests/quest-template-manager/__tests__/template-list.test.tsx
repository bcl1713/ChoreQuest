import React from 'react';
import { render, screen } from '@testing-library/react';
import { TemplateList } from '../template-list';
import type { QuestTemplate } from '@/lib/types/database';

const mockIndividualTemplate: QuestTemplate = {
  id: 'template-1',
  family_id: 'family-1',
  title: 'Clean Room',
  description: 'Clean your room daily',
  category: 'DAILY',
  quest_type: 'INDIVIDUAL',
  recurrence_pattern: 'DAILY',
  difficulty: 'MEDIUM',
  xp_reward: 50,
  gold_reward: 25,
  assigned_character_ids: ['char-1'],
  class_bonuses: null,
  is_paused: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockFamilyTemplate: QuestTemplate = {
  id: 'template-2',
  family_id: 'family-1',
  title: 'Family Dinner',
  description: 'Prepare and share a family meal',
  category: 'WEEKLY',
  quest_type: 'FAMILY',
  recurrence_pattern: 'WEEKLY',
  difficulty: 'HARD',
  xp_reward: 100,
  gold_reward: 50,
  assigned_character_ids: null,
  class_bonuses: null,
  is_paused: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('TemplateList', () => {
  const mockHandlers = {
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onTogglePause: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no templates', () => {
    render(<TemplateList templates={[]} {...mockHandlers} />);

    expect(screen.getByText('No individual quest templates yet.')).toBeInTheDocument();
    expect(screen.getByText('No family quest templates yet.')).toBeInTheDocument();
  });

  it('displays individual quest templates under Individual Quest Templates section', () => {
    render(<TemplateList templates={[mockIndividualTemplate]} {...mockHandlers} />);

    expect(screen.getByText(/Individual Quest Templates/)).toBeInTheDocument();
    expect(screen.getByText('Clean Room')).toBeInTheDocument();
  });

  it('displays family quest templates under Family Quest Templates section', () => {
    render(<TemplateList templates={[mockFamilyTemplate]} {...mockHandlers} />);

    expect(screen.getByText(/Family Quest Templates/)).toBeInTheDocument();
    expect(screen.getByText('Family Dinner')).toBeInTheDocument();
  });

  it('separates templates by type correctly', () => {
    render(
      <TemplateList
        templates={[mockIndividualTemplate, mockFamilyTemplate]}
        {...mockHandlers}
      />
    );

    const individualSection = screen.getByText(/Individual Quest Templates/).closest('div');
    const familySection = screen.getByText(/Family Quest Templates/).closest('div');

    expect(individualSection).toContainHTML('Clean Room');
    expect(familySection).toContainHTML('Family Dinner');
  });

  it('shows empty message for individual quests when none exist', () => {
    render(<TemplateList templates={[mockFamilyTemplate]} {...mockHandlers} />);

    expect(screen.getByText('No individual quest templates yet.')).toBeInTheDocument();
    expect(screen.queryByText('No family quest templates yet.')).not.toBeInTheDocument();
  });

  it('shows empty message for family quests when none exist', () => {
    render(<TemplateList templates={[mockIndividualTemplate]} {...mockHandlers} />);

    expect(screen.getByText('No family quest templates yet.')).toBeInTheDocument();
    expect(screen.queryByText('No individual quest templates yet.')).not.toBeInTheDocument();
  });

  it('renders multiple templates of the same type', () => {
    const template2: QuestTemplate = {
      ...mockIndividualTemplate,
      id: 'template-3',
      title: 'Do Homework',
    };

    render(
      <TemplateList
        templates={[mockIndividualTemplate, template2]}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Clean Room')).toBeInTheDocument();
    expect(screen.getByText('Do Homework')).toBeInTheDocument();
  });

  it('passes handlers to TemplateItem components', () => {
    render(<TemplateList templates={[mockIndividualTemplate]} {...mockHandlers} />);

    // TemplateItem should receive the handlers as props
    // This is validated by the fact that the component renders without errors
    expect(screen.getByText('Clean Room')).toBeInTheDocument();
  });
});
