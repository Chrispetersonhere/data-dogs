import type { CSSProperties } from 'react';

import { colorTokens, spacingTokens, typographyTokens } from '../../styles/tokens';

type FilingRecord = {
  issuerCik: string;
  accession: string;
  filingDate: string;
  formType: string;
  primaryDocument: string;
  primaryDocDescription: string;
};

type FilingsPremiumTableProps = {
  issuerCik: string;
  filings: FilingRecord[];
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: '760px',
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

function buildFilingIndexLink(issuerCik: string, accession: string): string {
  const cikNumber = Number.parseInt(issuerCik, 10).toString();
  const accessionCompact = accession.replace(/-/g, '');
  return `https://www.sec.gov/Archives/edgar/data/${cikNumber}/${accessionCompact}/${accession}-index.html`;
}

function buildPrimaryDocumentLink(issuerCik: string, accession: string, primaryDocument: string): string {
  if (!primaryDocument) {
    return buildFilingIndexLink(issuerCik, accession);
  }
  const cikNumber = Number.parseInt(issuerCik, 10).toString();
  const accessionCompact = accession.replace(/-/g, '');
  return `https://www.sec.gov/Archives/edgar/data/${cikNumber}/${accessionCompact}/${primaryDocument}`;
}

export function FilingsPremiumTable({ issuerCik, filings }: FilingsPremiumTableProps) {
  if (filings.length === 0) {
    return <p style={{ margin: 0, color: colorTokens.text.muted }}>No filings matched this filter set.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={headCellStyle}>Filing date</th>
            <th style={headCellStyle}>Form</th>
            <th style={headCellStyle}>Accession</th>
            <th style={headCellStyle}>Primary document</th>
            <th style={headCellStyle}>Drilldown links</th>
          </tr>
        </thead>
        <tbody>
          {filings.map((filing) => {
            const filingIndex = buildFilingIndexLink(issuerCik, filing.accession);
            const primaryDoc = buildPrimaryDocumentLink(issuerCik, filing.accession, filing.primaryDocument);

            return (
              <tr key={filing.accession}>
                <td style={bodyCellStyle}>{filing.filingDate}</td>
                <td style={bodyCellStyle}>{filing.formType}</td>
                <td style={{ ...bodyCellStyle, fontFamily: typographyTokens.fontFamily.mono }}>{filing.accession}</td>
                <td style={bodyCellStyle}>{filing.primaryDocDescription || filing.primaryDocument || 'Document link only'}</td>
                <td style={bodyCellStyle}>
                  <div style={{ display: 'flex', gap: spacingTokens['3'], flexWrap: 'wrap' }}>
                    <a href={filingIndex} target="_blank" rel="noreferrer">Filing index</a>
                    <a href={primaryDoc} target="_blank" rel="noreferrer">Primary doc</a>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
