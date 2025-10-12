import { render, screen, waitFor } from '@testing-library/react';
import { QuestTemplateManager } from '@/components/quest-template-manager';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
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

    // Wait for component to load and async updates to complete
    await waitFor(async () => {
      expect(await screen.findByText('📜 Quest Templates')).toBeInTheDocument();
    });
  });

  it('should render create template button', async () => {
    render(<QuestTemplateManager />);

    // Wait for component to load and async updates to complete
    await waitFor(async () => {
      expect(await screen.findByText('📜 Quest Templates')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /create template/i });
    expect(createButton).toBeInTheDocument();
  });
});
