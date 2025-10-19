import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QuestTemplateManager } from '@/components/quests/quest-template-manager';
import React from 'react';
import type { QuestTemplate } from '@/lib/types/database';

// Create mock functions
const mockUpdate = jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ error: null })) }));
const mockSelect = jest.fn(() => ({
  eq: jest.fn(() => ({
    order: jest.fn(() => Promise.resolve({ data: [], error: null })),
  })),
}));
const mockInsert = jest.fn(() => Promise.resolve({ error: null }));
const mockDelete = jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ error: null })) }));

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    })),
  },
}));

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    profile: {
      id: 'user-1',
      family_id: 'family-1',
      role: 'GUILD_MASTER',
    },
  }),
}));

jest.mock('@/lib/realtime-context', () => ({
  useRealtime: () => ({
    onQuestTemplateUpdate: jest.fn(() => () => {}),
  }),
}));

jest.mock('@/lib/user-service', () => ({
    userService: {
      getFamilyMembers: jest.fn().mockResolvedValue([
        { id: 'char-1', name: 'Alice' },
        { id: 'char-2', name: 'Bob' },
      ]),
    },
  }));

describe('QuestTemplateManager', () => {
  it('should render without crashing', async () => {
    render(<QuestTemplateManager />);

    // Should show loading initially, then show content
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for async state updates to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  it('should render main heading', async () => {
    render(<QuestTemplateManager />);

    await waitFor(() => {
      expect(screen.getByText('Quest Templates')).toBeInTheDocument();
    });
  });

  it('should render create template button', async () => {
    render(<QuestTemplateManager />);

    await waitFor(() => {
        expect(screen.getByText('Create New')).toBeInTheDocument();
    });
  });

  it('should open the create modal when the create button is clicked', async () => {
    render(<QuestTemplateManager />);
    await waitFor(() => {
        fireEvent.click(screen.getByText('Create New'));
    });
    await waitFor(() => {
        expect(screen.getByText('Create Quest Template')).toBeInTheDocument();
    });
  });

  describe('Pause/Resume functionality', () => {
    const mockActiveTemplate: QuestTemplate = {
      id: 'template-1',
      family_id: 'family-1',
      title: 'Active Quest',
      description: 'An active quest template',
      category: 'DAILY',
      quest_type: 'INDIVIDUAL',
      recurrence_pattern: 'DAILY',
      difficulty: 'MEDIUM',
      xp_reward: 50,
      gold_reward: 25,
      assigned_character_ids: ['char-1'],
      class_bonuses: null,
      is_paused: false,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    const mockPausedTemplate: QuestTemplate = {
      ...mockActiveTemplate,
      id: 'template-2',
      title: 'Paused Quest',
      is_paused: true,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should pause an active template when pause button is clicked', async () => {
      // Setup mock to return active template
      mockSelect.mockReturnValueOnce({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [mockActiveTemplate], error: null })),
        })),
      });

      const mockEq = jest.fn(() => Promise.resolve({ error: null }));
      mockUpdate.mockReturnValueOnce({ eq: mockEq });

      render(<QuestTemplateManager />);

      // Wait for template to load
      await waitFor(() => {
        expect(screen.getByText('Active Quest')).toBeInTheDocument();
      });

      // Click pause button
      const pauseButton = screen.getByText('Pause');
      fireEvent.click(pauseButton);

      // Verify update was called with is_paused: true
      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ is_paused: true });
        expect(mockEq).toHaveBeenCalledWith('id', 'template-1');
      });
    });

    it('should resume a paused template when resume button is clicked', async () => {
      // Setup mock to return paused template
      mockSelect.mockReturnValueOnce({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [mockPausedTemplate], error: null })),
        })),
      });

      const mockEq = jest.fn(() => Promise.resolve({ error: null }));
      mockUpdate.mockReturnValueOnce({ eq: mockEq });

      render(<QuestTemplateManager />);

      // Wait for template to load
      await waitFor(() => {
        expect(screen.getByText('Paused Quest')).toBeInTheDocument();
      });

      // Click resume button
      const resumeButton = screen.getByText('Resume');
      fireEvent.click(resumeButton);

      // Verify update was called with is_paused: false
      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ is_paused: false });
        expect(mockEq).toHaveBeenCalledWith('id', 'template-2');
      });
    });

    it('should display PAUSED badge for paused templates', async () => {
      mockSelect.mockReturnValueOnce({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [mockPausedTemplate], error: null })),
        })),
      });

      render(<QuestTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('PAUSED')).toBeInTheDocument();
      });
    });

    it('should not display PAUSED badge for active templates', async () => {
      mockSelect.mockReturnValueOnce({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [mockActiveTemplate], error: null })),
        })),
      });

      render(<QuestTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Active Quest')).toBeInTheDocument();
      });

      expect(screen.queryByText('PAUSED')).not.toBeInTheDocument();
    });

    it('should handle error when toggling pause state fails', async () => {
      mockSelect.mockReturnValueOnce({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [mockActiveTemplate], error: null })),
        })),
      });

      const mockEq = jest.fn(() => Promise.resolve({ error: { message: 'Database error' } }));
      mockUpdate.mockReturnValueOnce({ eq: mockEq });

      render(<QuestTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Active Quest')).toBeInTheDocument();
      });

      // Click pause button
      const pauseButton = screen.getByText('Pause');
      fireEvent.click(pauseButton);

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText('Failed to toggle pause state')).toBeInTheDocument();
      });
    });
  });
});