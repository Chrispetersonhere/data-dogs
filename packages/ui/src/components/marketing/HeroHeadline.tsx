import { colorTokens, spacingTokens, typographyTokens } from '../../styles/tokens';

type HeroHeadlineProps = {
  title: string;
  subtitle: string;
};

export function HeroHeadline({ title, subtitle }: HeroHeadlineProps) {
  return (
    <header
      style={{
        textAlign: 'center',
        maxWidth: '48rem',
        margin: `0 auto ${spacingTokens['8']}`,
        padding: `${spacingTokens['12']} 0 ${spacingTokens['4']}`
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: typographyTokens.fontSize['3xl'],
          fontWeight: typographyTokens.fontWeight.bold,
          lineHeight: typographyTokens.lineHeight.tight,
          color: colorTokens.text.primary,
          letterSpacing: '-0.01em'
        }}
      >
        {title}
      </h1>
      <p
        style={{
          margin: `${spacingTokens['4']} auto 0`,
          maxWidth: '36rem',
          fontSize: typographyTokens.fontSize.lg,
          lineHeight: typographyTokens.lineHeight.relaxed,
          color: colorTokens.text.secondary
        }}
      >
        {subtitle}
      </p>
    </header>
  );
}
