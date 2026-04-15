import type { CSSProperties, ReactNode } from 'react';

import { colorTokens, radiusTokens, shadowTokens, spacingTokens, typographyTokens } from '../../styles/tokens';

type FinancialsTableShellProps = {
  title: string;
  children: ReactNode;
};

const sectionStyle: CSSProperties = {
  backgroundColor: colorTokens.surface.card,
  border: `1px solid ${colorTokens.border.subtle}`,
  borderRadius: radiusTokens.lg,
  boxShadow: shadowTokens.sm,
  overflow: 'hidden',
};

const headerStyle: CSSProperties = {
  padding: `${spacingTokens['4']} ${spacingTokens['5']}`,
  borderBottom: `1px solid ${colorTokens.border.subtle}`,
};

const scrollStyle: CSSProperties = {
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch' as never,
  maxWidth: '100%',
};

export const stickyTheadStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 1,
  backgroundColor: colorTokens.surface.elevated,
};

export function FinancialsTableShell({ title, children }: FinancialsTableShellProps) {
  return (
    <section style={sectionStyle} data-export="financials-table">
      <div style={headerStyle}>
        <h3
          style={{
            margin: 0,
            fontSize: typographyTokens.fontSize.lg,
            fontWeight: typographyTokens.fontWeight.semibold,
            color: colorTokens.text.primary,
          }}
        >
          {title}
        </h3>
      </div>
      <div style={scrollStyle} role="region" aria-label={`${title} data`} tabIndex={0}>
        {children}
      </div>
    </section>
  );
}
