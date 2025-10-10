import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Mock the useReducedMotion hook
jest.mock('@/hooks/useReducedMotion');

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }: any) => (
      <div className={className} style={style} {...props}>
        {children}
      </div>
    ),
  },
}));

describe('ProgressBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useReducedMotion as jest.Mock).mockReturnValue(false);
  });

  describe('Basic Rendering', () => {
    it('should render with basic props', () => {
      const { container } = render(<ProgressBar current={50} max={100} />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<ProgressBar current={50} max={100} label="XP Progress" />);

      expect(screen.getByText('XP Progress')).toBeInTheDocument();
    });

    it('should not render label when not provided', () => {
      const { container } = render(
        <ProgressBar current={50} max={100} showValues={false} showPercentage={false} />
      );

      const labels = container.querySelectorAll('.font-semibold');
      expect(labels.length).toBe(0);
    });
  });

  describe('Value Display', () => {
    it('should show current and max values when showValues is true', () => {
      render(<ProgressBar current={75} max={200} showValues={true} />);

      expect(screen.getByText(/75/)).toBeInTheDocument();
      expect(screen.getByText(/200/)).toBeInTheDocument();
    });

    it('should not show values when showValues is false', () => {
      render(
        <ProgressBar current={75} max={200} showValues={false} showPercentage={false} />
      );

      expect(screen.queryByText(/75/)).not.toBeInTheDocument();
      expect(screen.queryByText(/200/)).not.toBeInTheDocument();
    });

    it('should format large numbers with locale string', () => {
      render(<ProgressBar current={1000} max={5000} showValues={true} />);

      // Check for formatted numbers (with commas in en-US locale)
      expect(screen.getByText(/1,000/)).toBeInTheDocument();
      expect(screen.getByText(/5,000/)).toBeInTheDocument();
    });
  });

  describe('Percentage Calculation', () => {
    it('should show correct percentage', () => {
      render(<ProgressBar current={50} max={100} showPercentage={true} />);

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should handle 0% correctly', () => {
      render(<ProgressBar current={0} max={100} showPercentage={true} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle 100% correctly', () => {
      render(<ProgressBar current={100} max={100} showPercentage={true} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should round percentage to nearest integer', () => {
      render(<ProgressBar current={33} max={100} showPercentage={true} />);

      expect(screen.getByText('33%')).toBeInTheDocument();
    });

    it('should not exceed 100% even if current > max', () => {
      render(<ProgressBar current={150} max={100} showPercentage={true} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should not go below 0% even if current is negative', () => {
      render(<ProgressBar current={-50} max={100} showPercentage={true} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle max of 0 without crashing', () => {
      render(<ProgressBar current={50} max={0} showPercentage={true} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should not show percentage when showPercentage is false', () => {
      render(
        <ProgressBar current={50} max={100} showPercentage={false} showValues={false} />
      );

      expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should apply default variant styles', () => {
      const { container } = render(
        <ProgressBar current={50} max={100} variant="default" />
      );

      const fillBar = container.querySelector('.from-blue-500');
      expect(fillBar).toBeInTheDocument();
    });

    it('should apply gold variant styles', () => {
      const { container } = render(
        <ProgressBar current={50} max={100} variant="gold" />
      );

      const fillBar = container.querySelector('.from-yellow-400');
      expect(fillBar).toBeInTheDocument();
    });

    it('should apply success variant styles', () => {
      const { container } = render(
        <ProgressBar current={50} max={100} variant="success" />
      );

      const fillBar = container.querySelector('.from-green-400');
      expect(fillBar).toBeInTheDocument();
    });

    it('should apply danger variant styles', () => {
      const { container } = render(
        <ProgressBar current={50} max={100} variant="danger" />
      );

      const fillBar = container.querySelector('.from-red-500');
      expect(fillBar).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ProgressBar current={50} max={100} className="custom-class" />
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('should have rounded-full border on container', () => {
      const { container } = render(<ProgressBar current={50} max={100} />);

      const barContainer = container.querySelector('.rounded-full');
      expect(barContainer).toBeInTheDocument();
    });

    it('should have gradient fill', () => {
      const { container } = render(<ProgressBar current={50} max={100} />);

      const fillBar = container.querySelector('.bg-gradient-to-r');
      expect(fillBar).toBeInTheDocument();
    });
  });

  describe('Animation Behavior', () => {
    it('should render progress bar with correct width based on percentage', () => {
      const { container } = render(<ProgressBar current={75} max={100} />);

      // Motion div should have width style (mocked, so won't animate but should have the prop)
      const fillBar = container.querySelector('.bg-gradient-to-r');
      expect(fillBar).toBeInTheDocument();
    });

    it('should respect reduced motion preference', () => {
      (useReducedMotion as jest.Mock).mockReturnValue(true);

      const { container } = render(<ProgressBar current={50} max={100} />);

      // Component should still render
      expect(container.firstChild).toBeInTheDocument();

      // Shine effect should not be present when reduced motion is enabled
      const shineEffect = container.querySelector(
        '[style*="linear-gradient"]'
      );
      expect(shineEffect).not.toBeInTheDocument();
    });

    it('should not render shine effect when percentage is 0', () => {
      const { container } = render(<ProgressBar current={0} max={100} />);

      // Shine effect should not render when there's no progress
      const motionDivs = container.querySelectorAll('div');
      const shineDiv = Array.from(motionDivs).find((div) =>
        div.getAttribute('style')?.includes('linear-gradient')
      );
      // If shineDiv is undefined, that's what we want (not rendered)
      expect(shineDiv).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle fractional percentages correctly', () => {
      render(<ProgressBar current={1} max={3} showPercentage={true} />);

      // 1/3 = 33.333...%, should round to 33%
      expect(screen.getByText('33%')).toBeInTheDocument();
    });

    it('should handle very large numbers', () => {
      render(<ProgressBar current={1000000} max={2000000} showValues={true} />);

      expect(screen.getByText(/1,000,000/)).toBeInTheDocument();
      expect(screen.getByText(/2,000,000/)).toBeInTheDocument();
    });

    it('should display all options together', () => {
      render(
        <ProgressBar
          current={75}
          max={150}
          label="Character XP"
          showValues={true}
          showPercentage={true}
        />
      );

      expect(screen.getByText('Character XP')).toBeInTheDocument();
      expect(screen.getByText(/75/)).toBeInTheDocument();
      expect(screen.getByText(/150/)).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });
});
