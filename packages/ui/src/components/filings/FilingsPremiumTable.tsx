import type { CSSProperties } from 'react';

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
    return <p style={{ margin: 0, color: '#6b7280' }}>No filings matched this filter set.</p>;
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
                <td style={{ ...bodyCellStyle, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{filing.accession}</td>
                <td style={bodyCellStyle}>{filing.primaryDocDescription || filing.primaryDocument || 'Document link only'}</td>
                <td style={bodyCellStyle}>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
