import type { CSSProperties, JSX } from 'react';

import Link from 'next/link';

import { colorTokens, spacingTokens, typographyTokens, radiusTokens } from '../../../../../packages/ui/src/styles/tokens';
import { getFilingDetail } from '../../../lib/api/filing-detail';

type FilingDetailPageProps = {
  params: Promise<{ accession: string }>;
};

const shellStyle: CSSProperties = {
  minHeight: '100vh',
  background: colorTokens.surface.page,
  color: colorTokens.text.primary,
  fontFamily: typographyTokens.fontFamily.sans,
  padding: spacingTokens['5'],
};

const cardStyle: CSSProperties = {
  border: `1px solid ${colorTokens.border.subtle}`,
  borderRadius: radiusTokens.lg,
  background: colorTokens.surface.card,
  padding: spacingTokens['4'],
};

const headCellStyle: CSSProperties = {
  textAlign: 'left',
  fontSize: typographyTokens.fontSize.xs,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
  color: colorTokens.text.muted,
  borderBottom: `1px solid ${colorTokens.border.subtle}`,
  padding: `${spacingTokens['3']} ${spacingTokens['3']}`,
};

const bodyCellStyle: CSSProperties = {
  fontSize: typographyTokens.fontSize.sm,
  color: colorTokens.text.primary,
  borderBottom: `1px solid ${colorTokens.accent.soft}`,
  padding: spacingTokens['3'],
  verticalAlign: 'top',
};

const dtStyle: CSSProperties = {
  color: colorTokens.text.muted,
  fontSize: typographyTokens.fontSize.xs,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

function valueOrDash(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value : '—';
}

export default async function FilingDetailPage({ params }: FilingDetailPageProps): Promise<JSX.Element> {
  const { accession } = await params;

  try {
    const detail = await getFilingDetail(decodeURIComponent(accession));

    return (
      <main style={shellStyle}>
        <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'grid', gap: spacingTokens['4'] }}>
          {/* Header */}
          <section style={cardStyle}>
            <p style={{ margin: 0, color: colorTokens.text.muted, fontSize: typographyTokens.fontSize.sm }}>Filing detail • source traceability</p>
            <h1 style={{ margin: `${spacingTokens['2']} 0 ${spacingTokens['3']}`, fontSize: typographyTokens.fontSize['3xl'] }}>Filing detail</h1>
            <p style={{ margin: 0, color: colorTokens.text.secondary, maxWidth: '68ch' }}>
              Detailed view of filing <strong>{detail.accession}</strong> for{' '}
              <strong>{detail.issuerName}</strong> (CIK {detail.issuerCik}).
            </p>
          </section>

          {/* Filing metadata */}
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Filing metadata</h2>
            <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacingTokens['3'], margin: 0 }}>
              <div>
                <dt style={dtStyle}>Accession</dt>
                <dd style={{ margin: 0, fontFamily: typographyTokens.fontFamily.mono }}>{detail.accession}</dd>
              </div>
              <div>
                <dt style={dtStyle}>Form type</dt>
                <dd style={{ margin: 0 }}>{detail.formType}</dd>
              </div>
              <div>
                <dt style={dtStyle}>Filing date</dt>
                <dd style={{ margin: 0 }}>{detail.filingDate}</dd>
              </div>
              <div>
                <dt style={dtStyle}>Acceptance date/time</dt>
                <dd style={{ margin: 0 }}>{valueOrDash(detail.acceptanceDateTime)}</dd>
              </div>
              <div>
                <dt style={dtStyle}>Issuer</dt>
                <dd style={{ margin: 0 }}>{detail.issuerName}</dd>
              </div>
              <div>
                <dt style={dtStyle}>CIK</dt>
                <dd style={{ margin: 0 }}>{detail.issuerCik}</dd>
              </div>
              <div>
                <dt style={dtStyle}>Primary document</dt>
                <dd style={{ margin: 0 }}>{valueOrDash(detail.primaryDocDescription || detail.primaryDocument)}</dd>
              </div>
            </dl>
          </section>

          {/* Linked documents */}
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Linked documents</h2>
            {detail.documents.length === 0 ? (
              <p style={{ margin: 0, color: colorTokens.text.muted }}>No linked documents available from the filing index.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                  <thead>
                    <tr>
                      <th style={headCellStyle}>Filename</th>
                      <th style={headCellStyle}>Description</th>
                      <th style={headCellStyle}>Type</th>
                      <th style={headCellStyle}>Size</th>
                      <th style={headCellStyle}>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.documents.map((doc) => (
                      <tr key={doc.filename}>
                        <td style={{ ...bodyCellStyle, fontFamily: typographyTokens.fontFamily.mono }}>{doc.filename}</td>
                        <td style={bodyCellStyle}>{doc.description || '—'}</td>
                        <td style={bodyCellStyle}>{doc.type || '—'}</td>
                        <td style={bodyCellStyle}>{doc.size || '—'}</td>
                        <td style={bodyCellStyle}>
                          <a href={doc.url} target="_blank" rel="noreferrer">View source</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Provenance summary */}
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Provenance summary</h2>
            <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: spacingTokens['3'], margin: 0 }}>
              <div>
                <dt style={dtStyle}>Source URL</dt>
                <dd style={{ margin: 0 }}>
                  <a href={detail.provenance.sourceUrl} target="_blank" rel="noreferrer">{detail.provenance.sourceUrl}</a>
                </dd>
              </div>
              <div>
                <dt style={dtStyle}>Fetched via</dt>
                <dd style={{ margin: 0 }}>{detail.provenance.fetchedVia}</dd>
              </div>
              <div>
                <dt style={dtStyle}>Filing index</dt>
                <dd style={{ margin: 0 }}>
                  <a href={detail.provenance.filingIndexUrl} target="_blank" rel="noreferrer">Raw source</a>
                </dd>
              </div>
            </dl>
          </section>

          {/* Available sections */}
          {detail.sections.length > 0 && (
            <section style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Available sections</h2>
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: spacingTokens['2'] }}>
                {detail.sections.map((section) => (
                  <li key={section.anchor}>
                    <strong>{section.name}</strong>{' '}
                    <span style={{ color: colorTokens.accent.muted, fontSize: typographyTokens.fontSize.xs }}>#{section.anchor}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Raw-source drilldown */}
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Raw-source drilldown</h2>
            <ul style={{ margin: 0, paddingLeft: '18px', color: colorTokens.text.primary }}>
              <li>
                <a href={detail.provenance.filingIndexUrl} target="_blank" rel="noreferrer">
                  SEC filing index page
                </a>
              </li>
              <li>
                <a href={detail.provenance.sourceUrl} target="_blank" rel="noreferrer">
                  SEC submissions JSON
                </a>
              </li>
              <li>
                <Link href="/filings">
                  ← Back to filing explorer
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </main>
    );
  } catch (error) {
    return (
      <main style={shellStyle}>
        <section style={{ ...cardStyle, maxWidth: '840px', margin: '0 auto' }}>
          <h1 style={{ marginTop: 0 }}>Filing detail unavailable</h1>
          <p style={{ margin: 0, color: colorTokens.text.secondary }}>
            Could not load filing detail for accession <strong>{decodeURIComponent(accession)}</strong>.
            Please verify the accession number and retry once SEC data is available.
          </p>
          <p style={{ marginTop: spacingTokens['3'], color: colorTokens.text.muted, fontSize: typographyTokens.fontSize.xs }}>{String(error)}</p>
          <p style={{ marginTop: spacingTokens['3'] }}>
            <Link href="/filings">← Back to filing explorer</Link>
          </p>
        </section>
      </main>
    );
  }
}
