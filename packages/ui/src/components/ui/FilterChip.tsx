import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '../../styles/tokens';

type FilterChipProps = {
  label: string;
  selected?: boolean;
};

export function FilterChip({ label, selected = false }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      style={{
        border: `1px solid ${selected ? colorTokens.text.primary : colorTokens.border.default}`,
        backgroundColor: selected ? colorTokens.accent.soft : colorTokens.surface.card,
        color: selected ? colorTokens.text.primary : colorTokens.text.secondary,
        borderRadius: radiusTokens.pill,
        padding: `${spacingTokens['2']} ${spacingTokens['4']}`,
        fontSize: typographyTokens.fontSize.sm,
        fontWeight: typographyTokens.fontWeight.medium,
        cursor: 'pointer'
      }}
    >
      {label}
    </button>
  );
}
