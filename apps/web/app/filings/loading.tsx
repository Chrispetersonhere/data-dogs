import type { CSSProperties } from 'react';

import { colorTokens, spacingTokens, typographyTokens, radiusTokens } from '../../../../packages/ui/src/styles/tokens';

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

export default function FilingsLoading() {
  return (
    <main style={shellStyle}>
      <section style={{ maxWidth: '1180px', margin: '0 auto', display: 'grid', gap: spacingTokens['4'] }}>
        <header style={cardStyle}>
          <div style={{ ...pulseBar, width: '200px', marginBottom: spacingTokens['3'] }} />
          <div style={{ ...pulseBar, width: '320px', height: spacingTokens['8'] }} />
        </header>
        <section style={cardStyle}>
          <div style={{ ...pulseBar, width: '140px', marginBottom: spacingTokens['4'] }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: spacingTokens['3'] }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ ...pulseBar, height: spacingTokens['10'] }} />
            ))}
          </div>
        </section>
        <section style={cardStyle}>
          <div style={{ ...pulseBar, width: '180px', marginBottom: spacingTokens['4'] }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ ...pulseBar, marginBottom: spacingTokens['2'] }} />
          ))}
        </section>
      </section>
    </main>
  );
}
