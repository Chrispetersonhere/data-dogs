import type { CSSProperties, JSX } from 'react';

import { getCompanyOverview } from '../../../lib/api/company';

type CompanyPageProps = {
  params: Promise<{ companyId: string }>;
};

const shellStyle: CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(145deg, #0b1220 0%, #111827 45%, #1e293b 100%)',
  color: '#e5e7eb',
  fontFamily: 'Inter, system-ui, sans-serif',
  padding: '16px',
};

const cardStyle: CSSProperties = {
  border: '1px solid rgba(148, 163, 184, 0.35)',
  borderRadius: '16px',
  padding: '20px',
  background: 'rgba(15, 23, 42, 0.72)',
  boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
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
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gap: '20px' }}>
          <section style={cardStyle}>
            <p style={{ margin: 0, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a5b4fc' }}>
              Premium layout
            </p>
            <h1 style={{ margin: '10px 0 4px', fontSize: '32px' }}>{overview.issuerMetadata.name}</h1>
            <p style={{ margin: 0, color: '#cbd5e1' }}>Company overview for CIK {overview.issuerMetadata.cik}</p>
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Issuer metadata</h2>
            <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              <div>
                <dt style={{ color: '#94a3b8', fontSize: '12px' }}>Ticker</dt>
                <dd style={{ margin: 0 }}>{valueOrDash(overview.issuerMetadata.ticker)}</dd>
              </div>
              <div>
                <dt style={{ color: '#94a3b8', fontSize: '12px' }}>Exchange</dt>
                <dd style={{ margin: 0 }}>{valueOrDash(overview.issuerMetadata.exchange)}</dd>
              </div>
              <div>
                <dt style={{ color: '#94a3b8', fontSize: '12px' }}>SIC</dt>
                <dd style={{ margin: 0 }}>
                  {valueOrDash(overview.issuerMetadata.sic)} {overview.issuerMetadata.sicDescription ? `· ${overview.issuerMetadata.sicDescription}` : ''}
                </dd>
              </div>
              <div>
                <dt style={{ color: '#94a3b8', fontSize: '12px' }}>State of incorporation</dt>
                <dd style={{ margin: 0 }}>{valueOrDash(overview.issuerMetadata.stateOfIncorporation)}</dd>
              </div>
              <div>
                <dt style={{ color: '#94a3b8', fontSize: '12px' }}>Fiscal year end</dt>
                <dd style={{ margin: 0 }}>{valueOrDash(overview.issuerMetadata.fiscalYearEnd)}</dd>
              </div>
            </dl>
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Identity history summary</h2>
            {overview.identityHistorySummary.length === 0 ? (
              <p style={{ margin: 0, color: '#cbd5e1' }}>No historical identity names were returned by the SEC submissions payload.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '8px' }}>
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
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '8px' }}>
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
                  <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.35)' }}>
                    <th style={{ textAlign: 'left', padding: '8px', whiteSpace: 'nowrap' }}>Filing date</th>
                    <th style={{ textAlign: 'left', padding: '8px', whiteSpace: 'nowrap' }}>Form</th>
                    <th style={{ textAlign: 'left', padding: '8px', whiteSpace: 'nowrap' }}>Accession</th>
                    <th style={{ textAlign: 'left', padding: '8px', whiteSpace: 'nowrap' }}>Primary document</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.latestFilingsSummary.map((filing) => (
                    <tr key={filing.accessionNumber} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.2)' }}>
                      <td style={{ padding: '8px' }}>{filing.filingDate}</td>
                      <td style={{ padding: '8px' }}>{filing.form}</td>
                      <td style={{ padding: '8px' }}>{filing.accessionNumber}</td>
                      <td style={{ padding: '8px' }}>{filing.primaryDocDescription || filing.primaryDocument || '—'}</td>
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
          <p style={{ margin: 0, color: '#cbd5e1' }}>
            Live backend fetch failed for company id <strong>{companyId}</strong>. Please retry once SEC submissions data is available.
          </p>
          <p style={{ marginTop: '10px', color: '#94a3b8', fontSize: '12px' }}>{String(error)}</p>
        </section>
      </main>
    );
  }
}
