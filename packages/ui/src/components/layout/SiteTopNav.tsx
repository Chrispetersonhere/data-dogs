import type { CSSProperties } from 'react';

import {
  colorTokens,
  spacingTokens,
  typographyTokens
} from '../../styles/tokens';

type NavLink = {
  href: string;
  label: string;
};

type SiteTopNavProps = {
  current?: string;
  ingestTimestamp?: string;
  medianLatencySeconds?: number;
  links?: ReadonlyArray<NavLink>;
};

const DEFAULT_LINKS: ReadonlyArray<NavLink> = [
  { href: '/', label: 'Research' },
  { href: '/filings', label: 'Filings' },
  { href: '/screener', label: 'Screener' },
  { href: '/peers', label: 'Peers' },
  { href: '/docs/api', label: 'API' },
  { href: '/docs/product', label: 'Docs' },
  { href: '/#pricing', label: 'Pricing' }
];

export function SiteTopNav({
  current = 'Research',
  ingestTimestamp = '14:31 ET',
  medianLatencySeconds = 8,
  links = DEFAULT_LINKS
}: SiteTopNavProps) {
  const navStyle: CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 20,
    height: 56,
    display: 'flex',
    alignItems: 'center',
    gap: spacingTokens['8'],
    padding: `0 ${spacingTokens['6']}`,
    borderBottom: `1px solid ${colorTokens.border.subtle}`,
    background: colorTokens.surface.page
  };

  const brandStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacingTokens['2'],
    textDecoration: 'none'
  };

  const brandTextStyle: CSSProperties = {
    fontFamily: typographyTokens.fontFamily.sans,
    fontSize: typographyTokens.fontSize.lg,
    fontWeight: typographyTokens.fontWeight.bold,
    color: colorTokens.text.primary,
    letterSpacing: '-0.01em'
  };

  const listStyle: CSSProperties = {
    display: 'flex',
    gap: spacingTokens['6'],
    listStyle: 'none',
    margin: 0,
    padding: 0,
    flex: 1
  };

  const freshnessStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacingTokens['2'],
    fontFamily: typographyTokens.fontFamily.mono,
    fontSize: typographyTokens.fontSize.xs,
    color: colorTokens.text.muted
  };

  return (
    <nav aria-label="Primary" style={navStyle}>
      <a href="/" style={brandStyle} aria-label="Ibis home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ibis-mark.svg"
          width={28}
          height={28}
          alt=""
          aria-hidden="true"
        />
        <span style={brandTextStyle}>Ibis</span>
      </a>
      <ul style={listStyle}>
        {links.map((link) => {
          const active = link.label === current;
          return (
            <li key={link.href}>
              <a
                href={link.href}
                aria-current={active ? 'page' : undefined}
                style={{
                  fontSize: typographyTokens.fontSize.sm,
                  fontWeight: active
                    ? typographyTokens.fontWeight.semibold
                    : typographyTokens.fontWeight.medium,
                  color: active ? colorTokens.text.primary : colorTokens.text.muted,
                  textDecoration: 'none',
                  transition: 'color 0.15s ease'
                }}
              >
                {link.label}
              </a>
            </li>
          );
        })}
      </ul>
      <a
        href="/status"
        style={{ ...freshnessStyle, textDecoration: 'none' }}
        aria-label={`EDGAR ingest freshness: ${ingestTimestamp}, median ${medianLatencySeconds}s. Open status page.`}
        title="Open the ingest status page"
      >
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: colorTokens.semantic.success,
            display: 'inline-block'
          }}
        />
        <span>
          Latest EDGAR ingest · {ingestTimestamp} · median {medianLatencySeconds}s
        </span>
      </a>
    </nav>
  );
}
