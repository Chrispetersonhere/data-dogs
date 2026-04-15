import type { CSSProperties } from 'react';

import { queryFilings } from '../../lib/api/filings';
import { FilingsPremiumTable, FilingsSearchFilters } from '../../../../packages/ui/src/components/filings';

type FilingsPageProps = {
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

export default async function FilingsPage({ searchParams }: FilingsPageProps) {
  const resolved = (await searchParams) ?? {};
  const issuer = firstValue(resolved.issuer) || '320193';
  const formType = firstValue(resolved.formType);
  const dateFrom = firstValue(resolved.dateFrom);
  const dateTo = firstValue(resolved.dateTo);
  const accession = firstValue(resolved.accession);

  const result = await queryFilings({
    issuer,
    formType: formType || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    accession: accession || undefined,
  });

  return (
    <main style={shellStyle}>
      <section style={{ maxWidth: '1180px', margin: '0 auto', display: 'grid', gap: '14px' }}>
        <header style={cardStyle}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Premium layout • filing explorer UI</p>
          <h1 style={{ margin: '6px 0 10px', fontSize: '32px' }}>Filing explorer</h1>
          <p style={{ margin: 0, color: '#334155', maxWidth: '68ch' }}>
            Search filters with real SEC submissions data, a quiet premium table presentation, and filing drilldowns for detail pages.
          </p>
        </header>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Search filters</h2>
          <FilingsSearchFilters
            issuer={issuer}
            formType={formType}
            dateFrom={dateFrom}
            dateTo={dateTo}
            accession={accession}
          />
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Quiet premium table</h2>
          <p style={{ marginTop: 0, color: '#64748b' }}>
            Showing {result.filings.length} filing(s) for issuer CIK {result.issuerCik}.
          </p>
          <FilingsPremiumTable issuerCik={result.issuerCik} filings={result.filings} />
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Drilldown links</h2>
          <ul style={{ margin: 0, paddingLeft: '18px', color: '#1f2937' }}>
            <li>
              <a href={`https://data.sec.gov/submissions/CIK${result.issuerCik}.json`} target="_blank" rel="noreferrer">
                SEC submissions JSON
              </a>
            </li>
            <li>
              Use each row&apos;s filing index and primary doc links to drill into source materials.
            </li>
          </ul>
        </section>

        <section style={{ ...cardStyle, color: '#64748b' }}>
          <h2 style={{ marginTop: 0, color: '#0f172a' }}>Responsive layout</h2>
          <p style={{ margin: 0 }}>
            Filters collapse into auto-fit columns on smaller screens and the table keeps horizontal scroll for dense filing metadata.
          </p>
        </section>
      </section>
    </main>
  );
}
