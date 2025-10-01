import { render, screen } from '@testing-library/react';
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

describe('QuestTemplateManager', () => {
  it('should render without crashing', async () => {
    render(<QuestTemplateManager />);

    // Should show loading initially, then show content
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render main heading', async () => {
    render(<QuestTemplateManager />);

    // Wait for component to load
    await screen.findByText('Quest Templates');

    expect(screen.getByText('Quest Templates')).toBeInTheDocument();
  });

  it('should render create template button', async () => {
    render(<QuestTemplateManager />);

    await screen.findByText('Quest Templates');

    const createButton = screen.getByRole('button', { name: /create template/i });
    expect(createButton).toBeInTheDocument();
  });
});
