import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TemplateForm } from '../template-form';
import { useAuth } from '@/lib/auth-context';
import { userService } from '@/lib/user-service';
import { supabase } from '@/lib/supabase';
import type { QuestTemplate } from '@/lib/types/database';
import type { User } from '@/types';

jest.mock('@/lib/auth-context');
jest.mock('@/lib/user-service');
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockProfile = {
  id: 'user-1',
  family_id: 'family-1',
  role: 'HERO' as const,
};

const mockFamilyMembers: User[] = [
  { id: 'user-1', name: 'Parent', email: 'parent@test.com' } as User,
  { id: 'user-2', name: 'Child', email: 'child@test.com' } as User,
];

const mockCharacters = [
  { id: 'char-1', user_id: 'user-1', name: 'Warrior', class: 'WARRIOR' },
  { id: 'char-2', user_id: 'user-2', name: 'Mage', class: 'MAGE' },
];

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

describe('TemplateForm', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ profile: mockProfile });
    (userService.getFamilyMembers as jest.Mock).mockResolvedValue(mockFamilyMembers);
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: mockCharacters, error: null }),
    });
  });

  it('renders create form when no template provided', () => {
    render(<TemplateForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    expect(screen.getByText('Create Quest Template')).toBeInTheDocument();
  });

  it('renders edit form when template provided', () => {
    render(<TemplateForm template={mockTemplate} onSave={mockOnSave} onCancel={mockOnCancel} />);

    expect(screen.getByText('Edit Quest Template')).toBeInTheDocument();
  });

  it('populates form with template data when editing', async () => {
    render(<TemplateForm template={mockTemplate} onSave={mockOnSave} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Clean Room')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Clean your room daily')).toBeInTheDocument();
      expect(screen.getByDisplayValue('50')).toBeInTheDocument();
      expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    });
  });

  it('loads family members and characters on mount', async () => {
    render(<TemplateForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(userService.getFamilyMembers).toHaveBeenCalledWith('family-1');
      expect(supabase.from).toHaveBeenCalledWith('characters');
    });
  });

  it('updates title field on input change', async () => {
    render(<TemplateForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    const titleInput = screen.getByPlaceholderText('Title');
    fireEvent.change(titleInput, { target: { value: 'New Quest' } });

    expect(titleInput).toHaveValue('New Quest');
  });

  it('updates description field on input change', async () => {
    render(<TemplateForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    const descriptionInput = screen.getByPlaceholderText('Description');
    fireEvent.change(descriptionInput, { target: { value: 'New description' } });

    expect(descriptionInput).toHaveValue('New description');
  });

  it('updates quest type on select change', async () => {
    render(<TemplateForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    const questTypeSelect = screen.getByLabelText(/Quest Type/i);
    fireEvent.change(questTypeSelect, { target: { value: 'FAMILY' } });

    expect(questTypeSelect).toHaveValue('FAMILY');
  });

  it('updates recurrence pattern and category together', async () => {
    render(<TemplateForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    const recurrenceSelect = screen.getByLabelText(/Recurrence/i);
    fireEvent.change(recurrenceSelect, { target: { value: 'WEEKLY' } });

    expect(recurrenceSelect).toHaveValue('WEEKLY');
  });

  it('updates difficulty on select change', async () => {
    render(<TemplateForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    const difficultySelect = screen.getByLabelText(/Difficulty/i);
    fireEvent.change(difficultySelect, { target: { value: 'HARD' } });

    expect(difficultySelect).toHaveValue('HARD');
  });

  it('updates XP reward on input change', async () => {
    render(<TemplateForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    const xpInput = screen.getByPlaceholderText('XP Reward');
    fireEvent.change(xpInput, { target: { value: '100' } });

    expect(xpInput).toHaveValue(100);
  });

  it('updates gold reward on input change', async () => {
    render(<TemplateForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    const goldInput = screen.getByPlaceholderText('Gold Reward');
    fireEvent.change(goldInput, { target: { value: '50' } });

    expect(goldInput).toHaveValue(50);
  });

  it('shows character selection for individual quests', async () => {
    render(<TemplateForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByText('Assign to Characters')).toBeInTheDocument();
      expect(screen.getByText(/Warrior \(Parent\)/)).toBeInTheDocument();
      expect(screen.getByText(/Mage \(Child\)/)).toBeInTheDocument();
    });
  });

  it('hides character selection for family quests', async () => {
    render(<TemplateForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    const questTypeSelect = screen.getByLabelText(/Quest Type/i);
    fireEvent.change(questTypeSelect, { target: { value: 'FAMILY' } });

    await waitFor(() => {
      expect(screen.queryByText('Assign to Characters')).not.toBeInTheDocument();
    });
  });

  it('toggles character selection when checkbox clicked', async () => {
    render(<TemplateForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    await waitFor(() => {
      const checkbox = screen.getByLabelText(/Warrior \(Parent\)/);
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  it('pre-selects assigned characters when editing', async () => {
    render(<TemplateForm template={mockTemplate} onSave={mockOnSave} onCancel={mockOnCancel} />);

    await waitFor(() => {
      const checkbox = screen.getByLabelText(/Warrior \(Parent\)/);
      expect(checkbox).toBeChecked();
    });
  });

  it('calls onCancel when cancel button clicked', () => {
    render(<TemplateForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onSave with form data when form submitted', async () => {
    render(<TemplateForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByText(/Warrior \(Parent\)/)).toBeInTheDocument();
    });

    // Fill out form
    fireEvent.change(screen.getByPlaceholderText('Title'), {
      target: { value: 'Test Quest' },
    });
    fireEvent.change(screen.getByPlaceholderText('Description'), {
      target: { value: 'Test Description' },
    });

    // Select a character
    const checkbox = screen.getByLabelText(/Warrior \(Parent\)/);
    fireEvent.click(checkbox);

    // Submit form
    const saveButton = screen.getByText('Save Template');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Quest',
          description: 'Test Description',
          quest_type: 'INDIVIDUAL',
          assigned_character_ids: ['char-1'],
        })
      );
    });
  });

  it('shows alert when submitting individual quest without character assignment', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<TemplateForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByText(/Warrior \(Parent\)/)).toBeInTheDocument();
    });

    // Fill out form but don't select any characters
    fireEvent.change(screen.getByPlaceholderText('Title'), {
      target: { value: 'Test Quest' },
    });
    fireEvent.change(screen.getByPlaceholderText('Description'), {
      target: { value: 'Test Description' },
    });

    // Submit form
    const saveButton = screen.getByText('Save Template');
    fireEvent.click(saveButton);

    expect(alertSpy).toHaveBeenCalledWith(
      'Individual quests must be assigned to at least one character.'
    );
    expect(mockOnSave).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('allows submitting family quest without character assignment', async () => {
    render(<TemplateForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByText(/Warrior \(Parent\)/)).toBeInTheDocument();
    });

    // Change to family quest
    const questTypeSelect = screen.getByLabelText(/Quest Type/i);
    fireEvent.change(questTypeSelect, { target: { value: 'FAMILY' } });

    // Fill out form
    fireEvent.change(screen.getByPlaceholderText('Title'), {
      target: { value: 'Test Family Quest' },
    });
    fireEvent.change(screen.getByPlaceholderText('Description'), {
      target: { value: 'Test Description' },
    });

    // Submit form
    const saveButton = screen.getByText('Save Template');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('shows message when no characters available', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    render(<TemplateForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByText('No characters found for this family.')).toBeInTheDocument();
    });
  });

  it('handles error when loading family members fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (userService.getFamilyMembers as jest.Mock).mockRejectedValue(
      new Error('Failed to load')
    );

    render(<TemplateForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load family members',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });
});
