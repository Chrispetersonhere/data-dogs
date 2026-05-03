import Link from 'next/link';

import {
  PageContainer,
  SectionHeader,
  colorTokens,
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '@data-dogs/ui';

import styles from './page.module.css';

export const metadata = {
  title: 'Product overview — Ibis',
  description:
    'Tour the Ibis terminal: filings, fundamentals, executive compensation, insider activity, screener and peer benchmarks — all backed by SEC EDGAR.',
};

const featuredCompanies = [
  { ticker: 'AAPL', cik: '0000320193', name: 'Apple Inc.' },
  { ticker: 'MSFT', cik: '0000789019', name: 'Microsoft Corp.' },
  { ticker: 'GOOGL', cik: '0001652044', name: 'Alphabet Inc.' },
  { ticker: 'NVDA', cik: '0001045810', name: 'NVIDIA Corp.' },
] as const;

const surfaces = [
  {
    title: 'Filings',
    href: '/filings',
    eyebrow: '10-K · 10-Q · 8-K · DEF 14A · 3/4/5',
    description:
      'Search every SEC filing. Filter by issuer, form type, date range, accession or text. Each row links to the original EDGAR artifact and to the structured facts derived from it.',
    cta: 'Open the filings explorer →',
  },
  {
    title: 'Company',
    href: '/company/0000320193',
    eyebrow: 'Issuer profile · multi-tab view',
    description:
      'Per-issuer overview with fundamentals, compensation and insider tabs. Every fact carries six fields of provenance and a link to the source disclosure.',
    cta: 'See an example issuer →',
  },
  {
    title: 'Screener',
    href: '/screener',
    eyebrow: 'Fundamental queries',
    description:
      'Build screens against standardized GAAP / non-GAAP metrics. Restatement-aware and point-in-time by construction — what you see is what was knowable at as-of date.',
    cta: 'Open the screener →',
  },
  {
    title: 'Peers',
    href: '/peers',
    eyebrow: 'Benchmark vs. comparable issuers',
    description:
      'Compare an issuer against a custom peer set across margins, growth, returns and pay-mix. Save peer sets on Team and Enterprise.',
    cta: 'Open peer benchmarks →',
  },
  {
    title: 'API reference',
    href: '/docs/api',
    eyebrow: '/api/v1/* · provenance on every response',
    description:
      'Six public endpoints: companies, filings, financials, compensation, insiders, screener. Every response embeds the same six provenance fields you see in the UI.',
    cta: 'Read the API docs →',
  },
  {
    title: 'Pricing',
    href: '/pricing',
    eyebrow: 'Researcher · Team · Enterprise',
    description:
      'Researcher $99/mo, Team $499/mo, Enterprise custom. Same data and same provenance on every plan — pay for seats and request volume.',
    cta: 'See pricing →',
  },
] as const;

export default function OverviewPage() {
  return (
    <PageContainer>
      <main id="main-content" className={styles.pageMain}>
        <header className={styles.heroHeader}>
          <p className={styles.heroEyebrow}>Product overview</p>
          <h1 className={styles.heroTitle}>The terminal, surface by surface</h1>
          <p className={styles.heroSubtitle}>
            Ibis is one tool. Every screen pulls from the same provenance-tracked
            fact store, every API response carries the same six fields, and every
            number you cite can be traced back to the SEC EDGAR filing it came from.
          </p>
          <div
            role="group"
            aria-label="Primary actions"
            className={styles.heroCtaRow}
          >
            <Link href="/filings" className={styles.ctaPrimary}>
              Browse filings
            </Link>
            <Link href="/docs/api" className={styles.ctaSecondary}>
              Read the API docs
            </Link>
          </div>
        </header>

        <section aria-label="Featured issuers" className={styles.featuredBlock}>
          <p className={styles.featuredLabel}>Try an issuer</p>
          <ul className={styles.featuredList}>
            {featuredCompanies.map((c) => (
              <li key={c.cik}>
                <a className={styles.featuredChip} href={`/company/${c.cik}`}>
                  <span className={styles.featuredTicker}>{c.ticker}</span>
                  <span className={styles.featuredName}>{c.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <hr className={styles.sectionDivider} />

        <section aria-label="Product surfaces">
          <SectionHeader
            title="Every surface, one source of truth"
            subtitle="Filings, company, fundamentals, comp, insiders, screener and peers — all driven by the same fact store."
          />
          <div className={styles.surfaceGrid}>
            {surfaces.map((s) => (
              <Link key={s.href} href={s.href} className={styles.surfaceCard}>
                <p className={styles.surfaceEyebrow}>{s.eyebrow}</p>
                <p className={styles.surfaceTitle}>{s.title}</p>
                <p className={styles.surfaceDescription}>{s.description}</p>
                <span className={styles.surfaceCta}>{s.cta}</span>
              </Link>
            ))}
          </div>
        </section>

        <section
          aria-label="Final call to action"
          style={{
            marginTop: spacingTokens['8'],
            padding: `${spacingTokens['10']} ${spacingTokens['6']}`,
            textAlign: 'center',
            background: colorTokens.surface.elevated,
            border: `1px solid ${colorTokens.border.subtle}`,
            borderRadius: radiusTokens.lg,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: typographyTokens.fontSize['2xl'],
              fontWeight: typographyTokens.fontWeight.semibold,
              color: colorTokens.text.primary,
            }}
          >
            Start a 14-day trial
          </h2>
          <p
            style={{
              margin: `${spacingTokens['3']} auto 0`,
              maxWidth: '40rem',
              fontSize: typographyTokens.fontSize.md,
              color: colorTokens.text.secondary,
            }}
          >
            Full data, full API, no credit card. We&apos;ll email you when your seat is ready.
          </p>
          <div
            role="group"
            aria-label="Trial call to action"
            style={{
              display: 'flex',
              gap: spacingTokens['3'],
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: spacingTokens['5'],
            }}
          >
            <Link href="/signup?plan=researcher" className={styles.ctaPrimary}>
              Start a trial
            </Link>
            <Link href="/pricing" className={styles.ctaSecondary}>
              See pricing
            </Link>
          </div>
        </section>
      </main>
    </PageContainer>
  );
}
