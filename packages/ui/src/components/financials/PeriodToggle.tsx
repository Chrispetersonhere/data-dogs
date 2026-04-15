import type { CSSProperties } from 'react';

import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '../../styles/tokens';

export type PeriodOption = {
  id: string;
  label: string;
};

type PeriodToggleProps = {
  periods: PeriodOption[];
  activePeriodId: string;
};

const containerStyle: CSSProperties = {
  display: 'inline-flex',
  gap: spacingTokens['1'],
  padding: spacingTokens['1'],
  backgroundColor: colorTokens.surface.elevated,
  borderRadius: radiusTokens.lg,
  border: `1px solid ${colorTokens.border.subtle}`,
};

const baseButtonStyle: CSSProperties = {
  border: 'none',
  padding: `${spacingTokens['2']} ${spacingTokens['5']}`,
  fontSize: typographyTokens.fontSize.sm,
  fontWeight: typographyTokens.fontWeight.medium,
  fontFamily: 'inherit',
  borderRadius: radiusTokens.md,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

export function PeriodToggle({ periods, activePeriodId }: PeriodToggleProps) {
  return (
    <div role="group" aria-label="Period toggle" style={containerStyle}>
      {periods.map((period) => {
        const isActive = period.id === activePeriodId;
        return (
          <button
            key={period.id}
            type="button"
            aria-pressed={isActive}
            style={{
              ...baseButtonStyle,
              backgroundColor: isActive ? colorTokens.surface.card : 'transparent',
              color: isActive ? colorTokens.text.primary : colorTokens.text.muted,
              fontWeight: isActive ? typographyTokens.fontWeight.semibold : typographyTokens.fontWeight.medium,
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {period.label}
          </button>
        );
      })}
    </div>
  );
}
