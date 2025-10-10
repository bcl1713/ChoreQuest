import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FantasyButton } from './FantasyButton';
import * as useReducedMotionModule from '@/hooks/useReducedMotion';

// Mock the useReducedMotion hook
jest.mock('@/hooks/useReducedMotion');

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      whileHover,
      whileTap,
      transition,
      ...props
    }: React.PropsWithChildren<{
      whileHover?: unknown;
      whileTap?: unknown;
      transition?: unknown;
      [key: string]: unknown;
    }>) => {
      // Silence unused vars warning
      void whileHover;
      void whileTap;
      void transition;
      return <button {...props}>{children}</button>;
    },
  },
}));

describe('FantasyButton', () => {
  const mockUseReducedMotion = useReducedMotionModule.useReducedMotion as jest.MockedFunction<
    typeof useReducedMotionModule.useReducedMotion
  >;

  beforeEach(() => {
    mockUseReducedMotion.mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render button with children', () => {
      render(<FantasyButton>Click me</FantasyButton>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should render with icon', () => {
      const icon = <span data-testid="test-icon">⚔️</span>;
      render(<FantasyButton icon={icon}>Attack</FantasyButton>);
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByText('Attack')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should apply primary variant classes by default', () => {
      render(<FantasyButton>Primary</FantasyButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('fantasy-button-primary');
    });

    it('should apply secondary variant classes', () => {
      render(<FantasyButton variant="secondary">Secondary</FantasyButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('fantasy-button-secondary');
    });

    it('should apply danger variant classes', () => {
      render(<FantasyButton variant="danger">Danger</FantasyButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('fantasy-button-danger');
    });

    it('should apply success variant classes', () => {
      render(<FantasyButton variant="success">Success</FantasyButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('fantasy-button-success');
    });
  });

  describe('Sizes', () => {
    it('should apply medium size by default', () => {
      render(<FantasyButton>Medium</FantasyButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('py-3', 'px-6', 'text-base');
    });

    it('should apply small size classes', () => {
      render(<FantasyButton size="sm">Small</FantasyButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('py-2', 'px-4', 'text-sm');
    });

    it('should apply large size classes', () => {
      render(<FantasyButton size="lg">Large</FantasyButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('py-4', 'px-8', 'text-lg');
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(<FantasyButton isLoading>Loading</FantasyButton>);
      const button = screen.getByRole('button');
      const spinner = button.querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('should disable button when isLoading is true', () => {
      render(<FantasyButton isLoading>Loading</FantasyButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should add cursor-wait class when loading', () => {
      render(<FantasyButton isLoading>Loading</FantasyButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('cursor-wait');
    });

    it('should not show icon when loading', () => {
      const icon = <span data-testid="test-icon">⚔️</span>;
      render(
        <FantasyButton icon={icon} isLoading>
          Loading
        </FantasyButton>
      );
      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable button when disabled prop is true', () => {
      render(<FantasyButton disabled>Disabled</FantasyButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should disable button when both disabled and isLoading are true', () => {
      render(
        <FantasyButton disabled isLoading>
          Disabled Loading
        </FantasyButton>
      );
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Click Handler', () => {
    it('should call onClick handler when clicked', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      render(<FantasyButton onClick={handleClick}>Click me</FantasyButton>);
      const button = screen.getByRole('button');
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      render(
        <FantasyButton onClick={handleClick} disabled>
          Disabled
        </FantasyButton>
      );
      const button = screen.getByRole('button');
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      render(
        <FantasyButton onClick={handleClick} isLoading>
          Loading
        </FantasyButton>
      );
      const button = screen.getByRole('button');
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Custom ClassName', () => {
    it('should merge custom className with default classes', () => {
      render(<FantasyButton className="custom-class">Custom</FantasyButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('fantasy-button-primary');
    });
  });

  describe('Accessibility', () => {
    it('should have touch-target class for mobile accessibility', () => {
      render(<FantasyButton>Accessible</FantasyButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('touch-target');
    });

    it('should hide spinner from screen readers', () => {
      render(<FantasyButton isLoading>Loading</FantasyButton>);
      const button = screen.getByRole('button');
      const spinner = button.querySelector('svg');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Reduced Motion', () => {
    it('should respect reduced motion preferences', () => {
      mockUseReducedMotion.mockReturnValue(true);
      render(<FantasyButton>Reduced Motion</FantasyButton>);
      // Component should render without errors when reduced motion is enabled
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
