import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { SiteFooter, SiteTopNav } from '@data-dogs/ui';

import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.ibis.dev';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Ibis — SEC filings, verified financial facts',
    template: '%s · Ibis',
  },
  description:
    'Every executive pay number, insider trade and 10-K line item carries six fields of provenance — source URL, accession, fetch timestamp, checksum, parser version and job ID — so analysts can defend every figure they cite.',
  applicationName: 'Ibis',
  keywords: [
    'SEC EDGAR',
    'financial data',
    'XBRL',
    'fundamentals',
    'insider transactions',
    'executive compensation',
    'point-in-time',
    'restatement-aware',
    'SEC API',
  ],
  authors: [{ name: 'Ibis' }],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'Ibis',
    title: 'Ibis — SEC filings, verified financial facts',
    description:
      'Every executive pay number, insider trade and 10-K line item carries six fields of provenance, traceable back to the SEC EDGAR filing it came from.',
    url: SITE_URL,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ibis — SEC filings, verified financial facts',
    description:
      'SEC-native financial data. Six fields of provenance on every fact. Point-in-time by construction.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#10213E',
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
