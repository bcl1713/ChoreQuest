/**
 * Unit tests for Quest Interaction Buttons - Core MVP Feature
 *
 * These tests verify that the QuestDashboard component renders the correct
 * interaction buttons for unassigned quests based on user roles.
 *
 * THESE TESTS WILL FAIL until the quest pickup/management features are implemented.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuestDashboard from '../../components/quest-dashboard';
import { questService } from '@/lib/quest-service';

// Mock the auth context
const mockUseAuth = jest.fn();
jest.mock('../../lib/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock the quest service
jest.mock('@/lib/quest-service', () => ({
  questService: {
    getQuestInstances: jest.fn(),
    updateQuestStatus: jest.fn(),
    assignQuest: jest.fn(),
    cancelQuest: jest.fn(),
  },
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('Quest Interaction Buttons - Core MVP Feature', () => {
  const mockHeroUser = {
    id: 'hero-123',
    email: 'hero@test.com',
    role: 'HERO',
    userName: 'Hero Player',
  };

  const mockGMUser = {
    id: 'gm-123',
    email: 'gm@test.com',
    role: 'GUILD_MASTER',
    userName: 'Guild Master',
  };

  const mockUnassignedQuest = {
    id: 'quest-123',
    title: 'Clean the Kitchen',
    description: 'Deep clean kitchen counters and dishes',
    status: 'PENDING',
    difficulty: 'MEDIUM',
    xpReward: 50,
    goldReward: 25,
    assignedToId: null, // This makes it unassigned
    dueDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    ((questService.getQuestInstances as jest.Mock) as jest.Mock).mockResolvedValue({
      instances: [mockUnassignedQuest],
    });
  });

  test('Hero user sees Pick Up Quest button on unassigned quests', async () => {
    console.log('✅ [Unit Test] Testing Pick Up Quest button for Hero user');

    mockUseAuth.mockReturnValue({
      user: mockHeroUser,
      token: 'mock-token',
    });

    render(<QuestDashboard onError={jest.fn()} />);

    // Wait for quest data to load
    await waitFor(() => {
      expect((questService.getQuestInstances as jest.Mock)).toHaveBeenCalled();
    });

    // Verify Available Quests section appears
    await waitFor(() => {
      expect(screen.getByText('📋 Available Quests')).toBeInTheDocument();
    });

    // Verify unassigned quest appears
    expect(screen.getByText('Clean the Kitchen')).toBeInTheDocument();

    // CRITICAL FAILING TEST: Pick Up Quest button should exist but doesn't
    console.log('✅ [Verification] Looking for Pick Up Quest button - THIS WILL FAIL');
    const pickUpButton = screen.getByText('Pick Up Quest');
    expect(pickUpButton).toBeInTheDocument(); // THIS WILL FAIL

    // Test button click functionality
    fireEvent.click(pickUpButton);

    // Verify quest assignment API call
    await waitFor(() => {
      expect((questService.assignQuest as jest.Mock)).toHaveBeenCalledWith(
        'quest-123',
        'hero-123'
      );
    });
  });

  test('Guild Master sees both Pick Up and Management controls on unassigned quests', async () => {
    console.log('✅ [Unit Test] Testing GM management controls');

    mockUseAuth.mockReturnValue({
      user: mockGMUser,
      token: 'mock-token',
    });

    render(<QuestDashboard onError={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('📋 Available Quests')).toBeInTheDocument();
    });

    expect(screen.getByText('Clean the Kitchen')).toBeInTheDocument();

    // CRITICAL FAILING TESTS: GM controls should exist but don't
    console.log('✅ [Verification] Looking for Pick Up Quest button for GM - THIS WILL FAIL');
    expect(screen.getByText('Pick Up Quest')).toBeInTheDocument(); // WILL FAIL

    console.log('✅ [Verification] Looking for Assign To dropdown - THIS WILL FAIL');
    const assignDropdown = screen.getByTestId('assign-quest-dropdown');
    expect(assignDropdown).toBeInTheDocument(); // WILL FAIL

    console.log('✅ [Verification] Looking for Cancel Quest button - THIS WILL FAIL');
    expect(screen.getByText('Cancel Quest')).toBeInTheDocument(); // WILL FAIL

    // Test assignment functionality
    fireEvent.change(assignDropdown, { target: { value: 'hero-123' } });
    const assignButton = screen.getByText('Assign');
    fireEvent.click(assignButton);

    await waitFor(() => {
      expect((questService.assignQuest as jest.Mock)).toHaveBeenCalledWith(
        'quest-123',
        'hero-123'
      );
    });

    // Test cancellation functionality
    const cancelButton = screen.getByText('Cancel Quest');
    fireEvent.click(cancelButton);

    // Should show confirmation dialog
    expect(screen.getByText('Are you sure you want to cancel this quest?')).toBeInTheDocument();

    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect((questService.cancelQuest as jest.Mock)).toHaveBeenCalledWith('quest-123');
    });
  });

  test('Unassigned quests display without interaction buttons when no user', async () => {
    console.log('✅ [Unit Test] Testing quest display without user context');

    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
    });

    render(<QuestDashboard onError={jest.fn()} />);

    // Should show error state for no user
    await waitFor(() => {
      expect(screen.getByText(/User not authenticated/)).toBeInTheDocument();
    });
  });

  test('Quest pickup updates quest list and moves quest to My Quests section', async () => {
    console.log('✅ [Unit Test] Testing quest pickup workflow');

    const assignedQuest = {
      ...mockUnassignedQuest,
      assignedToId: 'hero-123',
      status: 'IN_PROGRESS',
    };

    mockUseAuth.mockReturnValue({
      user: mockHeroUser,
      token: 'mock-token',
    });

    // Mock the quest service to return updated data after assignment
    (questService.getQuestInstances as jest.Mock)
      .mockResolvedValueOnce({ instances: [mockUnassignedQuest] }) // Initial load
      .mockResolvedValueOnce({ instances: [assignedQuest] }); // After pickup

    (questService.assignQuest as jest.Mock).mockResolvedValue({ success: true });

    render(<QuestDashboard onError={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('📋 Available Quests')).toBeInTheDocument();
    });

    const pickUpButton = screen.getByText('Pick Up Quest');
    fireEvent.click(pickUpButton);

    // After pickup, quest should move to My Quests section
    await waitFor(() => {
      expect(screen.getByText('🗡️ My Quests')).toBeInTheDocument();
    });

    // Quest should appear in My Quests
    const myQuestsSection = screen.getByText('🗡️ My Quests').closest('section');
    expect(myQuestsSection).toHaveTextContent('Clean the Kitchen');

    // Quest should no longer be in Available Quests
    const availableQuestsSection = screen.getByText('📋 Available Quests').closest('section');
    expect(availableQuestsSection).not.toHaveTextContent('Clean the Kitchen');
  });

  test('Role-based button visibility is correctly implemented', async () => {
    console.log('✅ [Unit Test] Testing role-based quest interaction permissions');

    const { rerender } = render(<QuestDashboard onError={jest.fn()} />);

    // Test Hero role
    mockUseAuth.mockReturnValue({
      user: mockHeroUser,
      token: 'mock-token',
    });

    rerender(<QuestDashboard onError={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Clean the Kitchen')).toBeInTheDocument();
    });

    // Hero should see only pickup button
    expect(screen.getByText('Pick Up Quest')).toBeInTheDocument();
    expect(screen.queryByTestId('assign-quest-dropdown')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel Quest')).not.toBeInTheDocument();

    // Test GM role
    mockUseAuth.mockReturnValue({
      user: mockGMUser,
      token: 'mock-token',
    });

    rerender(<QuestDashboard onError={jest.fn()} />);

    // GM should see ALL interaction options
    expect(screen.getByText('Pick Up Quest')).toBeInTheDocument();
    expect(screen.getByTestId('assign-quest-dropdown')).toBeInTheDocument();
    expect(screen.getByText('Cancel Quest')).toBeInTheDocument();
  });
});