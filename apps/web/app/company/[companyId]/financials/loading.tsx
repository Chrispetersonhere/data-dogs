import type { CSSProperties } from 'react';

import { colorTokens, spacingTokens, typographyTokens, radiusTokens } from '../../../../../../packages/ui/src/styles/tokens';

const shellStyle: CSSProperties = {
  minHeight: '100vh',
  background: `linear-gradient(145deg, ${colorTokens.surface.inverse} 0%, #111827 45%, #1f2937 100%)`,
  color: colorTokens.text.inverse,
  fontFamily: typographyTokens.fontFamily.sans,
  padding: spacingTokens['4'],
};

const cardStyle: CSSProperties = {
  border: `1px solid ${colorTokens.border.strong}`,
  borderRadius: radiusTokens.lg,
  background: 'rgba(15, 23, 42, 0.78)',
  padding: spacingTokens['5'],
};

const pulseBar: CSSProperties = {
  height: spacingTokens['4'],
  borderRadius: radiusTokens.sm,
  background: 'rgba(148, 163, 184, 0.15)',
};

export default function FinancialsLoading() {
  return (
    <main style={shellStyle}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gap: spacingTokens['4'], width: '100%', boxSizing: 'border-box' }}>
        <section style={cardStyle}>
          <div style={{ ...pulseBar, width: '140px', marginBottom: spacingTokens['3'] }} />
          <div style={{ ...pulseBar, width: '320px', height: spacingTokens['8'] }} />
        </section>
        <section style={cardStyle}>
          <div style={{ ...pulseBar, width: '160px', marginBottom: spacingTokens['4'] }} />
          <div style={{ display: 'flex', gap: spacingTokens['2'] }}>
            <div style={{ ...pulseBar, width: '80px', height: spacingTokens['8'] }} />
            <div style={{ ...pulseBar, width: '80px', height: spacingTokens['8'] }} />
          </div>
        </section>
        {Array.from({ length: 3 }).map((_, i) => (
          <section key={i} style={cardStyle}>
            <div style={{ ...pulseBar, width: '180px', marginBottom: spacingTokens['4'] }} />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} style={{ ...pulseBar, marginBottom: spacingTokens['2'] }} />
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
