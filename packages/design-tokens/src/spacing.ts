/**
 * Spacing Scale
 *
 * Base: 4px
 * Progression: 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 128
 */

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
  // Aliases for common use
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 80,
} as const;

/**
 * CSS Variables for Spacing
 */
export const spacingVariables = {
  '--spacing-0': '0',
  '--spacing-1': '4px',
  '--spacing-2': '8px',
  '--spacing-3': '12px',
  '--spacing-4': '16px',
  '--spacing-6': '24px',
  '--spacing-8': '32px',
  '--spacing-10': '40px',
  '--spacing-12': '48px',
  '--spacing-16': '64px',
  '--spacing-20': '80px',
  '--spacing-24': '96px',
  '--spacing-32': '128px',
  '--spacing-xs': '4px',
  '--spacing-sm': '8px',
  '--spacing-md': '16px',
  '--spacing-lg': '24px',
  '--spacing-xl': '32px',
  '--spacing-2xl': '48px',
  '--spacing-3xl': '64px',
  '--spacing-4xl': '80px',
} as const;
