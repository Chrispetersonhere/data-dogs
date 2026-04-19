/**
 * Pure helpers for peer benchmarking.
 *
 * Splits cleanly from the I/O layer in `peer-benchmark.ts` so these
 * functions can be unit-tested without any network access.
 *
 * Metric semantics (higherIsBetter drives percentile inversion):
 *   revenueGrowth   — latest-FY Revenue vs prior-FY Revenue       (higher is better)
 *   operatingMargin — OperatingIncomeLoss / Revenue, latest FY    (higher is better)
 *   netMargin       — NetIncomeLoss / Revenue, latest FY          (higher is better)
 *   roe             — NetIncomeLoss / StockholdersEquity          (higher is better)
 *   debtToEquity    — (LongTerm + Short-term Debt) / Equity       (lower is better)
 */

export type MetricKey =
  | 'revenueGrowth'
  | 'operatingMargin'
  | 'netMargin'
  | 'roe'
  | 'debtToEquity';

export type MetricDescriptor = {
  key: MetricKey;
  label: string;
  shortLabel: string;
  format: 'percent' | 'ratio';
  higherIsBetter: boolean;
};

export const METRICS: readonly MetricDescriptor[] = [
  { key: 'revenueGrowth',   label: 'Revenue growth',  shortLabel: 'Rev Gr',  format: 'percent', higherIsBetter: true  },
  { key: 'operatingMargin', label: 'Operating margin', shortLabel: 'Op Marg', format: 'percent', higherIsBetter: true  },
  { key: 'netMargin',       label: 'Net margin',       shortLabel: 'Net Marg', format: 'percent', higherIsBetter: true  },
  { key: 'roe',             label: 'Return on equity', shortLabel: 'ROE',     format: 'percent', higherIsBetter: true  },
  { key: 'debtToEquity',    label: 'Debt / equity',    shortLabel: 'D/E',     format: 'ratio',   higherIsBetter: false },
] as const;

export type CompanyMetrics = {
  revenueGrowth: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  roe: number | null;
  debtToEquity: number | null;
};

export type CompanyRecord = {
  ticker: string;
  cik: string;
  name: string;
  sic: string | null;
  sicDescription: string | null;
  metrics: CompanyMetrics;
};

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

/**
 * Percentile rank of `val` within `values`, with ties averaged.
 * When `higherIsBetter` is false, the rank is inverted so a lower raw value
 * maps to a higher "good" percentile.
 *
 * Returns a value in [0, 100]. Degenerate cases (n <= 1) return 50.
 */
export function percentile(values: number[], val: number, higherIsBetter: boolean): number {
  const clean = values.filter((v) => Number.isFinite(v));
  const n = clean.length;
  if (n <= 1) return 50;
  const below = clean.filter((v) => v < val).length;
  const equal = clean.filter((v) => v === val).length;
  const rank = below + Math.max(equal - 1, 0) / 2;
  const pct = (rank / (n - 1)) * 100;
  return higherIsBetter ? pct : 100 - pct;
}

/** Median of a numeric array, ignoring non-finite values. Returns null when empty. */
export function median(values: number[]): number | null {
  const clean = values.filter((v) => Number.isFinite(v));
  if (!clean.length) return null;
  const s = [...clean].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatMetric(val: number | null, format: 'percent' | 'ratio'): string {
  if (val == null || !Number.isFinite(val)) return '—';
  if (format === 'percent') return `${(val * 100).toFixed(1)}%`;
  return val.toFixed(2);
}

// ---------------------------------------------------------------------------
// XBRL companyfacts → metrics
// ---------------------------------------------------------------------------

export type FactPoint = {
  end: string;
  val: number;
  fy?: number;
  fp?: string;
  form?: string;
  accn?: string;
};

export type CompanyFactsShape = {
  cik?: number;
  entityName?: string;
  facts?: {
    'us-gaap'?: Record<
      string,
      {
        units?: Record<string, FactPoint[]>;
      }
    >;
  };
};

/**
 * SEC XBRL concept candidates in preference order. Some companies report
 * top-line under newer (ASC 606) tags; we fall back through older ones.
 */
const CONCEPT_CANDIDATES: Record<string, readonly string[]> = {
  revenue: [
    'Revenues',
    'RevenueFromContractWithCustomerExcludingAssessedTax',
    'RevenueFromContractWithCustomerIncludingAssessedTax',
    'SalesRevenueNet',
    'SalesRevenueGoodsNet',
  ],
  operatingIncome: ['OperatingIncomeLoss'],
  netIncome: ['NetIncomeLoss', 'ProfitLoss'],
  equity: [
    'StockholdersEquity',
    'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest',
  ],
  longTermDebt: [
    'LongTermDebt',
    'LongTermDebtNoncurrent',
  ],
  shortTermDebt: [
    'LongTermDebtCurrent',
    'ShortTermBorrowings',
    'DebtCurrent',
  ],
  liabilities: ['Liabilities'],
};

/**
 * Pick the most-recent annual fact point, filtering to form === "10-K" or "20-F"
 * and fp === "FY" when available. Returns null when no match.
 */
function latestAnnual(points: FactPoint[] | undefined): FactPoint | null {
  if (!points || !points.length) return null;
  const annual = points.filter((p) => p.fp === 'FY' && (p.form === '10-K' || p.form === '20-F'));
  const pool = annual.length ? annual : points;
  let best: FactPoint | null = null;
  for (const p of pool) {
    if (!Number.isFinite(p.val)) continue;
    if (!best || p.end > best.end) best = p;
  }
  return best;
}

/** Same as latestAnnual but returns the point just before the latest. */
function priorAnnual(points: FactPoint[] | undefined): FactPoint | null {
  if (!points || !points.length) return null;
  const annual = points.filter((p) => p.fp === 'FY' && (p.form === '10-K' || p.form === '20-F'));
  const pool = (annual.length ? annual : points)
    .filter((p) => Number.isFinite(p.val))
    .sort((a, b) => (a.end < b.end ? 1 : -1));
  return pool[1] ?? null;
}

function conceptPoints(
  facts: CompanyFactsShape,
  names: readonly string[],
  unit: 'USD' | 'pure' = 'USD',
): FactPoint[] | undefined {
  const gaap = facts.facts?.['us-gaap'];
  if (!gaap) return undefined;
  for (const name of names) {
    const concept = gaap[name];
    const units = concept?.units?.[unit];
    if (units && units.length) return units;
  }
  return undefined;
}

function safeDiv(n: number | null | undefined, d: number | null | undefined): number | null {
  if (n == null || d == null || !Number.isFinite(n) || !Number.isFinite(d) || d === 0) return null;
  return n / d;
}

/**
 * Derive the five peer-benchmark metrics from an SEC companyfacts JSON.
 * Returns nulls for metrics whose source concepts are missing.
 */
export function deriveMetricsFromFacts(facts: CompanyFactsShape): CompanyMetrics {
  const revenuePoints = conceptPoints(facts, CONCEPT_CANDIDATES.revenue);
  const revLatest = latestAnnual(revenuePoints);
  const revPrior = priorAnnual(revenuePoints);

  const opIncLatest = latestAnnual(conceptPoints(facts, CONCEPT_CANDIDATES.operatingIncome));
  const netIncLatest = latestAnnual(conceptPoints(facts, CONCEPT_CANDIDATES.netIncome));
  const equityLatest = latestAnnual(conceptPoints(facts, CONCEPT_CANDIDATES.equity));

  const longTermLatest = latestAnnual(conceptPoints(facts, CONCEPT_CANDIDATES.longTermDebt));
  const shortTermLatest = latestAnnual(conceptPoints(facts, CONCEPT_CANDIDATES.shortTermDebt));
  const liabilitiesLatest = latestAnnual(conceptPoints(facts, CONCEPT_CANDIDATES.liabilities));

  const revenueGrowth =
    revLatest && revPrior && revPrior.val !== 0
      ? (revLatest.val - revPrior.val) / Math.abs(revPrior.val)
      : null;

  const operatingMargin = safeDiv(opIncLatest?.val, revLatest?.val);
  const netMargin = safeDiv(netIncLatest?.val, revLatest?.val);
  const roe = safeDiv(netIncLatest?.val, equityLatest?.val);

  let debtNumerator: number | null = null;
  if (longTermLatest || shortTermLatest) {
    debtNumerator = (longTermLatest?.val ?? 0) + (shortTermLatest?.val ?? 0);
  } else if (liabilitiesLatest) {
    debtNumerator = liabilitiesLatest.val;
  }
  const debtToEquity = safeDiv(debtNumerator, equityLatest?.val);

  return { revenueGrowth, operatingMargin, netMargin, roe, debtToEquity };
}

// ---------------------------------------------------------------------------
// Ranking / insights
// ---------------------------------------------------------------------------

export type RadarPoint = {
  metric: string;
  metricKey: MetricKey;
  target: number;
  median: number;
  peers: Record<string, number>;
};

/**
 * Build percentile-rank radar data. Missing target values are charted at 0
 * to keep the axis visible; missing peer values are simply excluded from the
 * percentile universe for that metric.
 */
export function buildRadarData(target: CompanyRecord, peers: CompanyRecord[]): RadarPoint[] {
  return METRICS.map((m) => {
    const universe = [target, ...peers]
      .map((c) => c.metrics[m.key])
      .filter((v): v is number => v != null && Number.isFinite(v));

    const targetVal = target.metrics[m.key];
    const targetPct = targetVal != null ? Math.round(percentile(universe, targetVal, m.higherIsBetter)) : 0;

    const peersMap: Record<string, number> = {};
    for (const p of peers) {
      const v = p.metrics[m.key];
      if (v != null) peersMap[p.ticker] = Math.round(percentile(universe, v, m.higherIsBetter));
    }

    const peerVals = peers.map((p) => p.metrics[m.key]).filter((v): v is number => v != null);
    const peerMed = median(peerVals);
    const medianPct = peerMed != null ? Math.round(percentile(universe, peerMed, m.higherIsBetter)) : 50;

    return {
      metric: m.shortLabel,
      metricKey: m.key,
      target: targetPct,
      median: medianPct,
      peers: peersMap,
    };
  });
}

export type Insight = {
  tone: 'pos' | 'neg' | 'warn';
  metric: string;
  text: string;
};

/**
 * Quick-take insights: metrics where the target lands in the top/bottom 20th
 * percentile of the peer group. Returns an empty array when there are no
 * peers, which is the "tracks in line" state.
 */
export function buildInsights(target: CompanyRecord, peers: CompanyRecord[]): Insight[] {
  if (!peers.length) return [];
  const out: Insight[] = [];
  for (const m of METRICS) {
    const targetVal = target.metrics[m.key];
    if (targetVal == null) continue;
    const universe = [target, ...peers]
      .map((c) => c.metrics[m.key])
      .filter((v): v is number => v != null);
    if (universe.length < 2) continue;
    const pct = percentile(universe, targetVal, m.higherIsBetter);
    const formatted = formatMetric(targetVal, m.format);
    if (pct >= 80) {
      out.push({
        tone: 'pos',
        metric: m.label,
        text: `Best-in-peer ${m.label.toLowerCase()} — ${formatted}.`,
      });
    } else if (pct <= 20) {
      out.push({
        tone: 'neg',
        metric: m.label,
        text: `Lags peer group on ${m.label.toLowerCase()} — ${formatted}.`,
      });
    }
  }
  return out;
}
