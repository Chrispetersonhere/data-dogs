import type { ReactNode } from 'react';

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
    background: '#0A1020',
    color: '#E8ECF5',
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
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
    borderBottom: '1px solid #1E2B46'
  },
  headerInner: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '0.9rem 1.25rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem'
  },
  brand: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.6rem',
    color: '#F8FAFC',
    textDecoration: 'none',
    fontSize: '0.96rem',
    fontWeight: 650,
    letterSpacing: '0.02em'
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
    gap: '0.9rem',
    flexWrap: 'wrap' as const,
    alignItems: 'center'
  },
  navLink: {
    color: '#C8D4EA',
    textDecoration: 'none',
    fontSize: '0.88rem',
    padding: '0.35rem 0.6rem',
    borderRadius: '0.5rem',
    border: '1px solid transparent'
  },
  main: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '2rem 1.25rem 4rem'
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
