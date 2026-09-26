/**
 * Design Tokens - Egyptian Barber Shop Brand
 *
 * حلاقة البلد (Helaqat El Balad)
 * A unified design system for all Micro Frontend applications.
 *
 * These tokens are framework-agnostic and can be used in:
 * - React components
 * - Angular components
 * - CSS stylesheets
 * - Configuration files
 */

export { colors, colorVariables } from './colors';
export { typography, typographyVariables } from './typography';
export { spacing, spacingVariables } from './spacing';
export { radius, radiusVariables } from './radius';
export { shadows, shadowVariables } from './shadows';
export { breakpoints, mediaQueries, breakpointVariables } from './breakpoints';
export { motion, motionVariables } from './motion';

// Re-export all variables together for convenience
export const allVariables = {
  colors: require('./colors').colorVariables,
  typography: require('./typography').typographyVariables,
  spacing: require('./spacing').spacingVariables,
  radius: require('./radius').radiusVariables,
  shadows: require('./shadows').shadowVariables,
  breakpoints: require('./breakpoints').breakpointVariables,
  motion: require('./motion').motionVariables,
} as const;
