import {
  colorTokens,
  radiusTokens,
  shadowTokens,
  spacingTokens,
  typographyTokens
} from '../../styles/tokens';

type PipelineStepProps = {
  step: string;
  title: string;
  description: string;
};

export function PipelineStep({ step, title, description }: PipelineStepProps) {
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
          fontSize: typographyTokens.fontSize.xs,
          color: colorTokens.text.secondary,
          fontWeight: typographyTokens.fontWeight.semibold,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em'
        }}
      >
        Step {step}
      </p>
      <p
        style={{
          margin: `${spacingTokens['2']} 0`,
          fontSize: typographyTokens.fontSize.xl,
          fontWeight: typographyTokens.fontWeight.semibold,
          color: colorTokens.text.primary
        }}
      >
        {title}
      </p>
      <p
        style={{
          margin: 0,
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
