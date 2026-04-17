import type { ReactNode } from 'react';

import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '@data-dogs/ui';

export const metadata = {
  title: 'Data Dogs Docs',
  description: 'Product and API documentation for Data Dogs.'
};

type DocsLayoutProps = {
  children: ReactNode;
};

const shellStyles = {
  page: {
    margin: 0,
    background: colorTokens.surface.page,
    color: colorTokens.text.primary,
    fontFamily: typographyTokens.fontFamily.sans,
    minHeight: '100vh'
  },
  topBorder: {
    background: 'linear-gradient(90deg, #6EA8FF, #A18BFF 45%, #5CE6C6)',
    height: '2px'
  },
  header: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 40,
    backdropFilter: 'blur(10px)',
    background: 'rgba(10, 16, 32, 0.86)',
    borderBottom: `1px solid ${colorTokens.border.default}`
  },
  headerInner: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: `${spacingTokens['4']} ${spacingTokens['5']}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacingTokens['4']
  },
  brand: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacingTokens['2'],
    color: colorTokens.text.primary,
    textDecoration: 'none',
    fontSize: typographyTokens.fontSize.md,
    fontWeight: typographyTokens.fontWeight.semibold,
    letterSpacing: '0.01em'
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '999px',
    background: '#5CE6C6',
    boxShadow: '0 0 20px rgba(92, 230, 198, 0.8)'
  },
  nav: {
    display: 'flex',
    gap: spacingTokens['2'],
    flexWrap: 'wrap' as const,
    alignItems: 'center'
  },
  navLink: {
    color: colorTokens.text.secondary,
    textDecoration: 'none',
    fontSize: typographyTokens.fontSize.sm,
    padding: `${spacingTokens['1']} ${spacingTokens['3']}`,
    borderRadius: radiusTokens.md,
    border: '1px solid transparent'
  },
  main: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: `${spacingTokens['8']} ${spacingTokens['5']} ${spacingTokens['12']}`
  }
};

export default function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <html lang="en">
      <body style={shellStyles.page}>
        <div style={shellStyles.topBorder} />
        <header style={shellStyles.header}>
          <div style={shellStyles.headerInner}>
            <a href="/" style={shellStyles.brand}>
              <span style={shellStyles.dot} aria-hidden="true" />
              Data Dogs Documentation
            </a>
            <nav style={shellStyles.nav} aria-label="Documentation navigation">
              <a href="/" style={shellStyles.navLink}>Overview</a>
              <a href="/api" style={shellStyles.navLink}>API Reference</a>
              <a href="/product" style={shellStyles.navLink}>Product Docs</a>
            </nav>
          </div>
        </header>
        <main style={shellStyles.main}>{children}</main>
      </body>
    </html>
  );
}
