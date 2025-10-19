import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateItem } from '../template-item';
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
  assigned_character_ids: ['char-1', 'char-2'],
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

const mockPausedTemplate: QuestTemplate = {
  ...mockIndividualTemplate,
  id: 'template-3',
  title: 'Paused Quest',
  is_paused: true,
};

describe('TemplateItem', () => {
  const mockHandlers = {
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onTogglePause: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders template title', () => {
    render(<TemplateItem template={mockIndividualTemplate} {...mockHandlers} />);

    expect(screen.getByText('Clean Room')).toBeInTheDocument();
  });

  it('displays recurrence pattern badge', () => {
    render(<TemplateItem template={mockIndividualTemplate} {...mockHandlers} />);

    expect(screen.getByText('DAILY')).toBeInTheDocument();
  });

  it('displays quest type badge', () => {
    render(<TemplateItem template={mockIndividualTemplate} {...mockHandlers} />);

    expect(screen.getByText('INDIVIDUAL')).toBeInTheDocument();
  });

  it('shows paused badge when template is paused', () => {
    render(<TemplateItem template={mockPausedTemplate} {...mockHandlers} />);

    expect(screen.getByText('PAUSED')).toBeInTheDocument();
  });

  it('does not show paused badge when template is active', () => {
    render(<TemplateItem template={mockIndividualTemplate} {...mockHandlers} />);

    expect(screen.queryByText('PAUSED')).not.toBeInTheDocument();
  });

  it('applies dimmed styling when template is paused', () => {
    const { container } = render(<TemplateItem template={mockPausedTemplate} {...mockHandlers} />);

    const card = container.querySelector('.bg-gray-700.opacity-60');
    expect(card).toBeInTheDocument();
  });

  it('applies normal styling when template is active', () => {
    const { container } = render(<TemplateItem template={mockIndividualTemplate} {...mockHandlers} />);

    const card = container.querySelector('.bg-gray-900');
    expect(card).toBeInTheDocument();
    expect(card).not.toHaveClass('opacity-60');
  });

  it('displays assigned character IDs for individual quests', () => {
    render(<TemplateItem template={mockIndividualTemplate} {...mockHandlers} />);

    expect(screen.getByText(/Assigned to: char-1, char-2/)).toBeInTheDocument();
  });

  it('displays "Claimable by: Any hero" for family quests', () => {
    render(<TemplateItem template={mockFamilyTemplate} {...mockHandlers} />);

    expect(screen.getByText('Claimable by: Any hero')).toBeInTheDocument();
  });

  it('handles null assigned_character_ids for individual quests', () => {
    const template = { ...mockIndividualTemplate, assigned_character_ids: null };
    render(<TemplateItem template={template} {...mockHandlers} />);

    expect(screen.getByText('Assigned to:')).toBeInTheDocument();
  });

  it('renders edit button', () => {
    render(<TemplateItem template={mockIndividualTemplate} {...mockHandlers} />);

    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    render(<TemplateItem template={mockIndividualTemplate} {...mockHandlers} />);

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockIndividualTemplate);
    expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1);
  });

  it('renders pause button when template is active', () => {
    render(<TemplateItem template={mockIndividualTemplate} {...mockHandlers} />);

    expect(screen.getByText('Pause')).toBeInTheDocument();
  });

  it('renders resume button when template is paused', () => {
    render(<TemplateItem template={mockPausedTemplate} {...mockHandlers} />);

    expect(screen.getByText('Resume')).toBeInTheDocument();
  });

  it('calls onTogglePause when pause button clicked', () => {
    render(<TemplateItem template={mockIndividualTemplate} {...mockHandlers} />);

    const pauseButton = screen.getByText('Pause');
    fireEvent.click(pauseButton);

    expect(mockHandlers.onTogglePause).toHaveBeenCalledWith(mockIndividualTemplate);
    expect(mockHandlers.onTogglePause).toHaveBeenCalledTimes(1);
  });

  it('calls onTogglePause when resume button clicked', () => {
    render(<TemplateItem template={mockPausedTemplate} {...mockHandlers} />);

    const resumeButton = screen.getByText('Resume');
    fireEvent.click(resumeButton);

    expect(mockHandlers.onTogglePause).toHaveBeenCalledWith(mockPausedTemplate);
    expect(mockHandlers.onTogglePause).toHaveBeenCalledTimes(1);
  });

  it('renders delete button', () => {
    render(<TemplateItem template={mockIndividualTemplate} {...mockHandlers} />);

    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('calls onDelete when delete button clicked', () => {
    render(<TemplateItem template={mockIndividualTemplate} {...mockHandlers} />);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockIndividualTemplate);
    expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1);
  });

  it('renders user icon for individual quests', () => {
    const { container } = render(<TemplateItem template={mockIndividualTemplate} {...mockHandlers} />);

    const userIcon = container.querySelector('.text-purple-400');
    expect(userIcon).toBeInTheDocument();
  });

  it('renders users icon for family quests', () => {
    const { container } = render(<TemplateItem template={mockFamilyTemplate} {...mockHandlers} />);

    const usersIcon = container.querySelector('.text-green-400');
    expect(usersIcon).toBeInTheDocument();
  });

  it('displays weekly recurrence pattern correctly', () => {
    render(<TemplateItem template={mockFamilyTemplate} {...mockHandlers} />);

    expect(screen.getByText('WEEKLY')).toBeInTheDocument();
  });

  it('renders all action buttons', () => {
    render(<TemplateItem template={mockIndividualTemplate} {...mockHandlers} />);

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});
