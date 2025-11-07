import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CharacterNameForm from './CharacterNameForm';
import { ProfileService } from '@/lib/profile-service';
import { Character } from '@/lib/types/database';

jest.mock('@/lib/profile-service');

const mockCharacter: Character = {
  id: 'char-123',
  user_id: 'user-123',
  name: 'TestCharacter',
  class: 'MAGE',
  level: 5,
  gold: 100,
  xp: 0,
  honor: 0,
  gems: 0,
  last_class_change_at: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

describe('CharacterNameForm', () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSuccess.mockClear();
  });

  it('renders the form with current character name', () => {
    render(
      <CharacterNameForm character={mockCharacter} onSuccess={mockOnSuccess} />
    );

    expect(screen.getByDisplayValue('TestCharacter')).toBeInTheDocument();
    expect(screen.getByText('TestCharacter')).toBeInTheDocument();
  });

  it('displays character count', async () => {
    render(
      <CharacterNameForm character={mockCharacter} onSuccess={mockOnSuccess} />
    );

    const input = screen.getByPlaceholderText('Enter new character name...');
    expect(screen.getByText(/14\/50 characters/)).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, 'NewName');
    expect(screen.getByText(/7\/50 characters/)).toBeInTheDocument();
  });

  it('disables submit button when name is unchanged', () => {
    render(
      <CharacterNameForm character={mockCharacter} onSuccess={mockOnSuccess} />
    );

    const button = screen.getByText('Update Character Name');
    expect(button).toBeDisabled();
  });

  it('enables submit button when name is different', async () => {
    render(
      <CharacterNameForm character={mockCharacter} onSuccess={mockOnSuccess} />
    );

    const input = screen.getByPlaceholderText('Enter new character name...');
    await userEvent.clear(input);
    await userEvent.type(input, 'DifferentName');

    const button = screen.getByText('Update Character Name');
    expect(button).not.toBeDisabled();
  });

  it('shows error when name is empty', async () => {
    render(
      <CharacterNameForm character={mockCharacter} onSuccess={mockOnSuccess} />
    );

    const input = screen.getByPlaceholderText('Enter new character name...');
    await userEvent.clear(input);
    await userEvent.type(input, 'NewName');

    const button = screen.getByText('Update Character Name');
    await userEvent.click(button);

    // Clear and submit (should show error)
    await userEvent.clear(input);
    await userEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText('Character name cannot be empty')
      ).toBeInTheDocument();
    });
  });

  it('calls ProfileService.changeCharacterName on valid submission', async () => {
    const mockChangeCharacterName = jest.fn().mockResolvedValue({
      id: 'char-123',
      name: 'NewName',
    });
    (ProfileService.changeCharacterName as jest.Mock) =
      mockChangeCharacterName;

    render(
      <CharacterNameForm character={mockCharacter} onSuccess={mockOnSuccess} />
    );

    const input = screen.getByPlaceholderText('Enter new character name...');
    await userEvent.clear(input);
    await userEvent.type(input, 'NewName');

    const button = screen.getByText('Update Character Name');
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockChangeCharacterName).toHaveBeenCalledWith(
        'char-123',
        'NewName'
      );
    });
  });

  it('calls onSuccess callback when name change succeeds', async () => {
    const mockChangeCharacterName = jest.fn().mockResolvedValue({
      id: 'char-123',
      name: 'NewName',
    });
    (ProfileService.changeCharacterName as jest.Mock) =
      mockChangeCharacterName;

    render(
      <CharacterNameForm character={mockCharacter} onSuccess={mockOnSuccess} />
    );

    const input = screen.getByPlaceholderText('Enter new character name...');
    await userEvent.clear(input);
    await userEvent.type(input, 'NewName');

    const button = screen.getByText('Update Character Name');
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(
        'Character name updated successfully!'
      );
    });
  });

  it('handles errors from ProfileService', async () => {
    const mockError = new Error('Server error');
    (ProfileService.changeCharacterName as jest.Mock).mockRejectedValue(
      mockError
    );

    render(
      <CharacterNameForm character={mockCharacter} onSuccess={mockOnSuccess} />
    );

    const input = screen.getByPlaceholderText('Enter new character name...');
    await userEvent.clear(input);
    await userEvent.type(input, 'NewName');

    const button = screen.getByText('Update Character Name');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const mockChangeCharacterName = jest.fn(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                id: 'char-123',
                name: 'NewName',
              }),
            100
          )
        )
    );
    (ProfileService.changeCharacterName as jest.Mock) =
      mockChangeCharacterName;

    render(
      <CharacterNameForm character={mockCharacter} onSuccess={mockOnSuccess} />
    );

    const input = screen.getByPlaceholderText('Enter new character name...');
    await userEvent.clear(input);
    await userEvent.type(input, 'NewName');

    const button = screen.getByText('Update Character Name');
    await userEvent.click(button);

    expect(screen.getByText('Updating Name...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Update Character Name')).toBeInTheDocument();
    });
  });

  it('enforces 50 character limit', async () => {
    render(
      <CharacterNameForm character={mockCharacter} onSuccess={mockOnSuccess} />
    );

    const input = screen.getByPlaceholderText(
      'Enter new character name...'
    ) as HTMLInputElement;
    const longName = 'a'.repeat(60);

    await userEvent.clear(input);
    await userEvent.type(input, longName);

    expect(input.value.length).toBeLessThanOrEqual(50);
  });
});
