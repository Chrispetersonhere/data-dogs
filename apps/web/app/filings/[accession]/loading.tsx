import type { CSSProperties } from 'react';

import { colorTokens, spacingTokens, typographyTokens, radiusTokens } from '../../../../../packages/ui/src/styles/tokens';

const shellStyle: CSSProperties = {
  minHeight: '100vh',
  background: colorTokens.surface.page,
  color: colorTokens.text.primary,
  fontFamily: typographyTokens.fontFamily.sans,
  padding: spacingTokens['5'],
};

const cardStyle: CSSProperties = {
  border: `1px solid ${colorTokens.border.subtle}`,
  borderRadius: radiusTokens.lg,
  background: colorTokens.surface.card,
  padding: spacingTokens['4'],
};

const pulseBar: CSSProperties = {
  height: spacingTokens['4'],
  borderRadius: radiusTokens.sm,
  background: colorTokens.accent.soft,
};

export default function FilingDetailLoading() {
  return (
    <main style={shellStyle}>
      <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'grid', gap: spacingTokens['4'] }}>
        <section style={cardStyle}>
          <div style={{ ...pulseBar, width: '220px', marginBottom: spacingTokens['3'] }} />
          <div style={{ ...pulseBar, width: '300px', height: spacingTokens['8'] }} />
        </section>
        <section style={cardStyle}>
          <div style={{ ...pulseBar, width: '160px', marginBottom: spacingTokens['4'] }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacingTokens['3'] }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} style={{ ...pulseBar, height: spacingTokens['10'] }} />
            ))}
          </div>
        </section>
        <section style={cardStyle}>
          <div style={{ ...pulseBar, width: '180px', marginBottom: spacingTokens['4'] }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ ...pulseBar, marginBottom: spacingTokens['2'] }} />
          ))}
        </section>
      </div>
    </main>
  );
}
