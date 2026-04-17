import type { CSSProperties } from 'react';

import { colorTokens, spacingTokens, typographyTokens, radiusTokens } from '../../../../../packages/ui/src/styles/tokens';

const shellStyle: CSSProperties = {
  minHeight: '100vh',
  background: `linear-gradient(145deg, ${colorTokens.surface.inverse} 0%, #111827 45%, #1e293b 100%)`,
  color: colorTokens.text.inverse,
  fontFamily: typographyTokens.fontFamily.sans,
  padding: spacingTokens['4'],
};

const cardStyle: CSSProperties = {
  border: `1px solid ${colorTokens.border.strong}`,
  borderRadius: radiusTokens.xl,
  padding: spacingTokens['5'],
  background: 'rgba(15, 23, 42, 0.72)',
};

const pulseBar: CSSProperties = {
  height: spacingTokens['4'],
  borderRadius: radiusTokens.sm,
  background: 'rgba(148, 163, 184, 0.15)',
};

export default function CompanyOverviewLoading() {
  return (
    <main style={shellStyle}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gap: spacingTokens['5'] }}>
        <section style={cardStyle}>
          <div className="dd-skeleton" style={{ ...pulseBar, width: '120px', marginBottom: spacingTokens['3'] }} />
          <div className="dd-skeleton" style={{ ...pulseBar, width: '340px', height: spacingTokens['8'] }} />
        </section>
        <section style={cardStyle}>
          <div className="dd-skeleton" style={{ ...pulseBar, width: '160px', marginBottom: spacingTokens['4'] }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacingTokens['3'] }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="dd-skeleton" style={{ ...pulseBar, height: spacingTokens['10'] }} />
            ))}
          </div>
        </section>
        <section style={cardStyle}>
          <div className="dd-skeleton" style={{ ...pulseBar, width: '200px', marginBottom: spacingTokens['4'] }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="dd-skeleton" style={{ ...pulseBar, marginBottom: spacingTokens['2'] }} />
          ))}
        </section>
      </div>
    </main>
  );
}
