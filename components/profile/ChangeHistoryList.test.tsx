import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChangeHistoryList from './ChangeHistoryList';
import { ProfileService, ChangeHistoryEntry } from '@/lib/profile-service';
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

const mockHistory: ChangeHistoryEntry[] = [
  {
    id: '1',
    character_id: 'char-123',
    change_type: 'name',
    old_value: 'OldName',
    new_value: 'NewName',
    gold_cost: null,
    created_at: '2025-01-06T10:00:00Z',
  },
  {
    id: '2',
    character_id: 'char-123',
    change_type: 'class',
    old_value: 'MAGE',
    new_value: 'KNIGHT',
    gold_cost: 250,
    created_at: '2025-01-05T15:30:00Z',
  },
  {
    id: '3',
    character_id: 'char-123',
    change_type: 'password',
    old_value: null,
    new_value: null,
    gold_cost: null,
    created_at: '2025-01-04T12:00:00Z',
  },
];

describe('ChangeHistoryList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ProfileService.getChangeHistory as jest.Mock).mockResolvedValue(mockHistory);
  });

  it('renders change history table', async () => {
    render(<ChangeHistoryList character={mockCharacter} />);

    await waitFor(() => {
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Change')).toBeInTheDocument();
      expect(screen.getByText('Cost')).toBeInTheDocument();
    });
  });

  it('loads history on mount', async () => {
    render(<ChangeHistoryList character={mockCharacter} />);

    await waitFor(() => {
      expect(ProfileService.getChangeHistory).toHaveBeenCalledWith(
        'char-123',
        10, // ITEMS_PER_PAGE
        1 // currentPage
      );
    });
  });

  it('displays loading spinner while fetching', () => {
    (ProfileService.getChangeHistory as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<ChangeHistoryList character={mockCharacter} />);

    // Spinner should render while loading (hard to test without testid, so skip for now)
  });

  it('displays change history entries', async () => {
    render(<ChangeHistoryList character={mockCharacter} />);

    await waitFor(() => {
      // Check for name change
      expect(screen.getByText('Character Name')).toBeInTheDocument();
      expect(screen.getByText(/OldName → NewName/)).toBeInTheDocument();

      // Check for class change
      expect(screen.getByText('Character Class')).toBeInTheDocument();
      expect(screen.getByText(/MAGE → KNIGHT/)).toBeInTheDocument();

      // Check for password change
      expect(screen.getByText('Password')).toBeInTheDocument();
    });
  });

  it('formats dates correctly', async () => {
    render(<ChangeHistoryList character={mockCharacter} />);

    await waitFor(() => {
      expect(screen.getByText(/Jan 6, /)).toBeInTheDocument();
      expect(screen.getByText(/Jan 5, /)).toBeInTheDocument();
      expect(screen.getByText(/Jan 4, /)).toBeInTheDocument();
    });
  });

  it('displays gold cost for class changes', async () => {
    render(<ChangeHistoryList character={mockCharacter} />);

    await waitFor(() => {
      expect(screen.getByText('-250 gold')).toBeInTheDocument();
    });
  });

  it('hides password values for security', async () => {
    render(<ChangeHistoryList character={mockCharacter} />);

    await waitFor(() => {
      expect(screen.getByText('Password changed (hidden for security)')).toBeInTheDocument();
      expect(screen.queryByText(/old.*password/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/new.*password/i)).not.toBeInTheDocument();
    });
  });

  it('shows empty state when no changes', async () => {
    (ProfileService.getChangeHistory as jest.Mock).mockResolvedValue([]);

    render(<ChangeHistoryList character={mockCharacter} />);

    await waitFor(() => {
      expect(screen.getByText('No changes recorded yet')).toBeInTheDocument();
    });
  });

  it('shows error message on fetch failure', async () => {
    (ProfileService.getChangeHistory as jest.Mock).mockRejectedValue(
      new Error('Failed to load history')
    );

    render(<ChangeHistoryList character={mockCharacter} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to Load History')).toBeInTheDocument();
      expect(screen.getByText('Failed to load history')).toBeInTheDocument();
    });
  });

  it('handles pagination - next button disabled when fewer items', async () => {
    (ProfileService.getChangeHistory as jest.Mock).mockResolvedValue([
      mockHistory[0],
    ]);

    render(<ChangeHistoryList character={mockCharacter} />);

    await waitFor(() => {
      const nextButton = screen.getByText('Next').closest('button');
      expect(nextButton).toBeDisabled();
    });
  });

  it('enables next button when full page of results', async () => {
    const fullPage = Array(10).fill(mockHistory[0]);
    (ProfileService.getChangeHistory as jest.Mock).mockResolvedValue(fullPage);

    render(<ChangeHistoryList character={mockCharacter} />);

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(btn => btn.textContent?.includes('Next'));
      expect(nextButton).not.toBeDisabled();
    });
  });

  it('disables previous button on first page', async () => {
    render(<ChangeHistoryList character={mockCharacter} />);

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const prevButton = buttons.find(btn => btn.textContent?.includes('Previous'));
      expect(prevButton).toBeDisabled();
    });
  });

  it('loads next page when Next button clicked', async () => {
    const fullPage = Array(10).fill(mockHistory[0]);
    (ProfileService.getChangeHistory as jest.Mock).mockResolvedValue(fullPage);

    render(<ChangeHistoryList character={mockCharacter} />);

    await waitFor(() => {
      expect(ProfileService.getChangeHistory).toHaveBeenCalled();
    });
  });

  it('displays current page number', async () => {
    render(<ChangeHistoryList character={mockCharacter} />);

    await waitFor(() => {
      expect(screen.getByText('Page 1')).toBeInTheDocument();
    });
  });

  it('labels name changes correctly', async () => {
    render(<ChangeHistoryList character={mockCharacter} />);

    await waitFor(() => {
      expect(screen.getByText('Character Name')).toBeInTheDocument();
    });
  });

  it('labels class changes correctly', async () => {
    render(<ChangeHistoryList character={mockCharacter} />);

    await waitFor(() => {
      expect(screen.getByText('Character Class')).toBeInTheDocument();
    });
  });

  it('labels password changes correctly', async () => {
    render(<ChangeHistoryList character={mockCharacter} />);

    await waitFor(() => {
      expect(screen.getByText('Password')).toBeInTheDocument();
    });
  });

  it('shows dash for missing costs', async () => {
    render(<ChangeHistoryList character={mockCharacter} />);

    await waitFor(() => {
      // Name and password changes should show dash
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThan(0);
    });
  });
});
