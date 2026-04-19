import type { ReactNode } from 'react';

import { SiteFooter, SiteTopNav } from '@data-dogs/ui';

import './globals.css';

export const metadata = {
  title: 'Ibis — SEC filings, verified financial facts',
  description:
    'Every U.S. securities filing, structured at the source. Data sourced from SEC EDGAR.'
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <SiteTopNav />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
