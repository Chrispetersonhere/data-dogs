import type { CSSProperties } from 'react';

import { colorTokens, spacingTokens, typographyTokens, radiusTokens } from '../../styles/tokens';

type FilingsSearchFiltersProps = {
  issuer: string;
  formType: string;
  dateFrom: string;
  dateTo: string;
  accession: string;
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: spacingTokens['3'],
};

const inputStyle: CSSProperties = {
  width: '100%',
  border: `1px solid ${colorTokens.border.subtle}`,
  borderRadius: radiusTokens.md,
  padding: `${spacingTokens['3']} ${spacingTokens['3']}`,
  background: colorTokens.surface.card,
  color: colorTokens.text.primary,
  fontSize: typographyTokens.fontSize.sm,
  boxSizing: 'border-box',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: typographyTokens.fontSize.xs,
  fontWeight: typographyTokens.fontWeight.semibold,
  color: colorTokens.text.secondary,
  marginBottom: spacingTokens['2'],
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
};

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacingTokens['2'],
  marginTop: spacingTokens['3'],
};

const buttonStyle: CSSProperties = {
  border: `1px solid ${colorTokens.border.subtle}`,
  borderRadius: radiusTokens.pill,
  background: colorTokens.surface.inverse,
  color: colorTokens.text.inverse,
  padding: `${spacingTokens['2']} ${spacingTokens['4']}`,
  fontSize: typographyTokens.fontSize.sm,
  cursor: 'pointer',
};

const quietLinkButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: colorTokens.surface.page,
  color: colorTokens.text.primary,
};

export function FilingsSearchFilters({ issuer, formType, dateFrom, dateTo, accession }: FilingsSearchFiltersProps) {
  return (
    <form action="/filings" method="GET" style={{ display: 'grid', gap: spacingTokens['3'] }}>
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
