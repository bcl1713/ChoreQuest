import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateItem } from '../template-item';
import type { QuestTemplate } from '@/lib/types/database';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => <div {...(props as Record<string, unknown>)}>{children}</div>,
  },
  AnimatePresence: ({ children }: Record<string, unknown>) => children,
}));

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

  it('displays recurrence pattern', () => {
    render(<TemplateItem template={mockIndividualTemplate} {...mockHandlers} />);

    // QuestCard displays recurrence as "Daily" with a Calendar icon
    expect(screen.getByText(/Daily/)).toBeInTheDocument();
  });

  it('displays quest type', () => {
    render(<TemplateItem template={mockIndividualTemplate} {...mockHandlers} />);

    // Quest type is now displayed differently in QuestCard
    expect(screen.getByText('Clean Room')).toBeInTheDocument();
  });

  it('shows unavailable badge when template is paused', () => {
    render(<TemplateItem template={mockPausedTemplate} {...mockHandlers} />);

    // QuestCard shows "UNAVAILABLE" badge instead of "PAUSED"
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });

  it('does not show unavailable badge when template is active', () => {
    render(<TemplateItem template={mockIndividualTemplate} {...mockHandlers} />);

    expect(screen.queryByText('Unavailable')).not.toBeInTheDocument();
  });

  it('applies overlay styling when template is paused', () => {
    const { container } = render(<TemplateItem template={mockPausedTemplate} {...mockHandlers} />);

    // QuestCard applies a black overlay with opacity when paused
    const overlay = container.querySelector('.bg-black.opacity-25');
    expect(overlay).toBeInTheDocument();
  });

  it('does not apply overlay when template is active', () => {
    const { container } = render(<TemplateItem template={mockIndividualTemplate} {...mockHandlers} />);

    const overlay = container.querySelector('.bg-black.opacity-25');
    expect(overlay).not.toBeInTheDocument();
  });

  it('displays template description', () => {
    render(<TemplateItem template={mockIndividualTemplate} {...mockHandlers} />);

    expect(screen.getByText('Clean your room daily')).toBeInTheDocument();
  });

  it('displays description for family quests', () => {
    render(<TemplateItem template={mockFamilyTemplate} {...mockHandlers} />);

    expect(screen.getByText('Prepare and share a family meal')).toBeInTheDocument();
  });

  it('displays rewards (XP and Gold)', () => {
    render(<TemplateItem template={mockIndividualTemplate} {...mockHandlers} />);

    expect(screen.getByText(/50.*XP/)).toBeInTheDocument();
    expect(screen.getByText(/25.*Gold/)).toBeInTheDocument();
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

  it('displays difficulty level', () => {
    render(<TemplateItem template={mockIndividualTemplate} {...mockHandlers} />);

    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('displays weekly recurrence pattern correctly', () => {
    render(<TemplateItem template={mockFamilyTemplate} {...mockHandlers} />);

    expect(screen.getByText(/Weekly/)).toBeInTheDocument();
  });

  it('renders all action buttons', () => {
    render(<TemplateItem template={mockIndividualTemplate} {...mockHandlers} />);

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});
