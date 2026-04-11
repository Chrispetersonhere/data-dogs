export const colorTokens = {
  surface: {
    page: '#F5F4F2',
    card: '#FFFFFF',
    elevated: '#FAFAF9',
    inverse: '#101828'
  },
  text: {
    primary: '#10213E',
    secondary: '#344054',
    muted: '#667085',
    inverse: '#F8FAFC'
  },
  border: {
    subtle: '#D0D5DD',
    default: '#98A2B3',
    strong: '#475467'
  },
  accent: {
    muted: '#7C8BA8',
    soft: '#E8ECF5'
  },
  semantic: {
    success: '#027A48',
    warning: '#B54708',
    danger: '#B42318'
  }
} as const;

export const spacingTokens = {
  '0': '0',
  '1': '0.25rem',
  '2': '0.5rem',
  '3': '0.75rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '8': '2rem',
  '10': '2.5rem',
  '12': '3rem',
  '16': '4rem'
} as const;

export const typographyTokens = {
  fontFamily: {
    sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    mono: "'JetBrains Mono', 'SFMono-Regular', Menlo, monospace"
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem'
  },
  lineHeight: {
    tight: 1.2,
    default: 1.5,
    relaxed: 1.7
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  }
} as const;

export const radiusTokens = {
  none: '0',
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  pill: '999px'
} as const;

export const borderTokens = {
  none: '0',
  thin: '1px',
  thick: '2px'
} as const;

export const shadowTokens = {
  none: 'none',
  sm: '0 1px 2px rgba(16, 24, 40, 0.05)',
  md: '0 2px 8px rgba(16, 24, 40, 0.08)',
  lg: '0 8px 24px rgba(16, 24, 40, 0.10)'
} as const;

export const breakpointTokens = {
  mobile: '0px',
  tablet: '768px',
  desktop: '1200px'
} as const;

export const designTokens = {
  color: colorTokens,
  spacing: spacingTokens,
  typography: typographyTokens,
  radius: radiusTokens,
  border: borderTokens,
  shadow: shadowTokens,
  breakpoint: breakpointTokens
} as const;

export type DesignTokens = typeof designTokens;
