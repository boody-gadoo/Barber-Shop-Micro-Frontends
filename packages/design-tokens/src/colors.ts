/**
 * Egyptian Barber Shop Brand Colors
 *
 * Visual direction: Modern Egyptian craft + premium barber shop
 * - Primary: Deep, sophisticated brown (classic barber aesthetic)
 * - Surface: Slightly lighter for depth
 * - Accent: Warm terracotta (Egyptian/Mediterranean feel)
 * - Sand: Warm beige (Egyptian desert aesthetic)
 * - Background: Off-white (clean, modern)
 * - Text: Dark brown (high contrast)
 * - Muted: Warm gray (secondary text)
 */

export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#F5F2F0',
    100: '#E8E3DE',
    200: '#D9CFC5',
    300: '#C8B8AA',
    400: '#B8A094',
    500: '#A68878',
    600: '#8F6F5A',
    700: '#765643',
    800: '#5A3E2F',
    900: '#3D2620',
    950: '#2A1918',
  },
  darkBrown: '#171412', // Primary dark (logo, headings)
  brown: '#211E1B', // Primary text
  surface: '#29231F', // Surface elevation
  accent: '#B66A3C', // Warm terracotta accent
  sand: '#E7D8C5', // Warm beige
  background: '#F8F5F0', // Off-white background
  text: '#211E1B', // Primary text
  muted: '#6F6861', // Secondary text, disabled

  // Status Colors
  success: '#10B981', // Green
  error: '#EF4444', // Red
  warning: '#F59E0B', // Amber
  info: '#3B82F6', // Blue

  // Neutral
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Semantic
  transparent: 'transparent',
};

/**
 * CSS Variables for Design Tokens
 * Usage: var(--color-primary-dark)
 */
export const colorVariables = {
  '--color-primary-dark': colors.darkBrown,
  '--color-primary': colors.brown,
  '--color-surface': colors.surface,
  '--color-accent': colors.accent,
  '--color-sand': colors.sand,
  '--color-background': colors.background,
  '--color-text': colors.text,
  '--color-muted': colors.muted,
  '--color-success': colors.success,
  '--color-error': colors.error,
  '--color-warning': colors.warning,
  '--color-info': colors.info,
  '--color-white': colors.white,
  '--color-black': colors.black,
} as const;
