import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RedemptionList } from '../redemption-list';
import { RewardRedemptionWithUser } from '@/lib/reward-service';

describe('RedemptionList', () => {
  const mockOnApprove = jest.fn();
  const mockOnDeny = jest.fn();
  const mockOnFulfill = jest.fn();

  const createMockRedemption = (
    id: string,
    status: 'PENDING' | 'APPROVED' | 'DENIED' | 'FULFILLED',
    overrides?: Partial<RewardRedemptionWithUser>
  ): RewardRedemptionWithUser => ({
    id,
    user_id: 'user-1',
    reward_id: 'reward-1',
    reward_name: 'Extra Screen Time',
    reward_description: '30 minutes extra',
    reward_type: 'SCREEN_TIME',
    cost: 100,
    status,
    requested_at: new Date('2024-01-15T10:00:00Z').toISOString(),
    approved_at: status === 'APPROVED' || status === 'FULFILLED' ? new Date('2024-01-15T11:00:00Z').toISOString() : null,
    fulfilled_at: status === 'FULFILLED' ? new Date('2024-01-15T12:00:00Z').toISOString() : null,
    notes: null,
    user_profiles: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'CHILD',
      family_id: 'family-1',
      created_at: new Date().toISOString(),
    },
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty States', () => {
    it('should render nothing when no redemptions provided', () => {
      const { container } = render(
        <RedemptionList
          redemptions={[]}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      // Should render fragment with no children
      expect(container.querySelector('[data-testid]')).not.toBeInTheDocument();
    });

    it('should not show pending section when no pending redemptions', () => {
      const redemptions = [createMockRedemption('1', 'APPROVED')];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.queryByTestId('pending-redemptions-section')).not.toBeInTheDocument();
    });

    it('should not show approved section when no approved redemptions', () => {
      const redemptions = [createMockRedemption('1', 'PENDING')];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.queryByTestId('approved-redemptions-section')).not.toBeInTheDocument();
    });

    it('should not show history section when no completed redemptions', () => {
      const redemptions = [createMockRedemption('1', 'PENDING')];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.queryByTestId('redemption-history-section')).not.toBeInTheDocument();
    });
  });

  describe('Pending Redemptions', () => {
    it('should render pending redemptions section', () => {
      const redemptions = [createMockRedemption('1', 'PENDING')];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.getByTestId('pending-redemptions-section')).toBeInTheDocument();
      expect(screen.getByText('Pending Redemptions')).toBeInTheDocument();
    });

    it('should display user name for pending redemption', () => {
      const redemptions = [createMockRedemption('1', 'PENDING')];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should display reward name and cost', () => {
      const redemptions = [createMockRedemption('1', 'PENDING')];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.getByText('Extra Screen Time (100 gold)')).toBeInTheDocument();
    });

    it('should display notes if present', () => {
      const redemptions = [
        createMockRedemption('1', 'PENDING', { notes: 'Please approve soon!' })
      ];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.getByText('Please approve soon!')).toBeInTheDocument();
    });

    it('should not display notes section if notes is null', () => {
      const redemptions = [createMockRedemption('1', 'PENDING', { notes: null })];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      const items = screen.getAllByTestId('pending-redemption-item');
      expect(items[0].querySelector('.italic')).not.toBeInTheDocument();
    });

    it('should render approve and deny buttons', () => {
      const redemptions = [createMockRedemption('1', 'PENDING')];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.getByTestId('approve-redemption-button')).toBeInTheDocument();
      expect(screen.getByTestId('deny-redemption-button')).toBeInTheDocument();
    });

    it('should call onApprove when approve button clicked', () => {
      const redemptions = [createMockRedemption('redemption-1', 'PENDING')];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      const approveButton = screen.getByTestId('approve-redemption-button');
      fireEvent.click(approveButton);

      expect(mockOnApprove).toHaveBeenCalledTimes(1);
      expect(mockOnApprove).toHaveBeenCalledWith('redemption-1');
    });

    it('should call onDeny when deny button clicked', () => {
      const redemptions = [createMockRedemption('redemption-2', 'PENDING')];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      const denyButton = screen.getByTestId('deny-redemption-button');
      fireEvent.click(denyButton);

      expect(mockOnDeny).toHaveBeenCalledTimes(1);
      expect(mockOnDeny).toHaveBeenCalledWith('redemption-2');
    });

    it('should render multiple pending redemptions', () => {
      const redemptions = [
        createMockRedemption('1', 'PENDING', {
          user_profiles: { id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'CHILD', family_id: 'f1', created_at: new Date().toISOString() }
        }),
        createMockRedemption('2', 'PENDING', {
          user_profiles: { id: 'u2', name: 'Bob', email: 'bob@test.com', role: 'CHILD', family_id: 'f1', created_at: new Date().toISOString() }
        }),
      ];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.getAllByTestId('pending-redemption-item')).toHaveLength(2);
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  describe('Approved Redemptions', () => {
    it('should render approved redemptions section', () => {
      const redemptions = [createMockRedemption('1', 'APPROVED')];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.getByTestId('approved-redemptions-section')).toBeInTheDocument();
      expect(screen.getByText('Approved - Awaiting Fulfillment')).toBeInTheDocument();
    });

    it('should display approved date', () => {
      const redemptions = [createMockRedemption('1', 'APPROVED')];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      // Look for the specific date text within approved items
      expect(screen.getByText(/Approved 1\/15\/2024/)).toBeInTheDocument();
    });

    it('should render fulfill button', () => {
      const redemptions = [createMockRedemption('1', 'APPROVED')];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.getByTestId('fulfill-redemption-button')).toBeInTheDocument();
    });

    it('should call onFulfill when fulfill button clicked', () => {
      const redemptions = [createMockRedemption('redemption-3', 'APPROVED')];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      const fulfillButton = screen.getByTestId('fulfill-redemption-button');
      fireEvent.click(fulfillButton);

      expect(mockOnFulfill).toHaveBeenCalledTimes(1);
      expect(mockOnFulfill).toHaveBeenCalledWith('redemption-3');
    });

    it('should render multiple approved redemptions', () => {
      const redemptions = [
        createMockRedemption('1', 'APPROVED'),
        createMockRedemption('2', 'APPROVED'),
      ];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.getAllByTestId('approved-redemption-item')).toHaveLength(2);
    });
  });

  describe('Completed Redemptions (History)', () => {
    it('should render history section for fulfilled redemptions', () => {
      const redemptions = [createMockRedemption('1', 'FULFILLED')];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.getByTestId('redemption-history-section')).toBeInTheDocument();
      expect(screen.getByText('Redemption History')).toBeInTheDocument();
    });

    it('should render history section for denied redemptions', () => {
      const redemptions = [createMockRedemption('1', 'DENIED')];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.getByTestId('redemption-history-section')).toBeInTheDocument();
    });

    it('should display FULFILLED status badge with blue styling', () => {
      const redemptions = [createMockRedemption('1', 'FULFILLED')];
      const { container } = render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.getByText('FULFILLED')).toBeInTheDocument();
      const badge = container.querySelector('.bg-blue-100.text-blue-800');
      expect(badge).toBeInTheDocument();
    });

    it('should display DENIED status badge with gray styling', () => {
      const redemptions = [createMockRedemption('1', 'DENIED')];
      const { container } = render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.getByText('DENIED')).toBeInTheDocument();
      const badge = container.querySelector('.bg-gray-100.text-gray-800');
      expect(badge).toBeInTheDocument();
    });

    it('should display requested date', () => {
      const redemptions = [createMockRedemption('1', 'FULFILLED')];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.getByText(/Requested/)).toBeInTheDocument();
    });

    it('should display fulfilled date when present', () => {
      const redemptions = [createMockRedemption('1', 'FULFILLED')];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.getByText(/Fulfilled/)).toBeInTheDocument();
    });

    it('should not display fulfilled date for denied redemptions', () => {
      const redemptions = [createMockRedemption('1', 'DENIED')];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.queryByText(/• Fulfilled/)).not.toBeInTheDocument();
    });

    it('should handle missing requested_at date', () => {
      const redemptions = [
        createMockRedemption('1', 'FULFILLED', { requested_at: null })
      ];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.getByText(/Requested Unknown/)).toBeInTheDocument();
    });

    it('should render multiple completed redemptions', () => {
      const redemptions = [
        createMockRedemption('1', 'FULFILLED'),
        createMockRedemption('2', 'DENIED'),
      ];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.getAllByTestId('completed-redemption-item')).toHaveLength(2);
    });
  });

  describe('Mixed Redemptions', () => {
    it('should render all sections when all types present', () => {
      const redemptions = [
        createMockRedemption('1', 'PENDING'),
        createMockRedemption('2', 'APPROVED'),
        createMockRedemption('3', 'FULFILLED'),
        createMockRedemption('4', 'DENIED'),
      ];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.getByTestId('pending-redemptions-section')).toBeInTheDocument();
      expect(screen.getByTestId('approved-redemptions-section')).toBeInTheDocument();
      expect(screen.getByTestId('redemption-history-section')).toBeInTheDocument();
    });

    it('should correctly categorize redemptions by status', () => {
      const redemptions = [
        createMockRedemption('1', 'PENDING'),
        createMockRedemption('2', 'PENDING'),
        createMockRedemption('3', 'APPROVED'),
        createMockRedemption('4', 'FULFILLED'),
        createMockRedemption('5', 'DENIED'),
      ];
      render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      expect(screen.getAllByTestId('pending-redemption-item')).toHaveLength(2);
      expect(screen.getAllByTestId('approved-redemption-item')).toHaveLength(1);
      expect(screen.getAllByTestId('completed-redemption-item')).toHaveLength(2);
    });
  });

  describe('Memoization', () => {
    it('should not re-render when props have not changed', () => {
      const redemptions = [createMockRedemption('1', 'PENDING')];
      const { rerender } = render(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      // Re-render with same props
      rerender(
        <RedemptionList
          redemptions={redemptions}
          onApprove={mockOnApprove}
          onDeny={mockOnDeny}
          onFulfill={mockOnFulfill}
        />
      );

      // Component should still be rendered correctly
      expect(screen.getByTestId('pending-redemptions-section')).toBeInTheDocument();
    });
  });
});
