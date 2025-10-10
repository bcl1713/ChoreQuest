import React from 'react';
import { render } from '@testing-library/react';
import { FantasyIcon } from './FantasyIcon';
import { Star, Coins, Gem, Trophy } from 'lucide-react';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Star: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <svg className={className} data-testid="star-icon" {...props} />
  ),
  Coins: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <svg className={className} data-testid="coins-icon" {...props} />
  ),
  Gem: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <svg className={className} data-testid="gem-icon" {...props} />
  ),
  Trophy: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <svg className={className} data-testid="trophy-icon" {...props} />
  ),
}));

describe('FantasyIcon', () => {
  describe('Rendering', () => {
    it('should render icon', () => {
      const { getByTestId } = render(<FantasyIcon icon={Star} />);
      expect(getByTestId('star-icon')).toBeInTheDocument();
    });

    it('should render different icons', () => {
      const { getByTestId: getByTestId1 } = render(<FantasyIcon icon={Coins} />);
      expect(getByTestId1('coins-icon')).toBeInTheDocument();

      const { getByTestId: getByTestId2 } = render(<FantasyIcon icon={Gem} />);
      expect(getByTestId2('gem-icon')).toBeInTheDocument();

      const { getByTestId: getByTestId3 } = render(<FantasyIcon icon={Trophy} />);
      expect(getByTestId3('trophy-icon')).toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should apply medium size by default', () => {
      const { getByTestId } = render(<FantasyIcon icon={Star} />);
      const icon = getByTestId('star-icon');
      expect(icon).toHaveClass('h-5', 'w-5');
    });

    it('should apply xs size classes', () => {
      const { getByTestId } = render(<FantasyIcon icon={Star} size="xs" />);
      const icon = getByTestId('star-icon');
      expect(icon).toHaveClass('h-3', 'w-3');
    });

    it('should apply sm size classes', () => {
      const { getByTestId } = render(<FantasyIcon icon={Star} size="sm" />);
      const icon = getByTestId('star-icon');
      expect(icon).toHaveClass('h-4', 'w-4');
    });

    it('should apply lg size classes', () => {
      const { getByTestId } = render(<FantasyIcon icon={Star} size="lg" />);
      const icon = getByTestId('star-icon');
      expect(icon).toHaveClass('h-6', 'w-6');
    });

    it('should apply xl size classes', () => {
      const { getByTestId } = render(<FantasyIcon icon={Star} size="xl" />);
      const icon = getByTestId('star-icon');
      expect(icon).toHaveClass('h-8', 'w-8');
    });
  });

  describe('Types and Colors', () => {
    it('should apply default color by default', () => {
      const { getByTestId } = render(<FantasyIcon icon={Star} />);
      const icon = getByTestId('star-icon');
      expect(icon).toHaveClass('text-current');
    });

    it('should apply gold color for gold type', () => {
      const { getByTestId } = render(<FantasyIcon icon={Coins} type="gold" />);
      const icon = getByTestId('coins-icon');
      expect(icon).toHaveClass('text-gold-500');
    });

    it('should apply xp color for xp type', () => {
      const { getByTestId } = render(<FantasyIcon icon={Star} type="xp" />);
      const icon = getByTestId('star-icon');
      expect(icon).toHaveClass('text-xp-500');
    });

    it('should apply gem color for gem type', () => {
      const { getByTestId } = render(<FantasyIcon icon={Gem} type="gem" />);
      const icon = getByTestId('gem-icon');
      expect(icon).toHaveClass('text-gem-500');
    });
  });

  describe('Glow Effect', () => {
    it('should not have glow effect by default', () => {
      const { getByTestId } = render(<FantasyIcon icon={Star} />);
      const icon = getByTestId('star-icon');
      expect(icon).not.toHaveClass('drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]');
    });

    it('should apply gold glow when glow is enabled with gold type', () => {
      const { getByTestId } = render(<FantasyIcon icon={Coins} type="gold" glow />);
      const icon = getByTestId('coins-icon');
      expect(icon).toHaveClass('drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]');
    });

    it('should apply xp glow when glow is enabled with xp type', () => {
      const { getByTestId } = render(<FantasyIcon icon={Star} type="xp" glow />);
      const icon = getByTestId('star-icon');
      expect(icon).toHaveClass('drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]');
    });

    it('should apply gem glow when glow is enabled with gem type', () => {
      const { getByTestId } = render(<FantasyIcon icon={Gem} type="gem" glow />);
      const icon = getByTestId('gem-icon');
      expect(icon).toHaveClass('drop-shadow-[0_0_8px_rgba(14,165,233,0.6)]');
    });

    it('should apply default glow when glow is enabled with default type', () => {
      const { getByTestId } = render(<FantasyIcon icon={Star} type="default" glow />);
      const icon = getByTestId('star-icon');
      expect(icon).toHaveClass('drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]');
    });
  });

  describe('Accessibility', () => {
    it('should be hidden from screen readers by default', () => {
      const { getByTestId } = render(<FantasyIcon icon={Star} />);
      const icon = getByTestId('star-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have aria-label when provided', () => {
      const { getByTestId } = render(<FantasyIcon icon={Star} aria-label="Experience points" />);
      const icon = getByTestId('star-icon');
      expect(icon).toHaveAttribute('aria-label', 'Experience points');
    });

    it('should not be hidden when aria-label is provided', () => {
      const { getByTestId } = render(<FantasyIcon icon={Star} aria-label="Gold coins" />);
      const icon = getByTestId('star-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'false');
    });
  });

  describe('Custom ClassName', () => {
    it('should merge custom className with default classes', () => {
      const { getByTestId } = render(<FantasyIcon icon={Star} className="custom-class" />);
      const icon = getByTestId('star-icon');
      expect(icon).toHaveClass('custom-class');
      expect(icon).toHaveClass('h-5', 'w-5');
    });
  });

  describe('Combined Props', () => {
    it('should combine size, type, glow, and className', () => {
      const { getByTestId } = render(
        <FantasyIcon
          icon={Coins}
          type="gold"
          size="lg"
          glow
          className="custom-class"
          aria-label="Gold reward"
        />
      );
      const icon = getByTestId('coins-icon');
      expect(icon).toHaveClass('h-6', 'w-6'); // size lg
      expect(icon).toHaveClass('text-gold-500'); // type gold
      expect(icon).toHaveClass('drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]'); // glow
      expect(icon).toHaveClass('custom-class'); // custom
      expect(icon).toHaveAttribute('aria-label', 'Gold reward'); // aria-label
      expect(icon).toHaveAttribute('aria-hidden', 'false'); // not hidden due to label
    });
  });
});
