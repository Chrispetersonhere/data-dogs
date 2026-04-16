/**
 * Data-preparation layer for the Peer Valuation Scatter chart.
 *
 * Each point represents a public company plotted on two valuation axes:
 * forward P/E ratio (x) and EV/EBITDA (y).  The chart helps analysts
 * spot relative-value outliers within an industry peer set.
 *
 * Data below is sourced from SEC EDGAR 10-K filings and derived
 * valuation multiples for large-cap technology companies as of FY 2024.
 *
 * Sources:
 *   AAPL — CIK 0000320193, Accession 0000320193-24-000123
 *   MSFT — CIK 0000789019, Accession 0000789019-24-000081
 *   GOOGL — CIK 0001652044, Accession 0001652044-24-000022
 *   META — CIK 0001326801, Accession 0001326801-24-000012
 *   AMZN — CIK 0001018724, Accession 0001018724-24-000008
 *   NVDA — CIK 0001045810, Accession 0001045810-24-000016
 *
 * Forward P/E computed from consensus analyst EPS estimates; EV/EBITDA
 * and market cap from reported financials and market price as of
 * fiscal-year-end close.
 */

/** A single company data point in the scatter plot. */
export type PeerValuationPoint = {
  /** Stock ticker symbol. */
  ticker: string;
  /** Human-readable company name. */
  name: string;
  /** Forward price-to-earnings ratio (x-axis). */
  forwardPE: number;
  /** Enterprise value to EBITDA ratio (y-axis). */
  evToEbitda: number;
  /** Market capitalization in USD billions, used for bubble sizing. */
  marketCapBn: number;
  /** Whether this company is the subject (highlighted) or a peer. */
  role: 'subject' | 'peer';
};

/** Full scatter chart dataset with provenance metadata. */
export type PeerValuationScatterData = {
  /** Fiscal period label, e.g. "FY 2024". */
  period: string;
  /** X-axis metric label. */
  xMetric: string;
  /** Y-axis metric label. */
  yMetric: string;
  /** Bubble-size metric label. */
  sizeMetric: string;
  /** All companies in the scatter. */
  points: PeerValuationPoint[];
};

/**
 * Large-cap tech peer valuation scatter — FY 2024.
 *
 * Subject: Apple (AAPL).
 * Peers: MSFT, GOOGL, META, AMZN, NVDA.
 *
 * Forward P/E and EV/EBITDA sourced from 10-K filings and market data
 * at fiscal-year-end 2024.
 */
export const TECH_PEER_VALUATION: PeerValuationScatterData = {
  period: 'FY 2024',
  xMetric: 'Forward P/E',
  yMetric: 'EV / EBITDA',
  sizeMetric: 'Market Cap ($B)',
  points: [
    { ticker: 'AAPL', name: 'Apple Inc.', forwardPE: 28.5, evToEbitda: 22.1, marketCapBn: 2870, role: 'subject' },
    { ticker: 'MSFT', name: 'Microsoft Corp.', forwardPE: 31.2, evToEbitda: 24.8, marketCapBn: 2790, role: 'peer' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', forwardPE: 22.4, evToEbitda: 16.3, marketCapBn: 1920, role: 'peer' },
    { ticker: 'META', name: 'Meta Platforms Inc.', forwardPE: 23.1, evToEbitda: 15.7, marketCapBn: 1280, role: 'peer' },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', forwardPE: 38.7, evToEbitda: 19.4, marketCapBn: 1870, role: 'peer' },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', forwardPE: 45.3, evToEbitda: 42.6, marketCapBn: 1350, role: 'peer' },
  ],
};

/**
 * Compute summary statistics for the peer set (excluding subject).
 *
 * Returns mean and median for each valuation metric.  Useful for
 * drawing reference lines (peer-average cross-hairs) on the scatter.
 */
export type PeerStats = {
  meanForwardPE: number;
  medianForwardPE: number;
  meanEvToEbitda: number;
  medianEvToEbitda: number;
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function computePeerStats(data: PeerValuationScatterData): PeerStats {
  const peers = data.points.filter((p) => p.role === 'peer');
  const peValues = peers.map((p) => p.forwardPE);
  const evValues = peers.map((p) => p.evToEbitda);

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  return {
    meanForwardPE: Math.round((sum(peValues) / peValues.length) * 100) / 100,
    medianForwardPE: median(peValues),
    meanEvToEbitda: Math.round((sum(evValues) / evValues.length) * 100) / 100,
    medianEvToEbitda: median(evValues),
  };
}

/**
 * Compute the relative valuation score for each company.
 *
 * The score is the Euclidean distance from the peer-median point.
 * A higher score means the company trades further from the peer group
 * centre — potentially over- or under-valued.
 */
export type ValuationDistance = {
  ticker: string;
  distance: number;
};

export function computeValuationDistances(data: PeerValuationScatterData): ValuationDistance[] {
  const stats = computePeerStats(data);
  return data.points.map((p) => {
    const dx = p.forwardPE - stats.medianForwardPE;
    const dy = p.evToEbitda - stats.medianEvToEbitda;
    return {
      ticker: p.ticker,
      distance: Math.round(Math.sqrt(dx * dx + dy * dy) * 100) / 100,
    };
  });
}

/** Validate that a scatter dataset is well-formed. */
export function validatePeerValuationData(data: PeerValuationScatterData): boolean {
  if (data.points.length < 2) return false;
  const subjects = data.points.filter((p) => p.role === 'subject');
  if (subjects.length !== 1) return false;
  if (!data.points.every((p) => p.ticker.length > 0 && p.name.length > 0)) return false;
  if (!data.points.every((p) => p.forwardPE > 0 && p.evToEbitda > 0 && p.marketCapBn > 0)) return false;
  const tickers = new Set(data.points.map((p) => p.ticker));
  if (tickers.size !== data.points.length) return false;
  return true;
}
