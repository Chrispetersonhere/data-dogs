import {
  colorTokens,
  radiusTokens,
  shadowTokens,
  spacingTokens,
  typographyTokens
} from '../../styles/tokens';

type FeatureCardProps = {
  title: string;
  description: string;
};

export function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <article
      style={{
        backgroundColor: colorTokens.surface.card,
        border: `1px solid ${colorTokens.border.subtle}`,
        borderRadius: radiusTokens.lg,
        boxShadow: shadowTokens.sm,
        padding: spacingTokens['6'],
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease'
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: typographyTokens.fontSize.lg,
          fontWeight: typographyTokens.fontWeight.semibold,
          color: colorTokens.text.primary
        }}
      >
        {title}
      </p>
      <p
        style={{
          margin: `${spacingTokens['3']} 0 0`,
          fontSize: typographyTokens.fontSize.sm,
          color: colorTokens.text.secondary,
          lineHeight: typographyTokens.lineHeight.relaxed
        }}
      >
        {description}
      </p>
    </article>
  );
}
