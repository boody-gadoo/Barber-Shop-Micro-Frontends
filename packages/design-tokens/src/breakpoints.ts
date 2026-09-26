/**
 * Responsive Breakpoints
 *
 * Mobile-first approach
 */

export const breakpoints = {
  xs: 320,    // Extra small (mobile)
  sm: 640,    // Small (landscape mobile)
  md: 768,    // Medium (tablet)
  lg: 1024,   // Large (desktop)
  xl: 1280,   // Extra large (wide desktop)
  '2xl': 1536, // 2x large (very wide)
} as const;

/**
 * Media Query Helpers
 */
export const mediaQueries = {
  xs: `(min-width: ${breakpoints.xs}px)`,
  sm: `(min-width: ${breakpoints.sm}px)`,
  md: `(min-width: ${breakpoints.md}px)`,
  lg: `(min-width: ${breakpoints.lg}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,
  '2xl': `(min-width: ${breakpoints['2xl']}px)`,
  // Dark mode (for future)
  dark: '(prefers-color-scheme: dark)',
  light: '(prefers-color-scheme: light)',
  // Motion preference
  reducedMotion: '(prefers-reduced-motion: reduce)',
  // RTL support
  rtl: '[dir="rtl"]',
  ltr: '[dir="ltr"]',
} as const;

/**
 * CSS Variables for Breakpoints
 */
export const breakpointVariables = {
  '--breakpoint-xs': `${breakpoints.xs}px`,
  '--breakpoint-sm': `${breakpoints.sm}px`,
  '--breakpoint-md': `${breakpoints.md}px`,
  '--breakpoint-lg': `${breakpoints.lg}px`,
  '--breakpoint-xl': `${breakpoints.xl}px`,
  '--breakpoint-2xl': `${breakpoints['2xl']}px`,
} as const;
