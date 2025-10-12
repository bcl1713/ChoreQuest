import React from 'react';
import { render, screen } from '@testing-library/react';
import { FantasyCard } from './FantasyCard';
import * as useReducedMotionModule from '@/hooks/useReducedMotion';

// Mock the useReducedMotion hook
jest.mock('@/hooks/useReducedMotion');

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      whileHover,
      transition,
      ...props
    }: React.PropsWithChildren<{
      whileHover?: unknown;
      transition?: unknown;
      [key: string]: unknown;
    }>) => {
      // Silence unused vars warning
      void whileHover;
      void transition;
      return <div {...props}>{children}</div>;
    },
  },
}));

describe('FantasyCard', () => {
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
    it('should render card with children', () => {
      render(
        <FantasyCard>
          <div>Card content</div>
        </FantasyCard>
      );
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should apply default border and shadow classes', () => {
      const { container } = render(<FantasyCard>Content</FantasyCard>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border', 'rounded-lg', 'shadow-lg', 'p-6');
    });
  });

  describe('Variants', () => {
    it('should apply default variant classes by default', () => {
      const { container } = render(<FantasyCard>Default</FantasyCard>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-gradient-to-br', 'from-dark-800', 'to-dark-900', 'border-dark-600');
    });

    it('should apply primary variant classes', () => {
      const { container } = render(<FantasyCard variant="primary">Primary</FantasyCard>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-gradient-to-br', 'from-primary-900', 'to-primary-950', 'border-primary-700');
    });

    it('should apply gold variant classes', () => {
      const { container } = render(<FantasyCard variant="gold">Gold</FantasyCard>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-gradient-to-br', 'from-gold-900', 'to-gold-950', 'border-gold-700');
    });

    it('should apply gem variant classes', () => {
      const { container } = render(<FantasyCard variant="gem">Gem</FantasyCard>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-gradient-to-br', 'from-gem-900', 'to-gem-950', 'border-gem-700');
    });

    it('should apply xp variant classes', () => {
      const { container } = render(<FantasyCard variant="xp">XP</FantasyCard>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-gradient-to-br', 'from-xp-900', 'to-xp-950', 'border-xp-700');
    });
  });

  describe('Glow Effects', () => {
    it('should not have glow effect by default', () => {
      const { container } = render(<FantasyCard>No glow</FantasyCard>);
      const card = container.firstChild as HTMLElement;
      expect(card).not.toHaveClass('glow-gold', 'glow-gem', 'glow-xp', 'glow-effect');
    });

    it('should apply subtle gold glow for gold variant', () => {
      const { container } = render(
        <FantasyCard variant="gold" glow="subtle">
          Gold glow
        </FantasyCard>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('glow-gold');
    });

    it('should apply subtle gem glow for gem variant', () => {
      const { container } = render(
        <FantasyCard variant="gem" glow="subtle">
          Gem glow
        </FantasyCard>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('glow-gem');
    });

    it('should apply subtle xp glow for xp variant', () => {
      const { container } = render(
        <FantasyCard variant="xp" glow="subtle">
          XP glow
        </FantasyCard>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('glow-xp');
    });

    it('should apply strong gold glow effect for gold variant', () => {
      const { container } = render(
        <FantasyCard variant="gold" glow="strong">
          Strong gold glow
        </FantasyCard>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('glow-effect-gold');
    });

    it('should apply strong gem glow effect for gem variant', () => {
      const { container } = render(
        <FantasyCard variant="gem" glow="strong">
          Strong gem glow
        </FantasyCard>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('glow-effect-gem');
    });

    it('should apply strong xp glow effect for xp variant', () => {
      const { container } = render(
        <FantasyCard variant="xp" glow="strong">
          Strong xp glow
        </FantasyCard>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('glow-effect-xp');
    });

    it('should apply default glow effect for non-themed variants with strong glow', () => {
      const { container } = render(
        <FantasyCard variant="default" glow="strong">
          Default strong glow
        </FantasyCard>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('glow-effect');
    });
  });

  describe('Hoverable', () => {
    it('should not have cursor-pointer by default', () => {
      const { container } = render(<FantasyCard>Not hoverable</FantasyCard>);
      const card = container.firstChild as HTMLElement;
      expect(card).not.toHaveClass('cursor-pointer');
    });

    it('should add cursor-pointer when hoverable is true', () => {
      const { container } = render(<FantasyCard hoverable>Hoverable</FantasyCard>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('cursor-pointer');
    });
  });

  describe('Custom ClassName', () => {
    it('should merge custom className with default classes', () => {
      const { container } = render(<FantasyCard className="custom-class">Custom</FantasyCard>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('border', 'rounded-lg', 'shadow-lg');
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through custom HTML attributes', () => {
      const { container } = render(
        <FantasyCard data-testid="custom-card" aria-label="Test card">
          Content
        </FantasyCard>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveAttribute('data-testid', 'custom-card');
      expect(card).toHaveAttribute('aria-label', 'Test card');
    });
  });

  describe('Reduced Motion', () => {
    it('should respect reduced motion preferences', () => {
      mockUseReducedMotion.mockReturnValue(true);
      const { container } = render(<FantasyCard hoverable>Reduced Motion</FantasyCard>);
      const card = container.firstChild as HTMLElement;
      // Component should render without errors when reduced motion is enabled
      expect(card).toBeInTheDocument();
    });
  });
});
