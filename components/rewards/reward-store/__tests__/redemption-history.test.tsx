import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RedemptionHistory from '../redemption-history';
import { RewardRedemption, UserProfile } from '@/lib/types/database';

interface RewardRedemptionWithDetails extends RewardRedemption {
  user_profiles: UserProfile;
  reward_name: string;
  reward_description: string;
  reward_type: 'SCREEN_TIME' | 'PRIVILEGE' | 'PURCHASE' | 'EXPERIENCE';
}

const mockUser: UserProfile = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'ADVENTURER',
  family_id: 'family-1',
  created_at: '2024-01-01T00:00:00Z',
  onboarding_completed: true,
};

const mockRedemptions: RewardRedemptionWithDetails[] = [
  {
    id: 'redemption-1',
    user_id: 'user-1',
    reward_id: 'reward-1',
    cost: 50,
    status: 'PENDING',
    requested_at: '2024-01-15T10:00:00Z',
    approved_at: null,
    approved_by: null,
    fulfilled_at: null,
    notes: null,
    user_profiles: mockUser,
    reward_name: 'Extra Screen Time',
    reward_description: '30 minutes extra',
    reward_type: 'SCREEN_TIME',
  },
  {
    id: 'redemption-2',
    user_id: 'user-1',
    reward_id: 'reward-2',
    cost: 75,
    status: 'APPROVED',
    requested_at: '2024-01-14T10:00:00Z',
    approved_at: '2024-01-14T11:00:00Z',
    approved_by: 'gm-1',
    fulfilled_at: null,
    notes: 'Please approve!',
    user_profiles: mockUser,
    reward_name: 'Choose Dinner',
    reward_description: 'Pick dinner menu',
    reward_type: 'PRIVILEGE',
  },
  {
    id: 'redemption-3',
    user_id: 'user-1',
    reward_id: 'reward-3',
    cost: 100,
    status: 'FULFILLED',
    requested_at: '2024-01-13T10:00:00Z',
    approved_at: '2024-01-13T11:00:00Z',
    approved_by: 'gm-1',
    fulfilled_at: '2024-01-13T12:00:00Z',
    notes: null,
    user_profiles: mockUser,
    reward_name: 'Toy Purchase',
    reward_description: '$10 toy',
    reward_type: 'PURCHASE',
  },
  {
    id: 'redemption-4',
    user_id: 'user-1',
    reward_id: 'reward-4',
    cost: 25,
    status: 'DENIED',
    requested_at: '2024-01-12T10:00:00Z',
    approved_at: null,
    approved_by: null,
    fulfilled_at: null,
    notes: null,
    user_profiles: mockUser,
    reward_name: 'Special Outing',
    reward_description: 'Zoo trip',
    reward_type: 'EXPERIENCE',
  },
];

describe('RedemptionHistory', () => {
  const mockOnApprove = jest.fn();
  const mockOnDeny = jest.fn();
  const mockOnFulfill = jest.fn();

  beforeEach(() => {
    mockOnApprove.mockClear();
    mockOnDeny.mockClear();
    mockOnFulfill.mockClear();
  });

  describe('Rendering', () => {
    it('renders section title', () => {
      render(
        <RedemptionHistory
          redemptions={mockRedemptions}
          isGuildMaster={false}
        />
      );

      expect(screen.getByText('Recent Redemptions')).toBeInTheDocument();
    });

    it('displays redemption name and cost', () => {
      render(
        <RedemptionHistory
          redemptions={mockRedemptions}
          isGuildMaster={false}
        />
      );

      expect(screen.getByText('Extra Screen Time')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('displays user name and request date', () => {
      render(
        <RedemptionHistory
          redemptions={mockRedemptions}
          isGuildMaster={false}
        />
      );

      expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
      expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
    });

    it('displays notes when present', () => {
      render(
        <RedemptionHistory
          redemptions={mockRedemptions}
          isGuildMaster={false}
        />
      );

      expect(screen.getByText('Please approve!')).toBeInTheDocument();
    });

    it('does not display notes section when notes are null', () => {
      const redemptionsWithoutNotes = [mockRedemptions[0]];
      render(
        <RedemptionHistory
          redemptions={redemptionsWithoutNotes}
          isGuildMaster={false}
        />
      );

      expect(screen.queryByText(/Notes:/)).not.toBeInTheDocument();
    });

    it('renders correct icons for different reward types', () => {
      render(
        <RedemptionHistory
          redemptions={mockRedemptions}
          isGuildMaster={false}
        />
      );

      expect(screen.getByLabelText('SCREEN_TIME reward type')).toBeInTheDocument(); // SCREEN_TIME
      expect(screen.getByLabelText('PRIVILEGE reward type')).toBeInTheDocument(); // PRIVILEGE
      expect(screen.getByLabelText('PURCHASE reward type')).toBeInTheDocument(); // PURCHASE
      expect(screen.getByLabelText('EXPERIENCE reward type')).toBeInTheDocument(); // EXPERIENCE
    });
  });

  describe('Status Display', () => {
    it('displays PENDING status with correct styling', () => {
      const pendingOnly = [mockRedemptions[0]];
      render(
        <RedemptionHistory
          redemptions={pendingOnly}
          isGuildMaster={false}
        />
      );

      const status = screen.getByText('pending');
      expect(status).toBeInTheDocument();
      expect(status).toHaveClass('bg-yellow-900/30', 'text-yellow-300');
    });

    it('displays APPROVED status with correct styling', () => {
      const approvedOnly = [mockRedemptions[1]];
      render(
        <RedemptionHistory
          redemptions={approvedOnly}
          isGuildMaster={false}
        />
      );

      const status = screen.getByText('approved');
      expect(status).toBeInTheDocument();
      expect(status).toHaveClass('bg-green-900/30', 'text-green-300');
    });

    it('displays FULFILLED status with correct styling', () => {
      const fulfilledOnly = [mockRedemptions[2]];
      render(
        <RedemptionHistory
          redemptions={fulfilledOnly}
          isGuildMaster={false}
        />
      );

      const status = screen.getByText('fulfilled');
      expect(status).toBeInTheDocument();
      expect(status).toHaveClass('bg-blue-900/30', 'text-blue-300');
    });

    it('displays DENIED status with correct styling', () => {
      const deniedOnly = [mockRedemptions[3]];
      render(
        <RedemptionHistory
          redemptions={deniedOnly}
          isGuildMaster={false}
        />
      );

      const status = screen.getByText('denied');
      expect(status).toBeInTheDocument();
      expect(status).toHaveClass('bg-red-900/30', 'text-red-300');
    });
  });

  describe('Empty State', () => {
    it('displays empty state when no redemptions', () => {
      render(
        <RedemptionHistory
          redemptions={[]}
          isGuildMaster={false}
        />
      );

      expect(screen.getByText('No redemption history yet.')).toBeInTheDocument();
      expect(screen.getByText('Your reward requests will appear here.')).toBeInTheDocument();
    });

    it('does not render redemption items when empty', () => {
      render(
        <RedemptionHistory
          redemptions={[]}
          isGuildMaster={false}
        />
      );

      expect(screen.queryByTestId(/^redemption-/)).not.toBeInTheDocument();
    });
  });

  describe('Limit Display', () => {
    it('displays only first 5 redemptions', () => {
      const manyRedemptions = [
        ...mockRedemptions,
        { ...mockRedemptions[0], id: 'redemption-5' },
        { ...mockRedemptions[0], id: 'redemption-6' },
      ];

      render(
        <RedemptionHistory
          redemptions={manyRedemptions}
          isGuildMaster={false}
        />
      );

      expect(screen.getByTestId('redemption-redemption-1')).toBeInTheDocument();
      expect(screen.getByTestId('redemption-redemption-2')).toBeInTheDocument();
      expect(screen.getByTestId('redemption-redemption-3')).toBeInTheDocument();
      expect(screen.getByTestId('redemption-redemption-4')).toBeInTheDocument();
      expect(screen.getByTestId('redemption-redemption-5')).toBeInTheDocument();
      expect(screen.queryByTestId('redemption-redemption-6')).not.toBeInTheDocument();
    });
  });

  describe('Guild Master Actions', () => {
    it('shows approve/deny buttons for pending redemptions when guild master', () => {
      const pendingOnly = [mockRedemptions[0]];
      render(
        <RedemptionHistory
          redemptions={pendingOnly}
          isGuildMaster={true}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.getByTestId('approve-redemption-1')).toBeInTheDocument();
      expect(screen.getByTestId('deny-redemption-1')).toBeInTheDocument();
    });

    it('does not show approve/deny buttons when not guild master', () => {
      const pendingOnly = [mockRedemptions[0]];
      render(
        <RedemptionHistory
          redemptions={pendingOnly}
          isGuildMaster={false}
        />
      );

      expect(screen.queryByTestId('approve-redemption-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('deny-redemption-1')).not.toBeInTheDocument();
    });

    it('shows fulfill button for approved redemptions when guild master', () => {
      const approvedOnly = [mockRedemptions[1]];
      render(
        <RedemptionHistory
          redemptions={approvedOnly}
          isGuildMaster={true}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.getByTestId('fulfill-redemption-2')).toBeInTheDocument();
    });

    it('does not show fulfill button when not guild master', () => {
      const approvedOnly = [mockRedemptions[1]];
      render(
        <RedemptionHistory
          redemptions={approvedOnly}
          isGuildMaster={false}
        />
      );

      expect(screen.queryByTestId('fulfill-redemption-2')).not.toBeInTheDocument();
    });

    it('does not show any action buttons for fulfilled redemptions', () => {
      const fulfilledOnly = [mockRedemptions[2]];
      render(
        <RedemptionHistory
          redemptions={fulfilledOnly}
          isGuildMaster={true}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.queryByTestId('approve-redemption-3')).not.toBeInTheDocument();
      expect(screen.queryByTestId('deny-redemption-3')).not.toBeInTheDocument();
      expect(screen.queryByTestId('fulfill-redemption-3')).not.toBeInTheDocument();
    });

    it('calls onApprove when approve button clicked', () => {
      const pendingOnly = [mockRedemptions[0]];
      render(
        <RedemptionHistory
          redemptions={pendingOnly}
          isGuildMaster={true}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      fireEvent.click(screen.getByTestId('approve-redemption-1'));
      expect(mockOnApprove).toHaveBeenCalledWith('redemption-1');
      expect(mockOnApprove).toHaveBeenCalledTimes(1);
    });

    it('calls onDeny when deny button clicked', () => {
      const pendingOnly = [mockRedemptions[0]];
      render(
        <RedemptionHistory
          redemptions={pendingOnly}
          isGuildMaster={true}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      fireEvent.click(screen.getByTestId('deny-redemption-1'));
      expect(mockOnDeny).toHaveBeenCalledWith('redemption-1');
      expect(mockOnDeny).toHaveBeenCalledTimes(1);
    });

    it('calls onFulfill when fulfill button clicked', () => {
      const approvedOnly = [mockRedemptions[1]];
      render(
        <RedemptionHistory
          redemptions={approvedOnly}
          isGuildMaster={true}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      fireEvent.click(screen.getByTestId('fulfill-redemption-2'));
      expect(mockOnFulfill).toHaveBeenCalledWith('redemption-2');
      expect(mockOnFulfill).toHaveBeenCalledTimes(1);
    });
  });
});
