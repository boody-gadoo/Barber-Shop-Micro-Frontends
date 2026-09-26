/**
 * Border Radius Scale
 *
 * Restrained radius - not everything is rounded
 */

export const radius = {
  none: 0,
  small: 8,
  input: 10,
  button: 10,
  card: 12,
  modal: 16,
  hero: 24,
  full: 9999, // Circle
} as const;

/**
 * CSS Variables for Border Radius
 */
export const radiusVariables = {
  '--radius-none': '0',
  '--radius-small': '8px',
  '--radius-input': '10px',
  '--radius-button': '10px',
  '--radius-card': '12px',
  '--radius-modal': '16px',
  '--radius-hero': '24px',
  '--radius-full': '9999px',
} as const;
