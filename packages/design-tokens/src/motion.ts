/**
 * Motion & Animation Tokens
 *
 * For accessible, performant animations
 */

export const motion = {
  // Durations (milliseconds)
  duration: {
    instant: 0,
    faster: 50,
    fast: 100,
    base: 200,
    slow: 300,
    slower: 500,
  },

  // Easing functions (cubic-bezier)
  easing: {
    // Linear
    linear: 'cubic-bezier(0, 0, 1, 1)',

    // Ease in/out
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

    // Smooth
    smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',

    // Spring-like
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // Prefers reduced motion (accessibility)
  shouldReduceMotion: '@media (prefers-reduced-motion: reduce)',
};

/**
 * CSS Variables for Motion
 */
export const motionVariables = {
  '--motion-duration-instant': '0ms',
  '--motion-duration-faster': '50ms',
  '--motion-duration-fast': '100ms',
  '--motion-duration-base': '200ms',
  '--motion-duration-slow': '300ms',
  '--motion-duration-slower': '500ms',
  '--motion-easing-linear': motion.easing.linear,
  '--motion-easing-in': motion.easing.in,
  '--motion-easing-out': motion.easing.out,
  '--motion-easing-inOut': motion.easing.inOut,
  '--motion-easing-smooth': motion.easing.smooth,
  '--motion-easing-spring': motion.easing.spring,
} as const;
