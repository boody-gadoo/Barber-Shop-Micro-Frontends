/**
 * Typography Scale
 *
 * Font families:
 * - Headings: Cairo (Egyptian modern font)
 * - Body: Tajawal (Egyptian contemporary font)
 *
 * Note: Font files should be loaded separately in each application.
 * These tokens define the scale and hierarchy only.
 */

export const typography = {
  // Font families (to be loaded in applications)
  fontFamily: {
    heading: 'Cairo, sans-serif',
    body: 'Tajawal, sans-serif',
    mono: 'Menlo, Monaco, "Courier New", monospace',
  },

  // Font weights
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Typography scale (line-height pairs)
  sizes: {
    // Display
    display: {
      fontSize: 64,
      lineHeight: 72,
      letterSpacing: '-0.02em',
      fontWeight: 700,
    },
    // Headings
    h1: {
      fontSize: 48,
      lineHeight: 56,
      letterSpacing: '-0.01em',
      fontWeight: 700,
    },
    h2: {
      fontSize: 36,
      lineHeight: 44,
      letterSpacing: '-0.005em',
      fontWeight: 700,
    },
    h3: {
      fontSize: 28,
      lineHeight: 36,
      letterSpacing: 0,
      fontWeight: 600,
    },
    h4: {
      fontSize: 22,
      lineHeight: 30,
      letterSpacing: 0,
      fontWeight: 600,
    },
    // Body
    bodyLarge: {
      fontSize: 18,
      lineHeight: 30,
      letterSpacing: 0,
      fontWeight: 400,
    },
    body: {
      fontSize: 16,
      lineHeight: 28,
      letterSpacing: 0,
      fontWeight: 400,
    },
    bodySmall: {
      fontSize: 14,
      lineHeight: 22,
      letterSpacing: 0,
      fontWeight: 400,
    },
    // Caption
    caption: {
      fontSize: 12,
      lineHeight: 18,
      letterSpacing: '0.01em',
      fontWeight: 500,
    },
  },

  // Line heights (for other uses)
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.02em',
    tight: '-0.01em',
    normal: '0',
    wide: '0.01em',
    wider: '0.02em',
    widest: '0.04em',
  },
};

/**
 * CSS Variables for Typography
 */
export const typographyVariables = {
  '--font-family-heading': typography.fontFamily.heading,
  '--font-family-body': typography.fontFamily.body,
  '--font-family-mono': typography.fontFamily.mono,
  '--font-weight-light': typography.fontWeight.light.toString(),
  '--font-weight-normal': typography.fontWeight.normal.toString(),
  '--font-weight-medium': typography.fontWeight.medium.toString(),
  '--font-weight-semibold': typography.fontWeight.semibold.toString(),
  '--font-weight-bold': typography.fontWeight.bold.toString(),
  '--line-height-tight': typography.lineHeight.tight.toString(),
  '--line-height-normal': typography.lineHeight.normal.toString(),
  '--line-height-relaxed': typography.lineHeight.relaxed.toString(),
} as const;
