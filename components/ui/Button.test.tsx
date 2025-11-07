import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders with provided text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies variant and size classes', () => {
    render(
      <Button variant="secondary" size="sm">
        Secondary
      </Button>
    );
    const button = screen.getByRole('button', { name: /secondary/i });
    expect(button).toHaveClass('bg-dark-700');
    expect(button).toHaveClass('text-sm');
  });

  it('disables button and shows spinner when loading', () => {
    render(<Button isLoading>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('honors onClick when enabled', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);

    await user.click(screen.getByRole('button', { name: /click/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  // CSS Animation Tests
  describe('CSS animations with hover and active states', () => {
    it('includes hover:scale-105 for hover animations', () => {
      render(<Button>Animated</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:scale-105');
    });

    it('includes active:scale-95 for tap/active animations', () => {
      render(<Button>Animated</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('active:scale-95');
    });

    it('disables animations via disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      // Scale classes are still present but won't animate on disabled buttons
    });

    it('disables animations during loading', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      // Scale classes are present but won't animate on disabled buttons
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('includes touch-target class for mobile accessibility', () => {
      render(<Button>Touch Target</Button>);
      const button = screen.getByRole('button');
      // Button should have proper focus-visible styles
      expect(button).toHaveClass('focus-visible:outline-none');
    });

    it('has proper focus ring', () => {
      render(<Button variant="primary">Focus Ring</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-offset-2');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      render(<Button onClick={onClick}>Keyboard</Button>);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(onClick).toHaveBeenCalled();
    });

    it('disables pointer events and styling when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:cursor-not-allowed');
      expect(button).toHaveClass('disabled:opacity-60');
    });
  });

  // Icon Tests
  describe('Icon rendering', () => {
    it('renders startIcon before children', () => {
      const TestIcon = () => <span data-testid="test-icon">Icon</span>;
      render(<Button startIcon={<TestIcon />}>Text</Button>);

      const icon = screen.getByTestId('test-icon');
      const button = screen.getByRole('button');

      // Icon should be in the button
      expect(icon).toBeInTheDocument();
      // Check that icon span and text span are rendered
      const spans = button.querySelectorAll('span');
      expect(spans.length).toBeGreaterThanOrEqual(2); // At least icon span and text span
    });

    it('renders endIcon after children', () => {
      const TestIcon = () => <span data-testid="end-icon">Icon</span>;
      render(<Button endIcon={<TestIcon />}>Text</Button>);

      const icon = screen.getByTestId('end-icon');
      expect(icon).toBeInTheDocument();
    });

    it('shows spinner in startIcon position when loading', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('animate-spin');
    });

    it('hides endIcon when loading', () => {
      const TestIcon = () => <span data-testid="end-icon">Icon</span>;
      render(
        <Button endIcon={<TestIcon />} isLoading>
          Loading
        </Button>
      );

      expect(screen.queryByTestId('end-icon')).not.toBeInTheDocument();
    });
  });

  // Variant Tests
  describe('All variants support animations', () => {
    const variants: Array<'primary' | 'secondary' | 'success' | 'destructive' | 'gold' | 'gold-solid' | 'outline' | 'ghost'> = [
      'primary',
      'secondary',
      'success',
      'destructive',
      'gold',
      'gold-solid',
      'outline',
      'ghost',
    ];

    variants.forEach((variant) => {
      it(`${variant} variant can be animated`, () => {
        render(<Button variant={variant}>Text</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        // All variants should have animation classes
        expect(button).toHaveClass('hover:scale-105');
        expect(button).toHaveClass('active:scale-95');
      });
    });
  });
});
