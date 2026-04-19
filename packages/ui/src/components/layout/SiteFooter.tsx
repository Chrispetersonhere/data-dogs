import type { CSSProperties } from 'react';

import {
  colorTokens,
  spacingTokens,
  typographyTokens
} from '../../styles/tokens';

type SiteFooterProps = {
  latestIngest?: string;
  medianLatencySeconds?: number;
};

export function SiteFooter({
  latestIngest = '14:31 ET',
  medianLatencySeconds = 8
}: SiteFooterProps) {
  const footerStyle: CSSProperties = {
    marginTop: spacingTokens['12'],
    padding: `${spacingTokens['8']} ${spacingTokens['6']}`,
    borderTop: `1px solid ${colorTokens.border.subtle}`,
    background: colorTokens.surface.elevated,
    color: colorTokens.text.muted,
    fontFamily: typographyTokens.fontFamily.sans,
    fontSize: typographyTokens.fontSize.xs,
    lineHeight: typographyTokens.lineHeight.relaxed
  };

  const innerStyle: CSSProperties = {
    maxWidth: 1180,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: spacingTokens['5'],
    alignItems: 'start'
  };

  const disclaimerStyle: CSSProperties = {
    margin: 0,
    maxWidth: '78ch',
    color: colorTokens.text.muted,
    fontSize: typographyTokens.fontSize.xs,
    lineHeight: typographyTokens.lineHeight.relaxed
  };

  const freshnessStyle: CSSProperties = {
    marginTop: spacingTokens['3'],
    fontFamily: typographyTokens.fontFamily.mono,
    color: colorTokens.text.muted
  };

  return (
    <footer style={footerStyle}>
      <div style={innerStyle}>
        <div>
          <p style={disclaimerStyle}>
            <strong style={{ color: colorTokens.text.secondary }}>
              Not investment advice.
            </strong>{' '}
            Ibis does not provide investment, legal, tax, or accounting advice.
            Data sourced from SEC EDGAR and other public filings; see
            Methodology for coverage and limitations.
          </p>
          <p style={{ ...disclaimerStyle, marginTop: spacingTokens['2'] }}>
            Filings data sourced from the U.S. Securities and Exchange
            Commission&apos;s EDGAR system.
          </p>
          <p style={freshnessStyle}>
            Latest EDGAR ingest: {latestIngest} · Median latency{' '}
            {medianLatencySeconds}s
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/edgar-attribution.svg"
          height={54}
          alt="EDGAR attribution"
          style={{ display: 'block' }}
        />
      </div>
    </footer>
  );
}
