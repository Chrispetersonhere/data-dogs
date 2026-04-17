import type { ReactNode } from 'react';

import { colorTokens, radiusTokens, shadowTokens, spacingTokens, typographyTokens } from '../../styles/tokens';

type StatCardProps = {
  label: string;
  value: string;
  delta?: string;
  footer?: ReactNode;
};

export function StatCard({ label, value, delta, footer }: StatCardProps) {
  return (
    <article
      style={{
        backgroundColor: colorTokens.surface.card,
        border: `1px solid ${colorTokens.border.subtle}`,
        borderRadius: radiusTokens.lg,
        boxShadow: shadowTokens.sm,
        padding: spacingTokens['5']
      }}
    >
      <p style={{ margin: 0, fontSize: typographyTokens.fontSize.sm, color: colorTokens.text.secondary }}>{label}</p>
      <p
        style={{
          margin: `${spacingTokens['2']} 0`,
          fontSize: typographyTokens.fontSize['2xl'],
          fontWeight: typographyTokens.fontWeight.semibold,
          color: colorTokens.text.primary
        }}
      >
        {value}
      </p>
      {delta ? (
        <p style={{ margin: 0, fontSize: typographyTokens.fontSize.sm, color: colorTokens.text.secondary }}>{delta}</p>
      ) : null}
      {footer ? <div style={{ marginTop: spacingTokens['4'] }}>{footer}</div> : null}
    </article>
  );
}
