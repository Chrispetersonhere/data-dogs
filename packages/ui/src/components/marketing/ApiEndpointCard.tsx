import {
  colorTokens,
  radiusTokens,
  shadowTokens,
  spacingTokens,
  typographyTokens
} from '../../styles/tokens';

type ApiEndpointCardProps = {
  path: string;
  description: string;
};

export function ApiEndpointCard({ path, description }: ApiEndpointCardProps) {
  return (
    <article
      style={{
        backgroundColor: colorTokens.surface.card,
        border: `1px solid ${colorTokens.border.subtle}`,
        borderRadius: radiusTokens.lg,
        boxShadow: shadowTokens.sm,
        padding: spacingTokens['5'],
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease'
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: typographyTokens.fontFamily.mono,
          fontSize: typographyTokens.fontSize.sm,
          fontWeight: typographyTokens.fontWeight.medium,
          color: colorTokens.text.primary
        }}
      >
        {path}
      </p>
      <p
        style={{
          margin: `${spacingTokens['1']} 0 0`,
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
