import type { CSSProperties, ReactNode } from 'react';

import { colorTokens, spacingTokens, typographyTokens } from '../../styles/tokens';

type PageContainerProps = {
  children: ReactNode;
  maxWidth?: CSSProperties['maxWidth'];
};

export function PageContainer({ children, maxWidth = '1200px' }: PageContainerProps) {
  return (
    <div
      style={{
        backgroundColor: colorTokens.surface.page,
        color: colorTokens.text.primary,
        fontFamily: typographyTokens.fontFamily.sans,
        minHeight: '100vh',
        padding: `${spacingTokens['8']} ${spacingTokens['4']}`
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth,
          margin: '0 auto'
        }}
      >
        {children}
      </div>
    </div>
  );
}
