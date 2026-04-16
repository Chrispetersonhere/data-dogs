/**
 * Data-preparation layer for the Fundamentals Small Multiples chart.
 *
 * Provides typed helpers that transform raw financial-statement rows into
 * the shape expected by <FundamentalsSmallMultiples />.
 *
 * Data below is sourced from Apple Inc. (AAPL) 10-K filings 2020-2024
 * filed with the SEC (EDGAR CIK 0000320193).  All figures in USD millions
 * except EPS (USD per share).
 */

/** A single annual observation for one metric. */
export type FundamentalPoint = {
  /** Fiscal-year label, e.g. "FY 2024". */
  period: string;
  /** Numeric value in the metric's native unit. */
  value: number;
};

/** One panel in the small-multiples grid. */
export type FundamentalSeries = {
  /** Human-readable metric name. */
  metric: string;
  /** Unit descriptor shown on the axis, e.g. "$M" or "$/share". */
  unit: string;
  /** Ordered time-series values. */
  data: FundamentalPoint[];
};

/**
 * Apple Inc. fundamentals, FY 2020–2024, sourced from EDGAR 10-K filings.
 *
 * Source: SEC EDGAR, CIK 0000320193
 * Accession examples:
 *   FY2024 → 0000320193-24-000123
 *   FY2023 → 0000320193-23-000106
 *   FY2022 → 0000320193-22-000108
 *   FY2021 → 0000320193-21-000105
 *   FY2020 → 0000320193-20-000096
 */
export const APPLE_FUNDAMENTALS: FundamentalSeries[] = [
  {
    metric: 'Revenue',
    unit: '$M',
    data: [
      { period: 'FY 2020', value: 274_515 },
      { period: 'FY 2021', value: 365_817 },
      { period: 'FY 2022', value: 394_328 },
      { period: 'FY 2023', value: 383_285 },
      { period: 'FY 2024', value: 391_035 },
    ],
  },
  {
    metric: 'Net Income',
    unit: '$M',
    data: [
      { period: 'FY 2020', value: 57_411 },
      { period: 'FY 2021', value: 94_680 },
      { period: 'FY 2022', value: 99_803 },
      { period: 'FY 2023', value: 96_995 },
      { period: 'FY 2024', value: 93_736 },
    ],
  },
  {
    metric: 'Diluted EPS',
    unit: '$/share',
    data: [
      { period: 'FY 2020', value: 3.28 },
      { period: 'FY 2021', value: 5.67 },
      { period: 'FY 2022', value: 6.15 },
      { period: 'FY 2023', value: 6.16 },
      { period: 'FY 2024', value: 6.08 },
    ],
  },
  {
    metric: 'Free Cash Flow',
    unit: '$M',
    data: [
      { period: 'FY 2020', value: 73_365 },
      { period: 'FY 2021', value: 92_953 },
      { period: 'FY 2022', value: 111_443 },
      { period: 'FY 2023', value: 99_584 },
      { period: 'FY 2024', value: 108_807 },
    ],
  },
  {
    metric: 'Gross Margin',
    unit: '%',
    data: [
      { period: 'FY 2020', value: 38.2 },
      { period: 'FY 2021', value: 41.8 },
      { period: 'FY 2022', value: 43.3 },
      { period: 'FY 2023', value: 44.1 },
      { period: 'FY 2024', value: 46.2 },
    ],
  },
  {
    metric: 'Operating Margin',
    unit: '%',
    data: [
      { period: 'FY 2020', value: 24.1 },
      { period: 'FY 2021', value: 29.8 },
      { period: 'FY 2022', value: 30.3 },
      { period: 'FY 2023', value: 29.8 },
      { period: 'FY 2024', value: 31.5 },
    ],
  },
];

/** Validate that all series have the same number of periods. */
export function validateFundamentalSeries(series: FundamentalSeries[]): boolean {
  if (series.length === 0) return false;
  const expectedLength = series[0].data.length;
  return series.every((s) => s.data.length === expectedLength && s.data.length > 0);
}
