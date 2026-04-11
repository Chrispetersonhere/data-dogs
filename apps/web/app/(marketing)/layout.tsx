import type { ReactNode } from 'react';

import { colorTokens, typographyTokens } from '@data-dogs/ui';

type MarketingLayoutProps = {
  children: ReactNode;
};

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div
      style={{
        backgroundColor: colorTokens.surface.page,
        color: colorTokens.text.primary,
        fontFamily: typographyTokens.fontFamily.sans,
        minHeight: '100vh'
      }}
    >
      {children}
    </div>
  );
}
