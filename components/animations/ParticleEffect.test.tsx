import { render } from '@testing-library/react';
import { ParticleEffect } from './ParticleEffect';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import React from 'react';

// Mock the useReducedMotion hook
jest.mock('@/hooks/useReducedMotion');

// Mock framer-motion to avoid animation complexity in tests
jest.mock('framer-motion', () => {
  const MockMotionDiv = ({ children, style, className, ...props }: Record<string, unknown>) => (
    <div
      data-testid="motion-div"
      style={style as React.CSSProperties}
      className={className as string}
      {...props}
    >
      {children as React.ReactNode}
    </div>
  );
  MockMotionDiv.displayName = 'motion.div';

  return {
    motion: {
      div: MockMotionDiv,
    },
  };
});

describe('ParticleEffect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useReducedMotion as jest.Mock).mockReturnValue(false);
  });

  it('should render particles when active and motion is allowed', () => {
    const { container } = render(<ParticleEffect active={true} count={5} />);

    // Should render the container
    const wrapper = container.firstChild;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass('pointer-events-none', 'fixed', 'inset-0');

    // Should render motion divs for particles
    const motionDivs = container.querySelectorAll('[data-testid="motion-div"]');
    expect(motionDivs.length).toBe(5);
  });

  it('should not render when reduced motion is preferred', () => {
    (useReducedMotion as jest.Mock).mockReturnValue(true);

    const { container } = render(<ParticleEffect active={true} count={5} />);

    expect(container.firstChild).toBeNull();
  });

  it('should not render when not active', () => {
    const { container } = render(<ParticleEffect active={false} count={5} />);

    expect(container.firstChild).toBeNull();
  });

  it('should respect default particle count', () => {
    const { container } = render(<ParticleEffect active={true} />);

    // Default is 20 particles
    const motionDivs = container.querySelectorAll('[data-testid="motion-div"]');
    expect(motionDivs.length).toBe(20);
  });

  it('should limit particle count to MAX_DESKTOP', () => {
    // MAX_DESKTOP is 30, try to render 100
    const { container } = render(<ParticleEffect active={true} count={100} />);

    const motionDivs = container.querySelectorAll('[data-testid="motion-div"]');
    expect(motionDivs.length).toBe(30); // Should be limited to 30
  });

  it('should use custom colors when provided', () => {
    const customColors = ['#ff0000', '#00ff00', '#0000ff'];
    const { container } = render(
      <ParticleEffect active={true} count={3} colors={customColors} />
    );

    // Check that particles have colored backgrounds
    const particles = container.querySelectorAll(
      '[data-testid="motion-div"] > div'
    );

    particles.forEach((particle) => {
      const bgColor = (particle as HTMLElement).style.backgroundColor;
      // backgroundColor will be in rgb format, so just check it's set
      expect(bgColor).toBeTruthy();
    });
  });

  it('should apply custom className to container', () => {
    const { container } = render(
      <ParticleEffect active={true} className="custom-class" />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should have aria-hidden attribute for accessibility', () => {
    const { container } = render(<ParticleEffect active={true} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.getAttribute('aria-hidden')).toBe('true');
  });

  it('should render particles with random positions', () => {
    const { container } = render(<ParticleEffect active={true} count={5} />);

    const motionDivs = container.querySelectorAll('[data-testid="motion-div"]');

    // Check that each particle has a left position set
    motionDivs.forEach((div) => {
      const leftStyle = (div as HTMLElement).style.left;
      expect(leftStyle).toMatch(/%$/); // Should end with %
      const leftValue = parseFloat(leftStyle);
      expect(leftValue).toBeGreaterThanOrEqual(0);
      expect(leftValue).toBeLessThanOrEqual(100);
    });
  });

  it('should render particles with fixed dimensions', () => {
    const { container } = render(<ParticleEffect active={true} count={3} />);

    const motionDivs = container.querySelectorAll('[data-testid="motion-div"]');

    motionDivs.forEach((div) => {
      const element = div as HTMLElement;
      expect(element.style.width).toBe('12px');
      expect(element.style.height).toBe('12px');
    });
  });

  it('should render with default colors when none provided', () => {
    const { container } = render(<ParticleEffect active={true} count={5} />);

    const particles = container.querySelectorAll(
      '[data-testid="motion-div"] > div'
    );

    // Should have rendered particles with backgrounds
    expect(particles.length).toBe(5);
    particles.forEach((particle) => {
      const element = particle as HTMLElement;
      expect(element.style.backgroundColor).toBeTruthy();
      expect(element.className).toContain('rounded-full');
    });
  });
});
