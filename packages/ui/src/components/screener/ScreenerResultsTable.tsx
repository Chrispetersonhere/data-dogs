import type { CSSProperties } from 'react';

import { colorTokens, spacingTokens, typographyTokens } from '../../styles/tokens';

type ScreenerResultRow = {
  companyId: string;
  ticker: string | null;
  name: string;
  marketCap: number | null;
  revenue: number | null;
  grossMargin: number | null;
  netMargin: number | null;
  revenueGrowth: number | null;
  currentRatio: number | null;
};

type ScreenerResultsTableProps = {
  rows: ScreenerResultRow[];
  totalMatched: number;
};

const wrapperStyle: CSSProperties = {
  overflowX: 'auto',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: '720px',
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

const numericHeadStyle: CSSProperties = {
  ...headCellStyle,
  textAlign: 'right',
};

const bodyCellStyle: CSSProperties = {
  fontSize: typographyTokens.fontSize.sm,
  color: colorTokens.text.primary,
  borderBottom: `1px solid ${colorTokens.accent.soft}`,
  padding: spacingTokens['3'],
  verticalAlign: 'top',
};

const numericBodyStyle: CSSProperties = {
  ...bodyCellStyle,
  textAlign: 'right',
  fontFamily: typographyTokens.fontFamily.mono,
  fontSize: typographyTokens.fontSize.sm,
};

function formatLargeNumber(value: number | null): string {
  if (value === null) return '—';
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${value.toLocaleString()}`;
}

function formatPercent(value: number | null): string {
  if (value === null) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

function formatRatio(value: number | null): string {
  if (value === null) return '—';
  return value.toFixed(2);
}

export function ScreenerResultsTable({ rows, totalMatched }: ScreenerResultsTableProps) {
  if (rows.length === 0) {
    return (
      <p style={{ margin: 0, color: colorTokens.text.muted }}>
        No companies matched the current filters.
      </p>
    );
  }

  return (
    <div style={wrapperStyle}>
      {totalMatched > rows.length ? (
        <p style={{ margin: `0 0 ${spacingTokens['2']}`, color: colorTokens.text.muted, fontSize: typographyTokens.fontSize.sm }}>
          Showing {rows.length} of {totalMatched} results.
        </p>
      ) : null}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={headCellStyle}>Ticker</th>
            <th style={headCellStyle}>Company</th>
            <th style={numericHeadStyle}>Market cap</th>
            <th style={numericHeadStyle}>Revenue</th>
            <th style={numericHeadStyle}>Gross margin</th>
            <th style={numericHeadStyle}>Net margin</th>
            <th style={numericHeadStyle}>Rev growth</th>
            <th style={numericHeadStyle}>Current ratio</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.companyId}>
              <td style={{ ...bodyCellStyle, fontWeight: typographyTokens.fontWeight.semibold }}>
                {row.ticker ?? '—'}
              </td>
              <td style={bodyCellStyle}>{row.name}</td>
              <td style={numericBodyStyle}>{formatLargeNumber(row.marketCap)}</td>
              <td style={numericBodyStyle}>{formatLargeNumber(row.revenue)}</td>
              <td style={numericBodyStyle}>{formatPercent(row.grossMargin)}</td>
              <td style={numericBodyStyle}>{formatPercent(row.netMargin)}</td>
              <td style={numericBodyStyle}>{formatPercent(row.revenueGrowth)}</td>
              <td style={numericBodyStyle}>{formatRatio(row.currentRatio)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
