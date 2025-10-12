import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';
import * as useReducedMotionModule from '@/hooks/useReducedMotion';

// Mock the useReducedMotion hook
jest.mock('@/hooks/useReducedMotion');

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Sword: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <svg className={className} data-testid="sword-icon" {...props} />
  ),
  Loader2: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <svg className={className} data-testid="loader-icon" {...props} />
  ),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      animate,
      transition,
      ...props
    }: React.PropsWithChildren<{
      animate?: unknown;
      transition?: unknown;
      [key: string]: unknown;
    }>) => {
      // Silence unused vars warning
      void transition;
      return (
        <div data-animation={JSON.stringify(animate)} {...props}>
          {children}
        </div>
      );
    },
  },
}));

describe('LoadingSpinner', () => {
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
    it('should render loading spinner', () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render sword icon by default', () => {
      render(<LoadingSpinner />);
      expect(screen.getByTestId('sword-icon')).toBeInTheDocument();
    });

    it('should render loader icon when variant is default', () => {
      render(<LoadingSpinner variant="default" />);
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should apply medium size by default', () => {
      render(<LoadingSpinner />);
      const icon = screen.getByTestId('sword-icon');
      expect(icon).toHaveClass('h-8', 'w-8');
    });

    it('should apply small size classes', () => {
      render(<LoadingSpinner size="sm" />);
      const icon = screen.getByTestId('sword-icon');
      expect(icon).toHaveClass('h-4', 'w-4');
    });

    it('should apply large size classes', () => {
      render(<LoadingSpinner size="lg" />);
      const icon = screen.getByTestId('sword-icon');
      expect(icon).toHaveClass('h-12', 'w-12');
    });
  });

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have default aria-label', () => {
      render(<LoadingSpinner />);
      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('aria-label', 'Loading');
    });

    it('should accept custom aria-label', () => {
      render(<LoadingSpinner aria-label="Loading quests" />);
      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('aria-label', 'Loading quests');
    });

    it('should have screen reader text', () => {
      render(<LoadingSpinner aria-label="Loading quests" />);
      expect(screen.getByText('Loading quests')).toHaveClass('sr-only');
    });

    it('should hide icon from screen readers', () => {
      render(<LoadingSpinner />);
      const icon = screen.getByTestId('sword-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Custom ClassName', () => {
    it('should merge custom className', () => {
      render(<LoadingSpinner className="custom-class" />);
      const container = screen.getByRole('status');
      expect(container).toHaveClass('custom-class');
      expect(container).toHaveClass('inline-flex');
    });
  });

  describe('Reduced Motion', () => {
    it('should use pulse animation when reduced motion is preferred', () => {
      mockUseReducedMotion.mockReturnValue(true);
      render(<LoadingSpinner />);
      const container = screen.getByRole('status');
      const motionDiv = container.querySelector('[data-animation]');
      expect(motionDiv).toBeInTheDocument();
      if (motionDiv) {
        const animation = JSON.parse(motionDiv.getAttribute('data-animation') || '{}');
        // Pulse animation uses opacity array
        expect(animation).toHaveProperty('opacity');
      }
    });

    it('should use spin animation when reduced motion is not preferred', () => {
      mockUseReducedMotion.mockReturnValue(false);
      render(<LoadingSpinner />);
      const container = screen.getByRole('status');
      const motionDiv = container.querySelector('[data-animation]');
      expect(motionDiv).toBeInTheDocument();
      if (motionDiv) {
        const animation = JSON.parse(motionDiv.getAttribute('data-animation') || '{}');
        // Spin animation uses rotate
        expect(animation).toHaveProperty('rotate');
        expect(animation.rotate).toBe(360);
      }
    });
  });

  describe('Variants', () => {
    it('should render sword variant by default', () => {
      render(<LoadingSpinner />);
      expect(screen.getByTestId('sword-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('loader-icon')).not.toBeInTheDocument();
    });

    it('should render default variant with loader icon', () => {
      render(<LoadingSpinner variant="default" />);
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('sword-icon')).not.toBeInTheDocument();
    });
  });
});
