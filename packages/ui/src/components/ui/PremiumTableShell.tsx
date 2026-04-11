import type { ReactNode } from 'react';

import { colorTokens, radiusTokens, shadowTokens, spacingTokens, typographyTokens } from '../../styles/tokens';

type PremiumTableShellProps = {
  title: string;
  columns: string[];
  children: ReactNode;
};

export function PremiumTableShell({ title, columns, children }: PremiumTableShellProps) {
  return (
    <section
      style={{
        backgroundColor: colorTokens.surface.card,
        border: `1px solid ${colorTokens.border.subtle}`,
        borderRadius: radiusTokens.lg,
        boxShadow: shadowTokens.sm,
        overflowX: 'auto'
      }}
    >
      <div style={{ padding: spacingTokens['5'], borderBottom: `1px solid ${colorTokens.border.subtle}` }}>
        <h3 style={{ margin: 0, fontSize: typographyTokens.fontSize.lg, color: colorTokens.text.primary }}>{title}</h3>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: colorTokens.surface.elevated }}>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                style={{
                  textAlign: 'left',
                  padding: `${spacingTokens['3']} ${spacingTokens['5']}`,
                  fontSize: typographyTokens.fontSize.sm,
                  fontWeight: typographyTokens.fontWeight.medium,
                  color: colorTokens.text.secondary,
                  whiteSpace: 'nowrap'
                }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </section>
  );
}
