import type { CSSProperties, JSX } from 'react';
import { notFound } from 'next/navigation';

import { colorTokens, spacingTokens, typographyTokens, radiusTokens } from '../../../../../packages/ui/src/styles/tokens';
import { GovernanceCards, summarizeGovernance } from '../../../../../packages/ui/src/components/company/governanceCards';
import { getCompanyOverview } from '../../../lib/api/company';
import {
  buildAccessionIndexUrl,
  formatUsdCompact,
  getHeadlineFundamentals,
  type HeadlineFundamentals,
  type HeadlineMetric,
} from '../../../lib/sec/fundamentals';
import { findIssuerByTicker, isLikelyTicker } from '../../../lib/sec/issuers';

type CompanyPageProps = {
  params: Promise<{ companyId: string }>;
};

const shellStyle: CSSProperties = {
  minHeight: '100vh',
  background: `linear-gradient(145deg, ${colorTokens.surface.inverse} 0%, #111827 45%, #1e293b 100%)`,
  color: colorTokens.text.inverse,
  fontFamily: typographyTokens.fontFamily.sans,
  padding: spacingTokens['4'],
};

const cardStyle: CSSProperties = {
  border: `1px solid ${colorTokens.border.strong}`,
  borderRadius: radiusTokens.xl,
  padding: spacingTokens['5'],
  background: 'rgba(15, 23, 42, 0.72)',
};

const dtMetaStyle: CSSProperties = {
  color: colorTokens.accent.muted,
  fontSize: typographyTokens.fontSize.xs,
};

const thCellStyle: CSSProperties = {
  textAlign: 'left',
  padding: spacingTokens['2'],
  whiteSpace: 'nowrap',
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  fontSize: typographyTokens.fontSize.xs,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: colorTokens.accent.muted,
};

const liveBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacingTokens['2'],
  padding: `${spacingTokens['1']} ${spacingTokens['3']}`,
  borderRadius: radiusTokens.pill,
  border: `1px solid rgba(16, 185, 129, 0.35)`,
  background: 'rgba(16, 185, 129, 0.12)',
  color: '#6EE7B7',
  fontFamily: typographyTokens.fontFamily.mono,
  fontSize: typographyTokens.fontSize.xs,
  letterSpacing: '0.04em',
};

const liveBadgeDotStyle: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: '#10B981',
  display: 'inline-block',
  boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.18)',
};

const metricCardStyle: CSSProperties = {
  border: `1px solid rgba(255, 255, 255, 0.12)`,
  borderRadius: radiusTokens.lg,
  padding: spacingTokens['4'],
  background: 'rgba(15, 23, 42, 0.55)',
  display: 'flex',
  flexDirection: 'column',
  gap: spacingTokens['2'],
};

const metricLabelStyle: CSSProperties = {
  margin: 0,
  fontSize: typographyTokens.fontSize.xs,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: colorTokens.accent.muted,
  fontWeight: typographyTokens.fontWeight.semibold,
};

const metricValueStyle: CSSProperties = {
  margin: 0,
  fontFamily: typographyTokens.fontFamily.sans,
  fontSize: '1.875rem',
  fontWeight: typographyTokens.fontWeight.bold,
  letterSpacing: '-0.01em',
  color: colorTokens.text.inverse,
  fontVariantNumeric: 'tabular-nums lining-nums',
};

const metricMetaStyle: CSSProperties = {
  margin: 0,
  fontFamily: typographyTokens.fontFamily.mono,
  fontSize: '0.6875rem',
  color: '#94A3B8',
  letterSpacing: '0.02em',
  lineHeight: 1.5,
};

const provenanceLinkStyle: CSSProperties = {
  color: '#93B5FF',
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
  fontFamily: typographyTokens.fontFamily.mono,
  fontSize: '0.6875rem',
};

function valueOrDash(value: string | null): string {
  return value && value.trim().length > 0 ? value : '—';
}

function HeadlineMetricCard({ metric, cikPadded }: { metric: HeadlineMetric; cikPadded: string }) {
  return (
    <article style={metricCardStyle}>
      <p style={metricLabelStyle}>{metric.label}</p>
      <p style={metricValueStyle}>
        {metric.valueUsd === null ? '—' : `$${formatUsdCompact(metric.valueUsd)}`}
      </p>
      <p style={metricMetaStyle}>
        {metric.fiscalYear !== null ? `FY ${metric.fiscalYear}` : 'no annual data'}
        {metric.form ? ` · ${metric.form}` : ''}
        {metric.concept ? ` · us-gaap:${metric.concept}` : ''}
      </p>
      {metric.accession ? (
        <p style={metricMetaStyle}>
          <span style={{ color: colorTokens.accent.muted }}>accession</span>{' '}
          <a
            href={metric.filingUrl ?? buildAccessionIndexUrl(cikPadded, metric.accession) ?? '#'}
            style={provenanceLinkStyle}
            target="_blank"
            rel="noopener noreferrer"
          >
            {metric.accession}
          </a>
          {metric.filedAt ? (
            <span style={{ color: colorTokens.accent.muted }}> · filed {metric.filedAt}</span>
          ) : null}
        </p>
      ) : null}
    </article>
  );
}

export default async function CompanyOverviewPage({ params }: CompanyPageProps): Promise<JSX.Element> {
  const { companyId: rawCompanyId } = await params;

  // Ticker → CIK resolution. /company/AAPL works the same as /company/0000320193.
  // Unknown tickers (alphabetic input not in our curated set) → 404, so we
  // don't forward "FOO" through to SEC's submissions API and surface a 502.
  let resolvedCompanyId = rawCompanyId;
  let resolvedTicker: string | null = null;
  if (isLikelyTicker(rawCompanyId)) {
    const issuer = findIssuerByTicker(rawCompanyId);
    if (!issuer) {
      notFound();
    }
    resolvedCompanyId = issuer.cik;
    resolvedTicker = issuer.ticker;
  }

  try {
    // Issuer metadata + filings come from the submissions feed (always
    // available). Headline fundamentals come from the companyfacts feed
    // (may 404 for issuers with no XBRL facts, e.g. recent IPOs / FPIs)
    // — we tolerate that and render the page without the metrics block.
    const [overview, fundamentals] = await Promise.all([
      getCompanyOverview(resolvedCompanyId),
      getHeadlineFundamentals(resolvedCompanyId),
    ]);

    const cikPadded = overview.issuerMetadata.cik.padStart(10, '0');
    const submissionsUrl = `https://data.sec.gov/submissions/CIK${cikPadded}.json`;
    const ticker = resolvedTicker ?? overview.issuerMetadata.ticker;

    return (
      <main style={shellStyle}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gap: spacingTokens['5'] }}>
          {/* Hero — issuer name, ticker, live badge */}
          <section style={cardStyle}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: spacingTokens['3'],
                justifyContent: 'space-between',
              }}
            >
              <div>
                <p style={eyebrowStyle}>Premium layout · live SEC data</p>
                <h1
                  style={{
                    margin: `${spacingTokens['3']} 0 ${spacingTokens['1']}`,
                    fontSize: typographyTokens.fontSize['3xl'],
                  }}
                >
                  {overview.issuerMetadata.name}
                </h1>
                <p style={{ margin: 0, color: '#CBD5E1', fontSize: typographyTokens.fontSize.sm }}>
                  {ticker ? (
                    <>
                      <span
                        style={{
                          fontFamily: typographyTokens.fontFamily.mono,
                          color: colorTokens.text.inverse,
                          fontWeight: typographyTokens.fontWeight.semibold,
                        }}
                      >
                        {ticker}
                      </span>{' '}
                      ·{' '}
                    </>
                  ) : null}
                  CIK {cikPadded}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: spacingTokens['2'] }}>
                <span style={liveBadgeStyle}>
                  <span aria-hidden="true" style={liveBadgeDotStyle} />
                  Live from SEC EDGAR
                </span>
                <a
                  href={submissionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={provenanceLinkStyle}
                >
                  view source feed →
                </a>
              </div>
            </div>
          </section>

          {/* Headline fundamentals — only when companyfacts returned something */}
          {fundamentals && fundamentals.metrics.some((m) => m.valueUsd !== null) ? (
            <section style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Headline fundamentals</h2>
              <p
                style={{
                  margin: `${spacingTokens['1']} 0 ${spacingTokens['4']}`,
                  color: colorTokens.accent.muted,
                  fontSize: typographyTokens.fontSize.sm,
                }}
              >
                Most-recent annual figures from SEC XBRL companyfacts. Each cell links to the filing
                that disclosed it.
              </p>
              <div
                style={{
                  display: 'grid',
                  gap: spacingTokens['3'],
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                }}
              >
                {fundamentals.metrics.map((metric) => (
                  <HeadlineMetricCard key={metric.label} metric={metric} cikPadded={cikPadded} />
                ))}
              </div>
            </section>
          ) : null}

          {/* Issuer metadata (test-pinned section) */}
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Issuer metadata</h2>
            <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacingTokens['3'] }}>
              <div>
                <dt style={dtMetaStyle}>Ticker</dt>
                <dd style={{ margin: 0 }}>{valueOrDash(overview.issuerMetadata.ticker)}</dd>
              </div>
              <div>
                <dt style={dtMetaStyle}>Exchange</dt>
                <dd style={{ margin: 0 }}>{valueOrDash(overview.issuerMetadata.exchange)}</dd>
              </div>
              <div>
                <dt style={dtMetaStyle}>SIC</dt>
                <dd style={{ margin: 0 }}>
                  {valueOrDash(overview.issuerMetadata.sic)} {overview.issuerMetadata.sicDescription ? `· ${overview.issuerMetadata.sicDescription}` : ''}
                </dd>
              </div>
              <div>
                <dt style={dtMetaStyle}>State of incorporation</dt>
                <dd style={{ margin: 0 }}>{valueOrDash(overview.issuerMetadata.stateOfIncorporation)}</dd>
              </div>
              <div>
                <dt style={dtMetaStyle}>Fiscal year end</dt>
                <dd style={{ margin: 0 }}>{valueOrDash(overview.issuerMetadata.fiscalYearEnd)}</dd>
              </div>
            </dl>
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Identity history summary</h2>
            {overview.identityHistorySummary.length === 0 ? (
              <p style={{ margin: 0, color: colorTokens.text.inverse }}>No historical identity names were returned by the SEC submissions payload.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: spacingTokens['2'] }}>
                {overview.identityHistorySummary.map((entry) => (
                  <li key={`${entry.name}-${entry.from ?? 'unknown'}`}>
                    <strong>{entry.name}</strong> ({entry.from ?? 'unknown'} → {entry.to ?? 'present'})
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Filing count summary</h2>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: spacingTokens['2'] }}>
              <li>Recent filings available: {overview.filingCountSummary.recentFilings}</li>
              <li>Unique forms: {overview.filingCountSummary.uniqueForms}</li>
              <li>Annual forms (10-K/20-F): {overview.filingCountSummary.annualFilings}</li>
              <li>Quarterly forms (10-Q): {overview.filingCountSummary.quarterlyFilings}</li>
              <li>Current reports (8-K/6-K): {overview.filingCountSummary.currentReportFilings}</li>
            </ul>
          </section>

          <GovernanceCards {...summarizeGovernance(overview)} />

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Latest filings summary</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colorTokens.border.strong}` }}>
                    <th style={thCellStyle}>Filing date</th>
                    <th style={thCellStyle}>Form</th>
                    <th style={thCellStyle}>Accession</th>
                    <th style={thCellStyle}>Primary document</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.latestFilingsSummary.map((filing) => {
                    const filingUrl = buildAccessionIndexUrl(cikPadded, filing.accessionNumber);
                    return (
                      <tr key={filing.accessionNumber} style={{ borderBottom: `1px solid ${colorTokens.border.strong}` }}>
                        <td style={{ padding: spacingTokens['2'] }}>{filing.filingDate}</td>
                        <td style={{ padding: spacingTokens['2'] }}>{filing.form}</td>
                        <td style={{ padding: spacingTokens['2'] }}>
                          {filingUrl ? (
                            <a
                              href={filingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={provenanceLinkStyle}
                            >
                              {filing.accessionNumber}
                            </a>
                          ) : (
                            filing.accessionNumber
                          )}
                        </td>
                        <td style={{ padding: spacingTokens['2'] }}>{filing.primaryDocDescription || filing.primaryDocument || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Provenance receipt — visible at page bottom */}
          <ProvenanceReceipt
            submissionsUrl={submissionsUrl}
            fundamentals={fundamentals}
          />
        </div>
      </main>
    );
  } catch (error) {
    return (
      <main style={shellStyle}>
        <section style={{ ...cardStyle, maxWidth: '840px', margin: '0 auto' }}>
          <h1 style={{ marginTop: 0 }}>Company overview unavailable</h1>
          <p style={{ margin: 0, color: colorTokens.text.inverse }}>
            Live backend fetch failed for company id <strong>{rawCompanyId}</strong>. Please retry once SEC submissions data is available.
          </p>
          <p style={{ marginTop: spacingTokens['3'], color: colorTokens.accent.muted, fontSize: typographyTokens.fontSize.xs }}>{String(error)}</p>
        </section>
      </main>
    );
  }
}

function ProvenanceReceipt({
  submissionsUrl,
  fundamentals,
}: {
  submissionsUrl: string;
  fundamentals: HeadlineFundamentals | null;
}) {
  return (
    <section
      aria-label="Provenance receipt"
      style={{
        ...cardStyle,
        background: 'rgba(0, 0, 0, 0.28)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }}
    >
      <h2 style={{ marginTop: 0 }}>Provenance receipt</h2>
      <p
        style={{
          margin: `${spacingTokens['1']} 0 ${spacingTokens['4']}`,
          color: colorTokens.accent.muted,
          fontSize: typographyTokens.fontSize.sm,
        }}
      >
        Every fact on this page is sourced from a public SEC EDGAR feed. The exact URLs and
        fetch timestamps below let you reproduce the view independently.
      </p>
      <dl
        style={{
          display: 'grid',
          gap: spacingTokens['3'],
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        <div>
          <dt style={dtMetaStyle}>Issuer + filings source</dt>
          <dd style={{ margin: 0 }}>
            <a href={submissionsUrl} target="_blank" rel="noopener noreferrer" style={provenanceLinkStyle}>
              {submissionsUrl}
            </a>
          </dd>
        </div>
        {fundamentals ? (
          <>
            <div>
              <dt style={dtMetaStyle}>Fundamentals source</dt>
              <dd style={{ margin: 0 }}>
                <a
                  href={fundamentals.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={provenanceLinkStyle}
                >
                  {fundamentals.sourceUrl}
                </a>
              </dd>
            </div>
            <div>
              <dt style={dtMetaStyle}>Fetched at</dt>
              <dd style={{ margin: 0, fontFamily: typographyTokens.fontFamily.mono, fontSize: typographyTokens.fontSize.xs }}>
                {fundamentals.fetchedAt}
              </dd>
            </div>
          </>
        ) : null}
      </dl>
    </section>
  );
}
