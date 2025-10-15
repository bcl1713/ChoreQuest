import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QuestTemplateManager } from '@/components/quest-template-manager';
import React from 'react';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
      update: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ error: null })) })),
      delete: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ error: null })) })),
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
});