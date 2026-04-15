import type { CSSProperties } from 'react';

import { queryFilingDetail } from '../../../lib/api/filing-detail';

type FilingDetailPageProps = {
  params: Promise<{ accession: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
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

function firstValue(value: string | string[] | undefined): string {
  if (!value) {
    return '';
  }
  return Array.isArray(value) ? value[0] ?? '' : value;
}

export default async function FilingDetailPage({ params, searchParams }: FilingDetailPageProps) {
  const resolvedParams = await params;
  const resolvedSearch = (await searchParams) ?? {};
  const issuer = firstValue(resolvedSearch.issuer) || '320193';

  const detail = await queryFilingDetail({
    issuer,
    accession: resolvedParams.accession,
  });

  return (
    <main style={shellStyle}>
      <section style={{ maxWidth: '1120px', margin: '0 auto', display: 'grid', gap: '14px' }}>
        <header style={cardStyle}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Filing detail</p>
          <h1 style={{ margin: '6px 0 10px', fontSize: '30px' }}>{detail.metadata.accession}</h1>
          <p style={{ margin: 0, color: '#334155' }}>
            Traceable filing detail view sourced from SEC submissions plus filing index directory artifacts.
          </p>
        </header>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Filing metadata</h2>
          <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.7 }}>
            <li>Issuer CIK: {detail.metadata.issuerCik}</li>
            <li>Form type: {detail.metadata.formType}</li>
            <li>Filing date: {detail.metadata.filingDate}</li>
            <li>Primary document: {detail.metadata.primaryDocDescription || detail.metadata.primaryDocument || '—'}</li>
            <li>Acceptance timestamp: {detail.metadata.acceptanceDateTime || '—'}</li>
            <li>Report date: {detail.metadata.reportDate || '—'}</li>
            <li>File number: {detail.metadata.fileNumber || '—'}</li>
            <li>Film number: {detail.metadata.filmNumber || '—'}</li>
          </ul>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Linked documents</h2>
          {detail.linkedDocuments.length === 0 ? (
            <p style={{ margin: 0, color: '#6b7280' }}>No linked documents were present in SEC index.json.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.7 }}>
              {detail.linkedDocuments.map((document) => (
                <li key={document.href}>
                  <a href={document.href} target="_blank" rel="noreferrer">
                    {document.name}
                  </a>{' '}
                  <span style={{ color: '#64748b' }}>
                    ({document.size ?? 0} bytes{document.lastModified ? ` • ${document.lastModified}` : ''})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Provenance summary</h2>
          <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.7 }}>
            <li>
              SEC submissions source:{' '}
              <a href={detail.provenance.submissionsUrl} target="_blank" rel="noreferrer">
                CIK submissions JSON
              </a>
            </li>
            <li>
              Filing index source:{' '}
              <a href={detail.provenance.filingIndexJsonUrl} target="_blank" rel="noreferrer">
                filing index.json
              </a>{' '}
              /{' '}
              <a href={detail.provenance.filingIndexHtmlUrl} target="_blank" rel="noreferrer">
                filing index html
              </a>
            </li>
            <li>Matched array index in filings.recent: {detail.provenance.matchedRecentIndex}</li>
            <li>Extracted fields: {detail.provenance.extractedFields.join(', ')}</li>
          </ul>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Available sections (if present)</h2>
          {detail.availableSections.length === 0 ? (
            <p style={{ margin: 0, color: '#6b7280' }}>No structured sections were published for this filing.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.7 }}>
              {detail.availableSections.map((section) => (
                <li key={section}>{section}</li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}
