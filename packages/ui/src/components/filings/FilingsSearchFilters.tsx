import type { CSSProperties } from 'react';

type FilingsSearchFiltersProps = {
  issuer: string;
  formType: string;
  dateFrom: string;
  dateTo: string;
  accession: string;
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '12px',
};

const inputStyle: CSSProperties = {
  width: '100%',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  padding: '10px 12px',
  background: '#ffffff',
  color: '#111827',
  fontSize: '14px',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#4b5563',
  marginBottom: '6px',
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
};

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginTop: '12px',
};

const buttonStyle: CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: '999px',
  background: '#111827',
  color: '#f9fafb',
  padding: '8px 14px',
  fontSize: '13px',
  cursor: 'pointer',
};

const quietLinkButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: '#f8fafc',
  color: '#0f172a',
};

export function FilingsSearchFilters({ issuer, formType, dateFrom, dateTo, accession }: FilingsSearchFiltersProps) {
  return (
    <form action="/filings" method="GET" style={{ display: 'grid', gap: '12px' }}>
      <div style={gridStyle}>
        <label>
          <span style={labelStyle}>Issuer CIK</span>
          <input name="issuer" defaultValue={issuer} required style={inputStyle} placeholder="320193" />
        </label>

        <label>
          <span style={labelStyle}>Form type</span>
          <input name="formType" defaultValue={formType} style={inputStyle} placeholder="10-K, 10-Q" />
        </label>

        <label>
          <span style={labelStyle}>Date from</span>
          <input name="dateFrom" type="date" defaultValue={dateFrom} style={inputStyle} />
        </label>

        <label>
          <span style={labelStyle}>Date to</span>
          <input name="dateTo" type="date" defaultValue={dateTo} style={inputStyle} />
        </label>

        <label>
          <span style={labelStyle}>Accession</span>
          <input name="accession" defaultValue={accession} style={inputStyle} placeholder="0000320193-24-000123" />
        </label>
      </div>

      <div style={buttonRowStyle}>
        <button type="submit" style={buttonStyle}>Apply filters</button>
        <a href="/filings" style={{ ...quietLinkButtonStyle, textDecoration: 'none' }}>Reset</a>
      </div>
    </form>
  );
}
