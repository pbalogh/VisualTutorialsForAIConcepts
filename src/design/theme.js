/**
 * Design System for Visual Tutorials
 * 
 * Inspired by: Abetkaua, Ellipsus, Brilliant.org
 * 
 * Version: 1.0.0
 * Last updated: 2026-02-05
 */

// =============================================================================
// COLOR PALETTE
// =============================================================================

export const colors = {
  // Primary - Deep blue (from Abetkaua)
  primary: {
    50: '#EEF4FF',
    100: '#E0EBFF',
    200: '#C7D9FE',
    300: '#A5BFFC',
    400: '#819CF8',
    500: '#6478F1',  // Main
    600: '#4A55E5',
    700: '#3D44CA',
    800: '#3439A3',
    900: '#1E2156',  // Dark
  },
  
  // Accent - Warm gold/amber
  accent: {
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
  },
  
  // Neutrals
  gray: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
  },
  
  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Backgrounds
  background: {
    light: '#FFFFFF',
    subtle: '#FAFAFA',
    muted: '#F4F4F5',
  },
}

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  // Font families
  fonts: {
    // Display/headlines - bold, impactful
    display: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
    // Body text - readable, clean
    body: '"Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
    // Code/monospace
    mono: '"JetBrains Mono", "SF Mono", "Fira Code", monospace',
  },
  
  // Type scale (based on 1.25 ratio)
  sizes: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
    '7xl': '4.5rem',   // 72px
  },
  
  // Font weights
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },
  
  // Line heights
  lineHeights: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
}

// =============================================================================
// SPACING
// =============================================================================

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
}

// =============================================================================
// LAYOUT
// =============================================================================

export const layout = {
  maxWidth: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    prose: '65ch',  // Optimal reading width
  },
  
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
}

// =============================================================================
// COMPONENT PRESETS
// =============================================================================

export const components = {
  // Section headers (01. Title format)
  sectionHeader: {
    number: {
      fontFamily: typography.fonts.mono,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      color: colors.gray[400],
      letterSpacing: typography.letterSpacing.wider,
    },
    title: {
      fontFamily: typography.fonts.display,
      fontSize: typography.sizes['3xl'],
      fontWeight: typography.weights.bold,
      color: colors.gray[900],
      letterSpacing: typography.letterSpacing.tight,
      lineHeight: typography.lineHeights.tight,
    },
  },
  
  // Cards
  card: {
    background: colors.background.light,
    borderRadius: layout.borderRadius.xl,
    padding: spacing[6],
    shadow: layout.shadows.md,
  },
  
  // Callouts
  callout: {
    info: {
      background: colors.primary[50],
      border: colors.primary[200],
      text: colors.primary[800],
    },
    warning: {
      background: '#FEF3C7',
      border: '#FCD34D',
      text: '#92400E',
    },
    success: {
      background: '#D1FAE5',
      border: '#6EE7B7',
      text: '#065F46',
    },
    tip: {
      background: '#F3E8FF',
      border: '#C4B5FD',
      text: '#5B21B6',
    },
  },
  
  // Buttons
  button: {
    primary: {
      background: colors.primary[600],
      color: '#FFFFFF',
      hoverBackground: colors.primary[700],
    },
    secondary: {
      background: colors.gray[100],
      color: colors.gray[700],
      hoverBackground: colors.gray[200],
    },
  },
}

// =============================================================================
// CSS CUSTOM PROPERTIES (for Tailwind integration)
// =============================================================================

export const cssVariables = `
  :root {
    /* Colors */
    --color-primary: ${colors.primary[600]};
    --color-primary-dark: ${colors.primary[900]};
    --color-primary-light: ${colors.primary[100]};
    --color-accent: ${colors.accent[500]};
    
    /* Typography */
    --font-display: ${typography.fonts.display};
    --font-body: ${typography.fonts.body};
    --font-mono: ${typography.fonts.mono};
    
    /* Spacing */
    --space-section: ${spacing[16]};
    --space-content: ${spacing[8]};
    
    /* Layout */
    --max-width-prose: ${layout.maxWidth.prose};
    --max-width-content: ${layout.maxWidth.lg};
  }
`

export default {
  colors,
  typography,
  spacing,
  layout,
  components,
  cssVariables,
}
