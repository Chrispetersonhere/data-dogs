import type { ReactNode } from 'react';

import { spacingTokens, typographyTokens, colorTokens } from '../../styles/tokens';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  level?: 1 | 2;
};

export function SectionHeader({ title, subtitle, actions, level = 2 }: SectionHeaderProps) {
  const Heading = level === 1 ? 'h1' : 'h2';
  return (
    <header
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: spacingTokens['3'],
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: spacingTokens['6']
      }}
    >
      <div>
        <Heading
          style={{
            margin: 0,
            fontSize: typographyTokens.fontSize['2xl'],
            fontWeight: typographyTokens.fontWeight.semibold,
            lineHeight: typographyTokens.lineHeight.tight,
            color: colorTokens.text.primary
          }}
        >
          {title}
        </Heading>
        {subtitle ? (
          <p
            style={{
              margin: `${spacingTokens['2']} 0 0`,
              fontSize: typographyTokens.fontSize.md,
              color: colorTokens.text.secondary
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div>{actions}</div> : null}
    </header>
  );
}
