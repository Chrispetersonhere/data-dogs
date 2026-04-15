import type { CSSProperties, JSX } from 'react';

import Link from 'next/link';

import { getFilingDetail } from '../../../lib/api/filing-detail';

type FilingDetailPageProps = {
  params: Promise<{ accession: string }>;
};

const shellStyle: CSSProperties = {
  minHeight: '100vh',
  background: '#f8fafc',
  color: '#0f172a',
  fontFamily: 'Inter, system-ui, sans-serif',
  padding: '20px',
};

const cardStyle: CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: '14px',
  background: '#ffffff',
  padding: '16px',
};

const headCellStyle: CSSProperties = {
  textAlign: 'left',
  fontSize: '12px',
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
  color: '#6b7280',
  borderBottom: '1px solid #e5e7eb',
  padding: '10px 12px',
};

const bodyCellStyle: CSSProperties = {
  fontSize: '14px',
  color: '#111827',
  borderBottom: '1px solid #f1f5f9',
  padding: '12px',
  verticalAlign: 'top',
};

const dtStyle: CSSProperties = {
  color: '#64748b',
  fontSize: '12px',
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
        <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'grid', gap: '14px' }}>
          {/* Header */}
          <section style={cardStyle}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Filing detail • source traceability</p>
            <h1 style={{ margin: '6px 0 10px', fontSize: '32px' }}>Filing detail</h1>
            <p style={{ margin: 0, color: '#334155', maxWidth: '68ch' }}>
              Detailed view of filing <strong>{detail.accession}</strong> for{' '}
              <strong>{detail.issuerName}</strong> (CIK {detail.issuerCik}).
            </p>
          </section>

          {/* Filing metadata */}
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Filing metadata</h2>
            <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', margin: 0 }}>
              <div>
                <dt style={dtStyle}>Accession</dt>
                <dd style={{ margin: 0, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{detail.accession}</dd>
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
              <p style={{ margin: 0, color: '#64748b' }}>No linked documents available from the filing index.</p>
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
                        <td style={{ ...bodyCellStyle, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{doc.filename}</td>
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
            <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', margin: 0 }}>
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
              <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '6px' }}>
                {detail.sections.map((section) => (
                  <li key={section.anchor}>
                    <strong>{section.name}</strong>{' '}
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>#{section.anchor}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Raw-source drilldown */}
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Raw-source drilldown</h2>
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#1f2937' }}>
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
                <Link href="/filings" style={{ color: '#2563eb' }}>
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
          <p style={{ margin: 0, color: '#334155' }}>
            Could not load filing detail for accession <strong>{decodeURIComponent(accession)}</strong>.
            Please verify the accession number and retry once SEC data is available.
          </p>
          <p style={{ marginTop: '10px', color: '#94a3b8', fontSize: '12px' }}>{String(error)}</p>
          <p style={{ marginTop: '10px' }}>
            <Link href="/filings" style={{ color: '#2563eb' }}>← Back to filing explorer</Link>
          </p>
        </section>
      </main>
    );
  }
}
