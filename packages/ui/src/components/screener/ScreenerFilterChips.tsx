import type { CSSProperties } from 'react';

import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '../../styles/tokens';

/** The five screener filter categories. */
export type ScreenerFilterCategory = 'size' | 'growth' | 'margin' | 'leverage' | 'liquidity';

const CATEGORIES: { key: ScreenerFilterCategory; label: string }[] = [
  { key: 'size', label: 'Size' },
  { key: 'growth', label: 'Growth' },
  { key: 'margin', label: 'Margin' },
  { key: 'leverage', label: 'Leverage' },
  { key: 'liquidity', label: 'Liquidity' },
];

type ScreenerFilterChipsProps = {
  active: ScreenerFilterCategory[];
};

const containerStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacingTokens['2'],
};

function chipStyle(selected: boolean): CSSProperties {
  return {
    border: `1px solid ${selected ? colorTokens.text.primary : colorTokens.border.default}`,
    backgroundColor: selected ? colorTokens.accent.soft : colorTokens.surface.card,
    color: selected ? colorTokens.text.primary : colorTokens.text.secondary,
    borderRadius: radiusTokens.pill,
    padding: `${spacingTokens['2']} ${spacingTokens['4']}`,
    fontSize: typographyTokens.fontSize.sm,
    fontWeight: typographyTokens.fontWeight.medium,
    cursor: 'pointer',
  };
}

export function ScreenerFilterChips({ active }: ScreenerFilterChipsProps) {
  return (
    <div role="group" aria-label="Filter categories" style={containerStyle}>
      {CATEGORIES.map(({ key, label }) => {
        const selected = active.includes(key);
        return (
          <button
            key={key}
            type="button"
            aria-pressed={selected}
            data-category={key}
            style={chipStyle(selected)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
