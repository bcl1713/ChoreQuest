import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RewardCard from '../reward-card';
import { Reward } from '@/lib/types/database';

const mockReward: Reward = {
  id: 'reward-1',
  family_id: 'family-1',
  name: 'Extra Screen Time',
  description: '30 minutes of extra screen time',
  type: 'SCREEN_TIME',
  cost: 50,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  created_by: 'user-1',
};

describe('RewardCard', () => {
  const mockOnRedeem = jest.fn();

  beforeEach(() => {
    mockOnRedeem.mockClear();
  });

  describe('Rendering', () => {
    it('renders reward name and description', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />
      );

      expect(screen.getByText('Extra Screen Time')).toBeInTheDocument();
      expect(screen.getByText('30 minutes of extra screen time')).toBeInTheDocument();
    });

    it('renders correct icon for SCREEN_TIME type', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />
      );

      // Icon is rendered as SVG from Lucide React
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
      expect(screen.getByText('Screen Time')).toBeInTheDocument();
    });

    it('renders correct icon for PRIVILEGE type', () => {
      const privilegeReward: Reward = { ...mockReward, type: 'PRIVILEGE' };
      render(
        <RewardCard
          reward={privilegeReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />
      );

      // Icon is rendered as SVG from Lucide React
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
      expect(screen.getByText('Privilege')).toBeInTheDocument();
    });

    it('renders correct icon for PURCHASE type', () => {
      const purchaseReward: Reward = { ...mockReward, type: 'PURCHASE' };
      render(
        <RewardCard
          reward={purchaseReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />
      );

      // Icon is rendered as SVG from Lucide React
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
      expect(screen.getByText('Purchase')).toBeInTheDocument();
    });

    it('renders correct icon for EXPERIENCE type', () => {
      const experienceReward: Reward = { ...mockReward, type: 'EXPERIENCE' };
      render(
        <RewardCard
          reward={experienceReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />
      );

      // Icon is rendered as SVG from Lucide React
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
      expect(screen.getByText('Experience')).toBeInTheDocument();
    });

    it('displays reward cost', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />
      );

      expect(screen.getByText('50 gold')).toBeInTheDocument();
    });

    it('has correct test id', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />
      );

      expect(screen.getByTestId('reward-store-card-reward-1')).toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('shows "Redeem Reward" when user can afford and no redemption status', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />
      );

      expect(screen.getByTestId('reward-store-redeem-button')).toHaveTextContent('Redeem Reward');
      expect(screen.getByTestId('reward-store-redeem-button')).not.toBeDisabled();
    });

    it('shows "Insufficient Gold" when user cannot afford', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={false}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />
      );

      expect(screen.getByTestId('reward-store-redeem-button')).toHaveTextContent('Insufficient Gold');
      expect(screen.getByTestId('reward-store-redeem-button')).toBeDisabled();
    });

    it('shows "Request Pending" with PENDING status', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus="PENDING"
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />
      );

      expect(screen.getByTestId('reward-store-redeem-button')).toHaveTextContent('Request Pending');
      expect(screen.getByTestId('reward-store-redeem-button')).toBeDisabled();
    });

    it('shows "Approved" with APPROVED status', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus="APPROVED"
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />
      );

      expect(screen.getByTestId('reward-store-redeem-button')).toHaveTextContent('Approved');
      expect(screen.getByTestId('reward-store-redeem-button')).toBeDisabled();
    });

    it('shows "Redeeming..." spinner when redeeming', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={true}
          onRedeem={mockOnRedeem}
        />
      );

      expect(screen.getByText('Redeeming...')).toBeInTheDocument();
      expect(screen.getByTestId('reward-store-redeem-button')).toBeDisabled();
    });
  });

  describe('Status Badge', () => {
    it('shows PENDING badge when status is PENDING', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus="PENDING"
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />
      );

      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('shows APPROVED badge when status is APPROVED', () => {
      const { container } = render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus="APPROVED"
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />
      );

      // Check for the badge span with green styling (specific to APPROVED status)
      const badge = container.querySelector('.bg-green-900\\/30');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Approved');
    });

    it('does not show badge when no redemption status', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />
      );

      expect(screen.queryByText('Pending')).not.toBeInTheDocument();
      expect(screen.queryByText('Approved')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onRedeem when button clicked and can afford', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />
      );

      fireEvent.click(screen.getByTestId('reward-store-redeem-button'));
      expect(mockOnRedeem).toHaveBeenCalledTimes(1);
      expect(mockOnRedeem).toHaveBeenCalledWith(mockReward);
    });

    it('does not call onRedeem when cannot afford', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={false}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />
      );

      fireEvent.click(screen.getByTestId('reward-store-redeem-button'));
      expect(mockOnRedeem).not.toHaveBeenCalled();
    });

    it('does not call onRedeem when redemption is pending', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus="PENDING"
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />
      );

      fireEvent.click(screen.getByTestId('reward-store-redeem-button'));
      expect(mockOnRedeem).not.toHaveBeenCalled();
    });

    it('does not call onRedeem when currently redeeming', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={true}
          onRedeem={mockOnRedeem}
        />
      );

      fireEvent.click(screen.getByTestId('reward-store-redeem-button'));
      expect(mockOnRedeem).not.toHaveBeenCalled();
    });
  });

  describe('Styling', () => {
    it('applies opacity when cannot afford and no redemption', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={false}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />
      );

      const card = screen.getByTestId('reward-store-card-reward-1');
      expect(card).toHaveClass('opacity-60');
    });

    it('does not apply opacity when can afford', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={true}
          redemptionStatus={null}
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />
      );

      const card = screen.getByTestId('reward-store-card-reward-1');
      expect(card).not.toHaveClass('opacity-60');
    });

    it('does not apply opacity when cannot afford but has redemption status', () => {
      render(
        <RewardCard
          reward={mockReward}
          canAfford={false}
          redemptionStatus="PENDING"
          isRedeeming={false}
          onRedeem={mockOnRedeem}
        />
      );

      const card = screen.getByTestId('reward-store-card-reward-1');
      expect(card).not.toHaveClass('opacity-60');
    });
  });
});
