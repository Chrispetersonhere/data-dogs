/**
 * Peer comparison query layer.
 *
 * Provides types and pure functions for comparing a subject company against
 * a curated peer set on a fixed metric set. Designed for a clean comparison
 * table — not a sprawling dashboard.
 *
 * Curated metrics: market cap, revenue, gross margin, operating margin,
 * net margin, revenue growth, current ratio, liabilities-to-equity.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single company row in the peer comparison table. */
export type PeerCompanyRow = {
  companyId: string;
  ticker: string;
  name: string;
  marketCap: number;
  revenue: number;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  revenueGrowth: number;
  currentRatio: number;
  liabilitiesToEquity: number;
};

/** Identifies which company is the subject vs. peer in the comparison set. */
export type PeerComparisonEntry = PeerCompanyRow & {
  role: 'subject' | 'peer';
};

/** Full result returned by the peer comparison query. */
export type PeerComparisonResult = {
  subject: PeerCompanyRow;
  peers: PeerCompanyRow[];
  entries: PeerComparisonEntry[];
  peerCount: number;
};

// ---------------------------------------------------------------------------
// Curated metric descriptors (column definitions for the table)
// ---------------------------------------------------------------------------

export type PeerMetricDescriptor = {
  key: keyof PeerCompanyRow;
  label: string;
  format: 'currency' | 'percent' | 'ratio';
};

export const PEER_METRICS: readonly PeerMetricDescriptor[] = [
  { key: 'marketCap', label: 'Market cap', format: 'currency' },
  { key: 'revenue', label: 'Revenue', format: 'currency' },
  { key: 'grossMargin', label: 'Gross margin', format: 'percent' },
  { key: 'operatingMargin', label: 'Operating margin', format: 'percent' },
  { key: 'netMargin', label: 'Net margin', format: 'percent' },
  { key: 'revenueGrowth', label: 'Rev growth', format: 'percent' },
  { key: 'currentRatio', label: 'Current ratio', format: 'ratio' },
  { key: 'liabilitiesToEquity', label: 'L/E ratio', format: 'ratio' },
] as const;

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function formatPeerMetric(value: number, format: 'currency' | 'percent' | 'ratio'): string {
  switch (format) {
    case 'currency':
      if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(1)}T`;
      if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(0)}B`;
      if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
      return `$${value.toLocaleString('en-US')}`;
    case 'percent':
      return `${(value * 100).toFixed(1)}%`;
    case 'ratio':
      return value.toFixed(2);
  }
}

// ---------------------------------------------------------------------------
// Query entry-point
// ---------------------------------------------------------------------------

/**
 * Build a peer comparison result from a subject company and its peer set.
 *
 * Validates that the subject is not duplicated in the peer list. Returns
 * entries ordered subject-first, then peers in the order provided.
 */
export function buildPeerComparison(
  subject: PeerCompanyRow,
  peers: PeerCompanyRow[],
): PeerComparisonResult {
  const deduped = peers.filter((p) => p.companyId !== subject.companyId);

  const entries: PeerComparisonEntry[] = [
    { ...subject, role: 'subject' },
    ...deduped.map((p): PeerComparisonEntry => ({ ...p, role: 'peer' })),
  ];

  return {
    subject,
    peers: deduped,
    entries,
    peerCount: deduped.length,
  };
}
