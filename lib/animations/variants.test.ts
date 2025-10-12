import {
  fadeIn,
  slideIn,
  slideInLeft,
  scaleIn,
  bounceIn,
  staggerContainer,
  staggerItem,
  celebrationBurst,
  celebrationFloat,
  pulse,
  glow,
  modalBackdrop,
  modalContent,
} from './variants';

describe('Animation Variants', () => {
  describe('fadeIn', () => {
    it('should have hidden state with opacity 0', () => {
      expect(fadeIn.hidden).toEqual({ opacity: 0 });
    });

    it('should have visible state with opacity 1', () => {
      expect(fadeIn.visible).toMatchObject({ opacity: 1 });
    });

    it('should have reduced motion state with instant transition', () => {
      expect(fadeIn.reduced).toMatchObject({
        opacity: 1,
        transition: { duration: 0 },
      });
    });
  });

  describe('slideIn', () => {
    it('should start below with opacity 0', () => {
      expect(slideIn.hidden).toEqual({ opacity: 0, y: 20 });
    });

    it('should end at position 0 with opacity 1', () => {
      expect(slideIn.visible).toMatchObject({ opacity: 1, y: 0 });
    });

    it('should have reduced motion state', () => {
      expect(slideIn.reduced).toMatchObject({
        opacity: 1,
        y: 0,
        transition: { duration: 0 },
      });
    });
  });

  describe('slideInLeft', () => {
    it('should start from left with opacity 0', () => {
      expect(slideInLeft.hidden).toEqual({ opacity: 0, x: -20 });
    });

    it('should end at position 0 with opacity 1', () => {
      expect(slideInLeft.visible).toMatchObject({ opacity: 1, x: 0 });
    });

    it('should have reduced motion state', () => {
      expect(slideInLeft.reduced).toMatchObject({
        opacity: 1,
        x: 0,
        transition: { duration: 0 },
      });
    });
  });

  describe('scaleIn', () => {
    it('should start small with opacity 0', () => {
      expect(scaleIn.hidden).toEqual({ opacity: 0, scale: 0.8 });
    });

    it('should end at full scale with opacity 1', () => {
      expect(scaleIn.visible).toMatchObject({ opacity: 1, scale: 1 });
    });

    it('should have reduced motion state', () => {
      expect(scaleIn.reduced).toMatchObject({
        opacity: 1,
        scale: 1,
        transition: { duration: 0 },
      });
    });
  });

  describe('bounceIn', () => {
    it('should start at scale 0 with opacity 0', () => {
      expect(bounceIn.hidden).toEqual({ opacity: 0, scale: 0 });
    });

    it('should end at scale 1 with opacity 1', () => {
      expect(bounceIn.visible).toMatchObject({ opacity: 1, scale: 1 });
    });

    it('should use bounce easing', () => {
      expect(bounceIn.visible).toHaveProperty('transition');
      const transition = bounceIn.visible.transition as { ease: number[] };
      expect(transition.ease).toEqual([0.68, -0.55, 0.265, 1.55]);
    });

    it('should have reduced motion state', () => {
      expect(bounceIn.reduced).toMatchObject({
        opacity: 1,
        scale: 1,
        transition: { duration: 0 },
      });
    });
  });

  describe('staggerContainer', () => {
    it('should have staggerChildren property', () => {
      expect(staggerContainer.visible).toHaveProperty('transition');
      const transition = staggerContainer.visible.transition as { staggerChildren: number };
      expect(transition.staggerChildren).toBeGreaterThan(0);
    });

    it('should have reduced motion with no stagger', () => {
      expect(staggerContainer.reduced).toMatchObject({
        opacity: 1,
        transition: {
          staggerChildren: 0,
          delayChildren: 0,
        },
      });
    });
  });

  describe('staggerItem', () => {
    it('should have hidden state with slight y offset', () => {
      expect(staggerItem.hidden).toEqual({ opacity: 0, y: 10 });
    });

    it('should animate to visible position', () => {
      expect(staggerItem.visible).toMatchObject({ opacity: 1, y: 0 });
    });

    it('should have reduced motion state', () => {
      expect(staggerItem.reduced).toMatchObject({
        opacity: 1,
        y: 0,
        transition: { duration: 0 },
      });
    });
  });

  describe('celebrationBurst', () => {
    it('should start with scale 0 and negative rotation', () => {
      expect(celebrationBurst.hidden).toEqual({
        opacity: 0,
        scale: 0,
        rotate: -180,
      });
    });

    it('should end at full scale and no rotation', () => {
      expect(celebrationBurst.visible).toMatchObject({
        opacity: 1,
        scale: 1,
        rotate: 0,
      });
    });

    it('should use elastic easing for celebration effect', () => {
      const transition = celebrationBurst.visible.transition as { ease: number[] };
      expect(transition.ease).toEqual([0.68, -0.6, 0.32, 1.6]);
    });

    it('should have reduced motion state', () => {
      expect(celebrationBurst.reduced).toMatchObject({
        opacity: 1,
        scale: 1,
        rotate: 0,
        transition: { duration: 0 },
      });
    });
  });

  describe('celebrationFloat', () => {
    it('should start at y: 0', () => {
      expect(celebrationFloat.hidden).toEqual({ opacity: 0, y: 0 });
    });

    it('should float upward and fade out', () => {
      expect(celebrationFloat.visible).toMatchObject({
        opacity: [0, 1, 1, 0],
        y: -100,
      });
    });

    it('should have reduced motion state with no animation', () => {
      expect(celebrationFloat.reduced).toMatchObject({
        opacity: 0,
        y: 0,
        transition: { duration: 0 },
      });
    });
  });

  describe('pulse', () => {
    it('should start at scale 1', () => {
      expect(pulse.hidden).toEqual({ scale: 1 });
    });

    it('should pulse between scales', () => {
      expect(pulse.visible).toHaveProperty('scale');
      expect(pulse.visible.scale).toEqual([1, 1.05, 1]);
    });

    it('should repeat infinitely', () => {
      const transition = pulse.visible.transition as { repeat: number };
      expect(transition.repeat).toBe(Infinity);
    });

    it('should have reduced motion state with no pulse', () => {
      expect(pulse.reduced).toMatchObject({
        scale: 1,
        transition: { duration: 0 },
      });
    });
  });

  describe('glow', () => {
    it('should pulse opacity', () => {
      expect(glow.visible).toHaveProperty('opacity');
      expect(glow.visible.opacity).toEqual([0.5, 1, 0.5]);
    });

    it('should repeat infinitely', () => {
      const transition = glow.visible.transition as { repeat: number };
      expect(transition.repeat).toBe(Infinity);
    });

    it('should have reduced motion state with static opacity', () => {
      expect(glow.reduced).toMatchObject({
        opacity: 1,
        transition: { duration: 0 },
      });
    });
  });

  describe('modalBackdrop', () => {
    it('should fade in from opacity 0', () => {
      expect(modalBackdrop.hidden).toEqual({ opacity: 0 });
    });

    it('should end at opacity 1', () => {
      expect(modalBackdrop.visible).toMatchObject({ opacity: 1 });
    });

    it('should have reduced motion state', () => {
      expect(modalBackdrop.reduced).toMatchObject({
        opacity: 1,
        transition: { duration: 0 },
      });
    });
  });

  describe('modalContent', () => {
    it('should start small and below position', () => {
      expect(modalContent.hidden).toEqual({
        opacity: 0,
        scale: 0.95,
        y: 20,
      });
    });

    it('should animate to full size and position', () => {
      expect(modalContent.visible).toMatchObject({
        opacity: 1,
        scale: 1,
        y: 0,
      });
    });

    it('should have reduced motion state', () => {
      expect(modalContent.reduced).toMatchObject({
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0 },
      });
    });
  });

  // Test that all variants have the required states
  describe('Variant structure validation', () => {
    const allVariants = [
      { name: 'fadeIn', variant: fadeIn },
      { name: 'slideIn', variant: slideIn },
      { name: 'slideInLeft', variant: slideInLeft },
      { name: 'scaleIn', variant: scaleIn },
      { name: 'bounceIn', variant: bounceIn },
      { name: 'staggerContainer', variant: staggerContainer },
      { name: 'staggerItem', variant: staggerItem },
      { name: 'celebrationBurst', variant: celebrationBurst },
      { name: 'celebrationFloat', variant: celebrationFloat },
      { name: 'pulse', variant: pulse },
      { name: 'glow', variant: glow },
      { name: 'modalBackdrop', variant: modalBackdrop },
      { name: 'modalContent', variant: modalContent },
    ];

    const variantsWithDuration = allVariants.filter(v => v.name !== 'staggerContainer');
    const containerVariants = allVariants.filter(v => v.name === 'staggerContainer');

    allVariants.forEach(({ name, variant }) => {
      it(`${name} should have hidden state`, () => {
        expect(variant).toHaveProperty('hidden');
      });

      it(`${name} should have visible state`, () => {
        expect(variant).toHaveProperty('visible');
      });

      it(`${name} should have reduced motion state`, () => {
        expect(variant).toHaveProperty('reduced');
      });
    });

    variantsWithDuration.forEach(({ name, variant }) => {
      it(`${name} reduced state should have instant transition`, () => {
        expect(variant.reduced).toHaveProperty('transition');
        const transition = variant.reduced.transition as { duration: number };
        expect(transition.duration).toBe(0);
      });
    });

    containerVariants.forEach(({ name, variant }) => {
      it(`${name} reduced state should have no stagger`, () => {
        expect(variant.reduced).toHaveProperty('transition');
        const transition = variant.reduced.transition as { staggerChildren: number; delayChildren: number };
        expect(transition.staggerChildren).toBe(0);
        expect(transition.delayChildren).toBe(0);
      });
    });
  });
});
