import type { CSSProperties } from 'react';

import { colorTokens, spacingTokens, typographyTokens, radiusTokens } from '../../../../packages/ui/src/styles/tokens';
import { queryFilings } from '../../lib/api/filings';
import { FilingsPremiumTable, FilingsSearchFilters } from '../../../../packages/ui/src/components/filings';

type FilingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
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
      <section style={{ maxWidth: '1180px', margin: '0 auto', display: 'grid', gap: spacingTokens['4'] }}>
        <header style={cardStyle}>
          <p style={{ margin: 0, color: colorTokens.text.muted, fontSize: typographyTokens.fontSize.sm }}>Premium layout • filing explorer UI</p>
          <h1 style={{ margin: `${spacingTokens['2']} 0 ${spacingTokens['3']}`, fontSize: typographyTokens.fontSize['3xl'] }}>Filing explorer</h1>
          <p style={{ margin: 0, color: colorTokens.text.secondary, maxWidth: '68ch' }}>
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
          <p style={{ marginTop: 0, color: colorTokens.text.muted }}>
            Showing {result.filings.length} filing(s) for issuer CIK {result.issuerCik}.
          </p>
          <FilingsPremiumTable issuerCik={result.issuerCik} filings={result.filings} />
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Drilldown links</h2>
          <ul style={{ margin: 0, paddingLeft: '18px', color: colorTokens.text.primary }}>
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

        <section style={{ ...cardStyle, color: colorTokens.text.muted }}>
          <h2 style={{ marginTop: 0, color: colorTokens.text.primary }}>Responsive layout</h2>
          <p style={{ margin: 0 }}>
            Filters collapse into auto-fit columns on smaller screens and the table keeps horizontal scroll for dense filing metadata.
          </p>
        </section>
      </section>
    </main>
  );
}
