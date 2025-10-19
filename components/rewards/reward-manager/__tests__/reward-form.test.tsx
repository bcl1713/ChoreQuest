import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RewardForm, RewardFormData, REWARD_TYPE_ICONS, REWARD_TYPE_LABELS } from '../reward-form';
import { RewardType } from '@/lib/types/database';

describe('RewardForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnChange = jest.fn();

  const defaultFormData: RewardFormData = {
    name: '',
    description: '',
    type: 'SCREEN_TIME' as RewardType,
    cost: '',
  };

  const filledFormData: RewardFormData = {
    name: 'Extra Screen Time',
    description: '30 minutes of extra screen time',
    type: 'SCREEN_TIME' as RewardType,
    cost: '100',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constants', () => {
    it('should export REWARD_TYPE_ICONS', () => {
      expect(REWARD_TYPE_ICONS).toEqual({
        SCREEN_TIME: "📱",
        PRIVILEGE: "⭐",
        PURCHASE: "💰",
        EXPERIENCE: "🎈",
      });
    });

    it('should export REWARD_TYPE_LABELS', () => {
      expect(REWARD_TYPE_LABELS).toEqual({
        SCREEN_TIME: "Screen Time",
        PRIVILEGE: "Privilege",
        PURCHASE: "Purchase",
        EXPERIENCE: "Experience",
      });
    });
  });

  describe('Create Mode', () => {
    it('should render create mode with correct title', () => {
      render(
        <RewardForm
          mode="create"
          formData={defaultFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('⚡ Create New Reward')).toBeInTheDocument();
    });

    it('should have create-reward-modal testid in create mode', () => {
      render(
        <RewardForm
          mode="create"
          formData={defaultFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByTestId('create-reward-modal')).toBeInTheDocument();
    });

    it('should show "Create Reward" button text in create mode', () => {
      render(
        <RewardForm
          mode="create"
          formData={defaultFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('💾 Create Reward')).toBeInTheDocument();
    });

    it('should show placeholder text in create mode', () => {
      render(
        <RewardForm
          mode="create"
          formData={defaultFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByPlaceholderText('Enter reward name...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Describe the reward...')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('should render edit mode with correct title', () => {
      render(
        <RewardForm
          mode="edit"
          formData={filledFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('✏️ Edit Reward')).toBeInTheDocument();
    });

    it('should have edit-reward-modal testid in edit mode', () => {
      render(
        <RewardForm
          mode="edit"
          formData={filledFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByTestId('edit-reward-modal')).toBeInTheDocument();
    });

    it('should show "Save Changes" button text in edit mode', () => {
      render(
        <RewardForm
          mode="edit"
          formData={filledFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('💾 Save Changes')).toBeInTheDocument();
    });

    it('should not show placeholder text in edit mode', () => {
      render(
        <RewardForm
          mode="edit"
          formData={filledFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      const nameInput = screen.getByTestId('reward-name-input') as HTMLInputElement;
      expect(nameInput.placeholder).toBe('');
    });
  });

  describe('Form Fields', () => {
    it('should render all form fields', () => {
      render(
        <RewardForm
          mode="create"
          formData={defaultFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByTestId('reward-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('reward-description-input')).toBeInTheDocument();
      expect(screen.getByTestId('reward-type-select')).toBeInTheDocument();
      expect(screen.getByTestId('reward-cost-input')).toBeInTheDocument();
    });

    it('should display form data values', () => {
      render(
        <RewardForm
          mode="edit"
          formData={filledFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      const nameInput = screen.getByTestId('reward-name-input') as HTMLInputElement;
      const descInput = screen.getByTestId('reward-description-input') as HTMLTextAreaElement;
      const typeSelect = screen.getByTestId('reward-type-select') as HTMLSelectElement;
      const costInput = screen.getByTestId('reward-cost-input') as HTMLInputElement;

      expect(nameInput.value).toBe('Extra Screen Time');
      expect(descInput.value).toBe('30 minutes of extra screen time');
      expect(typeSelect.value).toBe('SCREEN_TIME');
      expect(costInput.value).toBe('100');
    });

    it('should have required attribute on all fields', () => {
      render(
        <RewardForm
          mode="create"
          formData={defaultFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByTestId('reward-name-input')).toBeRequired();
      expect(screen.getByTestId('reward-description-input')).toBeRequired();
      expect(screen.getByTestId('reward-type-select')).toBeRequired();
      expect(screen.getByTestId('reward-cost-input')).toBeRequired();
    });

    it('should have min="1" on cost input', () => {
      render(
        <RewardForm
          mode="create"
          formData={defaultFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      const costInput = screen.getByTestId('reward-cost-input') as HTMLInputElement;
      expect(costInput.min).toBe('1');
    });

    it('should render all reward type options', () => {
      render(
        <RewardForm
          mode="create"
          formData={defaultFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByRole('option', { name: 'Screen Time' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Privilege' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Purchase' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Experience' })).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onChange when name is changed', () => {
      render(
        <RewardForm
          mode="create"
          formData={defaultFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      const nameInput = screen.getByTestId('reward-name-input');
      fireEvent.change(nameInput, { target: { value: 'New Reward' } });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith('name', 'New Reward');
    });

    it('should call onChange when description is changed', () => {
      render(
        <RewardForm
          mode="create"
          formData={defaultFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      const descInput = screen.getByTestId('reward-description-input');
      fireEvent.change(descInput, { target: { value: 'New Description' } });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith('description', 'New Description');
    });

    it('should call onChange when type is changed', () => {
      render(
        <RewardForm
          mode="create"
          formData={defaultFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      const typeSelect = screen.getByTestId('reward-type-select');
      fireEvent.change(typeSelect, { target: { value: 'PRIVILEGE' } });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith('type', 'PRIVILEGE');
    });

    it('should call onChange when cost is changed', () => {
      render(
        <RewardForm
          mode="create"
          formData={defaultFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      const costInput = screen.getByTestId('reward-cost-input');
      fireEvent.change(costInput, { target: { value: '50' } });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith('cost', '50');
    });

    it('should call onSubmit when form is submitted', () => {
      const { container } = render(
        <RewardForm
          mode="create"
          formData={filledFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      const form = container.querySelector('form') as HTMLFormElement;
      fireEvent.submit(form);

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button is clicked', () => {
      render(
        <RewardForm
          mode="create"
          formData={defaultFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onSubmit when cancel is clicked', () => {
      render(
        <RewardForm
          mode="create"
          formData={defaultFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Styling and Layout', () => {
    it('should render modal overlay', () => {
      const { container } = render(
        <RewardForm
          mode="create"
          formData={defaultFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      const overlay = container.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
      expect(overlay).toBeInTheDocument();
    });

    it('should apply fantasy-card styling to modal', () => {
      const { container } = render(
        <RewardForm
          mode="create"
          formData={defaultFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      const modal = container.querySelector('.fantasy-card');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveClass('p-6', 'max-w-md', 'w-full');
    });

    it('should render labels for all fields', () => {
      render(
        <RewardForm
          mode="create"
          formData={defaultFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Reward Name')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('💰 Cost (gold)')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long reward names', () => {
      const longName = 'A'.repeat(200);
      const formData = { ...defaultFormData, name: longName };

      render(
        <RewardForm
          mode="edit"
          formData={formData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      const nameInput = screen.getByTestId('reward-name-input') as HTMLInputElement;
      expect(nameInput.value).toBe(longName);
    });

    it('should handle very long descriptions', () => {
      const longDesc = 'B'.repeat(500);
      const formData = { ...defaultFormData, description: longDesc };

      render(
        <RewardForm
          mode="edit"
          formData={formData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      const descInput = screen.getByTestId('reward-description-input') as HTMLTextAreaElement;
      expect(descInput.value).toBe(longDesc);
    });

    it('should handle zero cost value', () => {
      const formData = { ...defaultFormData, cost: '0' };

      render(
        <RewardForm
          mode="edit"
          formData={formData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      const costInput = screen.getByTestId('reward-cost-input') as HTMLInputElement;
      expect(costInput.value).toBe('0');
    });

    it('should handle very large cost values', () => {
      const formData = { ...defaultFormData, cost: '999999' };

      render(
        <RewardForm
          mode="edit"
          formData={formData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      const costInput = screen.getByTestId('reward-cost-input') as HTMLInputElement;
      expect(costInput.value).toBe('999999');
    });

    it('should handle all reward types', () => {
      const types: RewardType[] = ['SCREEN_TIME', 'PRIVILEGE', 'PURCHASE', 'EXPERIENCE'];

      types.forEach(type => {
        const formData = { ...defaultFormData, type };
        const { unmount } = render(
          <RewardForm
            mode="edit"
            formData={formData}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
            onChange={mockOnChange}
          />
        );

        const typeSelect = screen.getByTestId('reward-type-select') as HTMLSelectElement;
        expect(typeSelect.value).toBe(type);
        unmount();
      });
    });
  });

  describe('Memoization', () => {
    it('should not re-render when props have not changed', () => {
      const { rerender } = render(
        <RewardForm
          mode="create"
          formData={defaultFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      // Re-render with same props
      rerender(
        <RewardForm
          mode="create"
          formData={defaultFormData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onChange={mockOnChange}
        />
      );

      // Component should still be rendered correctly
      expect(screen.getByText('⚡ Create New Reward')).toBeInTheDocument();
    });
  });
});
