import type { CSSProperties } from 'react';

import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '../../../../packages/ui/src/styles/tokens';
import {
  buildPeerComparison,
  formatPeerMetric,
  PEER_METRICS,
} from '../../lib/api/peers';
import type { PeerCompanyRow, PeerComparisonEntry } from '../../lib/api/peers';

// ---------------------------------------------------------------------------
// Static sample data – curated large-cap tech peer set
// ---------------------------------------------------------------------------

const SUBJECT: PeerCompanyRow = {
  companyId: '320193',
  ticker: 'AAPL',
  name: 'Apple Inc.',
  marketCap: 3_000_000_000_000,
  revenue: 380_000_000_000,
  grossMargin: 0.44,
  operatingMargin: 0.30,
  netMargin: 0.25,
  revenueGrowth: 0.08,
  currentRatio: 1.0,
  liabilitiesToEquity: 1.8,
};

const PEERS: PeerCompanyRow[] = [
  {
    companyId: '789019',
    ticker: 'MSFT',
    name: 'Microsoft Corp.',
    marketCap: 2_800_000_000_000,
    revenue: 220_000_000_000,
    grossMargin: 0.69,
    operatingMargin: 0.42,
    netMargin: 0.34,
    revenueGrowth: 0.15,
    currentRatio: 1.8,
    liabilitiesToEquity: 0.9,
  },
  {
    companyId: '1652044',
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    marketCap: 2_000_000_000_000,
    revenue: 310_000_000_000,
    grossMargin: 0.57,
    operatingMargin: 0.28,
    netMargin: 0.24,
    revenueGrowth: 0.13,
    currentRatio: 2.1,
    liabilitiesToEquity: 0.5,
  },
  {
    companyId: '1326801',
    ticker: 'META',
    name: 'Meta Platforms Inc.',
    marketCap: 1_200_000_000_000,
    revenue: 135_000_000_000,
    grossMargin: 0.81,
    operatingMargin: 0.35,
    netMargin: 0.29,
    revenueGrowth: 0.22,
    currentRatio: 2.7,
    liabilitiesToEquity: 0.6,
  },
  {
    companyId: '1018724',
    ticker: 'AMZN',
    name: 'Amazon.com Inc.',
    marketCap: 1_600_000_000_000,
    revenue: 570_000_000_000,
    grossMargin: 0.47,
    operatingMargin: 0.06,
    netMargin: 0.04,
    revenueGrowth: 0.12,
    currentRatio: 1.1,
    liabilitiesToEquity: 2.2,
  },
];

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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

const tableWrapperStyle: CSSProperties = {
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: typographyTokens.fontSize.sm,
  fontFamily: typographyTokens.fontFamily.sans,
};

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: `${spacingTokens['2']} ${spacingTokens['3']}`,
  borderBottom: `2px solid ${colorTokens.border.subtle}`,
  color: colorTokens.text.muted,
  fontWeight: typographyTokens.fontWeight.semibold,
  fontSize: typographyTokens.fontSize.xs,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap',
};

const tdStyle: CSSProperties = {
  padding: `${spacingTokens['2']} ${spacingTokens['3']}`,
  borderBottom: `1px solid ${colorTokens.border.subtle}`,
  whiteSpace: 'nowrap',
};

const subjectRowStyle: CSSProperties = {
  background: colorTokens.accent.soft,
  fontWeight: typographyTokens.fontWeight.semibold,
};

// ---------------------------------------------------------------------------
// Table row renderer
// ---------------------------------------------------------------------------

function ComparisonRow({ entry }: { entry: PeerComparisonEntry }) {
  const rowStyle = entry.role === 'subject' ? { ...tdStyle, ...subjectRowStyle } : tdStyle;

  return (
    <tr>
      <td style={rowStyle}>{entry.ticker}</td>
      <td style={rowStyle}>{entry.name}</td>
      <td style={rowStyle}>
        <span
          style={{
            display: 'inline-block',
            padding: `${spacingTokens['0']} ${spacingTokens['2']}`,
            borderRadius: radiusTokens.sm,
            background: entry.role === 'subject' ? colorTokens.text.primary : colorTokens.accent.soft,
            color: entry.role === 'subject' ? colorTokens.text.inverse : colorTokens.text.secondary,
            fontSize: typographyTokens.fontSize.xs,
            fontWeight: typographyTokens.fontWeight.medium,
          }}
        >
          {entry.role === 'subject' ? 'Subject' : 'Peer'}
        </span>
      </td>
      {PEER_METRICS.map((metric) => (
        <td key={metric.key} style={{ ...rowStyle, textAlign: 'right', fontFamily: typographyTokens.fontFamily.mono }}>
          {formatPeerMetric(entry[metric.key] as number, metric.format)}
        </td>
      ))}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function PeersPage() {
  const comparison = buildPeerComparison(SUBJECT, PEERS);

  return (
    <main style={shellStyle}>
      <section style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gap: spacingTokens['4'] }}>
        <header style={cardStyle}>
          <p style={{ margin: 0, color: colorTokens.text.muted, fontSize: typographyTokens.fontSize.sm }}>
            Peer comparison
          </p>
          <h1 style={{ margin: `${spacingTokens['2']} 0 ${spacingTokens['3']}`, fontSize: typographyTokens.fontSize['3xl'] }}>
            Peer comparison
          </h1>
          <p style={{ margin: 0, color: colorTokens.text.secondary, maxWidth: '68ch' }}>
            Compare {comparison.subject.name} ({comparison.subject.ticker}) against {comparison.peerCount} curated
            peers on key financial metrics. The subject company is highlighted in the table below.
          </p>
        </header>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Peer set</h2>
          <p style={{ margin: 0, color: colorTokens.text.secondary }}>
            Subject: <strong>{comparison.subject.ticker}</strong> — {comparison.subject.name}.
            {' '}Peers: {comparison.peers.map((p) => p.ticker).join(', ')}.
            {' '}{comparison.entries.length} companies in comparison set.
          </p>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Curated metrics</h2>
          <p style={{ margin: 0, color: colorTokens.text.secondary }}>
            {PEER_METRICS.map((m) => m.label).join(' · ')}
          </p>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Comparison table</h2>
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Ticker</th>
                  <th style={thStyle}>Company</th>
                  <th style={thStyle}>Role</th>
                  {PEER_METRICS.map((metric) => (
                    <th key={metric.key} style={{ ...thStyle, textAlign: 'right' }}>
                      {metric.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.entries.map((entry) => (
                  <ComparisonRow key={entry.companyId} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
