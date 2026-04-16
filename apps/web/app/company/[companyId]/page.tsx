import type { CSSProperties, JSX } from 'react';

import { colorTokens, spacingTokens, typographyTokens, radiusTokens } from '../../../../../packages/ui/src/styles/tokens';
import { getCompanyOverview } from '../../../lib/api/company';

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

function valueOrDash(value: string | null): string {
  return value && value.trim().length > 0 ? value : '—';
}

export default async function CompanyOverviewPage({ params }: CompanyPageProps): Promise<JSX.Element> {
  const { companyId } = await params;

  try {
    const overview = await getCompanyOverview(companyId);

    return (
      <main style={shellStyle}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gap: spacingTokens['5'] }}>
          <section style={cardStyle}>
            <p style={{ margin: 0, fontSize: typographyTokens.fontSize.xs, letterSpacing: '0.08em', textTransform: 'uppercase', color: colorTokens.accent.muted }}>
              Premium layout
            </p>
            <h1 style={{ margin: `${spacingTokens['3']} 0 ${spacingTokens['1']}`, fontSize: typographyTokens.fontSize['3xl'] }}>{overview.issuerMetadata.name}</h1>
            <p style={{ margin: 0, color: colorTokens.text.inverse }}>Company overview for CIK {overview.issuerMetadata.cik}</p>
          </section>

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
                  {overview.latestFilingsSummary.map((filing) => (
                    <tr key={filing.accessionNumber} style={{ borderBottom: `1px solid ${colorTokens.border.strong}` }}>
                      <td style={{ padding: spacingTokens['2'] }}>{filing.filingDate}</td>
                      <td style={{ padding: spacingTokens['2'] }}>{filing.form}</td>
                      <td style={{ padding: spacingTokens['2'] }}>{filing.accessionNumber}</td>
                      <td style={{ padding: spacingTokens['2'] }}>{filing.primaryDocDescription || filing.primaryDocument || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    );
  } catch (error) {
    return (
      <main style={shellStyle}>
        <section style={{ ...cardStyle, maxWidth: '840px', margin: '0 auto' }}>
          <h1 style={{ marginTop: 0 }}>Company overview unavailable</h1>
          <p style={{ margin: 0, color: colorTokens.text.inverse }}>
            Live backend fetch failed for company id <strong>{companyId}</strong>. Please retry once SEC submissions data is available.
          </p>
          <p style={{ marginTop: spacingTokens['3'], color: colorTokens.accent.muted, fontSize: typographyTokens.fontSize.xs }}>{String(error)}</p>
        </section>
      </main>
    );
  }
}
