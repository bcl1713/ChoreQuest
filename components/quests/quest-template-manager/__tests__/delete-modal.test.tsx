import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteModal } from '../delete-modal';
import type { QuestTemplate } from '@/lib/types/database';

const mockTemplate: QuestTemplate = {
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

describe('DeleteModal', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal with template title', () => {
    render(
      <DeleteModal template={mockTemplate} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    expect(screen.getByText('Delete Quest Template')).toBeInTheDocument();
    expect(screen.getByText(/Clean Room/)).toBeInTheDocument();
  });

  it('displays warning message', () => {
    render(
      <DeleteModal template={mockTemplate} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    expect(
      screen.getByText(/This will stop all future quests from being generated/)
    ).toBeInTheDocument();
  });

  it('renders cleanup checkbox unchecked by default', () => {
    render(
      <DeleteModal template={mockTemplate} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    const checkbox = screen.getByLabelText(
      /Also delete all current pending\/active quest instances/
    );
    expect(checkbox).not.toBeChecked();
  });

  it('toggles cleanup checkbox when clicked', () => {
    render(
      <DeleteModal template={mockTemplate} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    const checkbox = screen.getByLabelText(
      /Also delete all current pending\/active quest instances/
    );

    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('renders cancel button', () => {
    render(
      <DeleteModal template={mockTemplate} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders confirm delete button', () => {
    render(
      <DeleteModal template={mockTemplate} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', () => {
    render(
      <DeleteModal template={mockTemplate} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm with cleanup=false when confirm clicked without checkbox', () => {
    render(
      <DeleteModal template={mockTemplate} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    const confirmButton = screen.getByText('Confirm Delete');
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledWith('template-1', false);
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('calls onConfirm with cleanup=true when confirm clicked with checkbox checked', () => {
    render(
      <DeleteModal template={mockTemplate} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    const checkbox = screen.getByLabelText(
      /Also delete all current pending\/active quest instances/
    );
    fireEvent.click(checkbox);

    const confirmButton = screen.getByText('Confirm Delete');
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledWith('template-1', true);
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('displays shield alert icon', () => {
    const { container } = render(
      <DeleteModal template={mockTemplate} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    const icon = container.querySelector('.text-red-500');
    expect(icon).toBeInTheDocument();
  });

  it('has proper styling classes for danger modal', () => {
    const { container } = render(
      <DeleteModal template={mockTemplate} onConfirm={mockOnConfirm} onCancel={mockOnCancel} />
    );

    const modal = container.querySelector('.border-red-500');
    expect(modal).toBeInTheDocument();
  });
});
