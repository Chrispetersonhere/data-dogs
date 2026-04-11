import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '../../styles/tokens';

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section
      style={{
        border: `1px dashed ${colorTokens.border.default}`,
        borderRadius: radiusTokens.lg,
        padding: spacingTokens['8'],
        textAlign: 'center',
        backgroundColor: colorTokens.surface.elevated
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: typographyTokens.fontSize.xl,
          color: colorTokens.text.primary
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: `${spacingTokens['3']} auto 0`,
          maxWidth: '44ch',
          color: colorTokens.text.secondary,
          fontSize: typographyTokens.fontSize.md
        }}
      >
        {description}
      </p>
    </section>
  );
}
