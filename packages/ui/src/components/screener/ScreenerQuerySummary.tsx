import type { CSSProperties } from 'react';

import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '../../styles/tokens';

type ActiveFilter = {
  category: string;
  field: string;
  label: string;
};

type ScreenerQuerySummaryProps = {
  filters: ActiveFilter[];
  totalMatched: number;
};

const containerStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacingTokens['2'],
  padding: `${spacingTokens['3']} ${spacingTokens['4']}`,
  backgroundColor: colorTokens.surface.elevated,
  borderRadius: radiusTokens.md,
  fontSize: typographyTokens.fontSize.sm,
  color: colorTokens.text.secondary,
};

const tagStyle: CSSProperties = {
  display: 'inline-block',
  padding: `${spacingTokens['1']} ${spacingTokens['3']}`,
  backgroundColor: colorTokens.accent.soft,
  borderRadius: radiusTokens.pill,
  fontSize: typographyTokens.fontSize.xs,
  fontWeight: typographyTokens.fontWeight.medium,
  color: colorTokens.text.primary,
};

export function ScreenerQuerySummary({ filters, totalMatched }: ScreenerQuerySummaryProps) {
  if (filters.length === 0) {
    return (
      <div style={containerStyle} data-testid="query-summary">
        <span>No filters active — showing all {totalMatched} companies.</span>
      </div>
    );
  }

  return (
    <div style={containerStyle} data-testid="query-summary">
      <span>Active filters:</span>
      {filters.map((filter) => (
        <span key={`${filter.category}-${filter.field}`} style={tagStyle}>
          {filter.label}
        </span>
      ))}
      <span style={{ marginLeft: 'auto', fontWeight: typographyTokens.fontWeight.medium }}>
        {totalMatched} result{totalMatched !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
