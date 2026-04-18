import type { CSSProperties, JSX } from 'react';

import { colorTokens, spacingTokens, typographyTokens, radiusTokens } from '../../../../../../packages/ui/src/styles/tokens';
import { getCompanyCompensation } from '../../../../lib/api/compensation';

type CompensationPageProps = {
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

const thCellStyle: CSSProperties = {
  textAlign: 'left',
  padding: spacingTokens['2'],
  whiteSpace: 'nowrap',
};

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function CompanyCompensationPage({ params }: CompensationPageProps): Promise<JSX.Element> {
  const { companyId } = await params;

  try {
    const compensation = await getCompanyCompensation(companyId);

    return (
      <main style={shellStyle}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gap: spacingTokens['5'] }}>
          <section style={cardStyle}>
            <p style={{ margin: 0, fontSize: typographyTokens.fontSize.xs, letterSpacing: '0.08em', textTransform: 'uppercase', color: colorTokens.accent.muted }}>
              Premium layout
            </p>
            <h1 style={{ margin: `${spacingTokens['3']} 0 ${spacingTokens['1']}`, fontSize: typographyTokens.fontSize['3xl'] }}>
              Executive compensation — {compensation.companyName}
            </h1>
            <p style={{ margin: 0, color: colorTokens.text.inverse }}>
              Real DEF 14A filing disclosures for CIK {compensation.cik}
            </p>
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Executive table</h2>
            {compensation.rows.length === 0 ? (
              <p style={{ margin: 0 }}>
                No usable executive compensation rows were parsed from recent DEF 14A filings. Check source links below.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colorTokens.border.strong}` }}>
                      <th style={thCellStyle}>Executive</th>
                      <th style={thCellStyle}>Title</th>
                      <th style={thCellStyle}>Fiscal year</th>
                      <th style={thCellStyle}>Total compensation (USD)</th>
                      <th style={thCellStyle}>Filing date</th>
                      <th style={thCellStyle}>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compensation.rows.map((row) => (
                      <tr key={`${row.executiveName}-${row.fiscalYear}-${row.accession}-${row.totalCompensationUsd}`} style={{ borderBottom: `1px solid ${colorTokens.border.strong}` }}>
                        <td style={{ padding: spacingTokens['2'] }}>{row.executiveName}</td>
                        <td style={{ padding: spacingTokens['2'] }}>{row.title}</td>
                        <td style={{ padding: spacingTokens['2'] }}>{row.fiscalYear}</td>
                        <td style={{ padding: spacingTokens['2'] }}>{formatUsd(row.totalCompensationUsd)}</td>
                        <td style={{ padding: spacingTokens['2'] }}>{row.filingDate}</td>
                        <td style={{ padding: spacingTokens['2'] }}>
                          <a href={row.sourceUrl} target="_blank" rel="noreferrer" style={{ color: colorTokens.accent.primary }}>
                            {row.accession}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Total comp history</h2>
            {compensation.history.length === 0 ? (
              <p style={{ margin: 0 }}>No total compensation history could be derived from recent DEF 14A filings.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colorTokens.border.strong}` }}>
                      <th style={thCellStyle}>Executive</th>
                      <th style={thCellStyle}>Fiscal year</th>
                      <th style={thCellStyle}>Total compensation (USD)</th>
                      <th style={thCellStyle}>Source link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compensation.history.map((row) => (
                      <tr key={`${row.executiveName}-${row.fiscalYear}-${row.totalCompensationUsd}`} style={{ borderBottom: `1px solid ${colorTokens.border.strong}` }}>
                        <td style={{ padding: spacingTokens['2'] }}>{row.executiveName}</td>
                        <td style={{ padding: spacingTokens['2'] }}>{row.fiscalYear}</td>
                        <td style={{ padding: spacingTokens['2'] }}>{formatUsd(row.totalCompensationUsd)}</td>
                        <td style={{ padding: spacingTokens['2'] }}>
                          <a href={row.latestSourceUrl} target="_blank" rel="noreferrer" style={{ color: colorTokens.accent.primary }}>
                            source link
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Source links</h2>
            {compensation.sources.length === 0 ? (
              <p style={{ margin: 0 }}>No recent DEF 14A source filings were found.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: spacingTokens['2'] }}>
                {compensation.sources.map((source) => (
                  <li key={source.accession}>
                    {source.filingDate} · {source.form} ·{' '}
                    <a href={source.sourceUrl} target="_blank" rel="noreferrer" style={{ color: colorTokens.accent.primary }}>
                      {source.accession}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    );
  } catch (error) {
    return (
      <main style={shellStyle}>
        <section style={{ ...cardStyle, maxWidth: '860px', margin: '0 auto' }}>
          <h1 style={{ marginTop: 0 }}>Compensation page unavailable</h1>
          <p style={{ margin: 0 }}>
            Live compensation data fetch failed for company id <strong>{companyId}</strong>. Please retry once SEC filings are reachable.
          </p>
          <p style={{ marginTop: spacingTokens['3'], color: colorTokens.accent.muted, fontSize: typographyTokens.fontSize.xs }}>{String(error)}</p>
        </section>
      </main>
    );
  }
}
