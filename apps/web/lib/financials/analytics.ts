/**
 * Pure analytics helpers for the annual financial-statement dashboard.
 *
 * These operate on the statement row shape produced by
 * `apps/web/app/company/[companyId]/financials/page.tsx` against the
 * SEC XBRL `companyfacts` endpoint. They intentionally hold no React,
 * no fetching, and no date-dependent logic so they can be unit-tested
 * without network or rendering.
 */

export type StatementId = 'income' | 'balance' | 'cashflow';

export type StatementRow = {
  label: string;
  valuesByYear: Record<number, number>;
};

export type YoYDelta = {
  year: number;
  priorYear: number;
  absoluteChange: number;
  /**
   * Fractional change. `null` when the prior-year value is zero (division
   * undefined). Callers format for display.
   */
  percentChange: number | null;
};

export type YoYDeltasByRow = {
  label: string;
  deltasByYear: Record<number, YoYDelta>;
};

export type CommonSizeRow = {
  label: string;
  denominatorLabel: string;
  /**
   * Fractional common-size share. `null` when denominator is missing or
   * zero for that year.
   */
  percentByYear: Record<number, number | null>;
};

export type TrendPoint = {
  year: number;
  value: number;
};

export type TrendSeries = {
  label: string;
  points: TrendPoint[];
};

/**
 * Denominator line item used for each statement's common-size view.
 * Mirrors the labels emitted by STATEMENT_SPECS in the financials page.
 */
export const COMMON_SIZE_DENOMINATOR: Record<StatementId, string> = {
  income: 'Revenue',
  balance: 'Total assets',
  cashflow: 'Cash from operations',
};

/**
 * Compute year-over-year deltas for a single row.
 * `years` must be ordered descending (most recent first) — the same order
 * the financials page uses to render table columns.
 */
export function computeRowYoYDeltas(
  row: StatementRow,
  years: number[],
): Record<number, YoYDelta> {
  const result: Record<number, YoYDelta> = {};
  for (let i = 0; i < years.length - 1; i += 1) {
    const year = years[i];
    const priorYear = years[i + 1];
    const current = row.valuesByYear[year];
    const previous = row.valuesByYear[priorYear];
    if (current === undefined || previous === undefined) {
      continue;
    }
    const absoluteChange = current - previous;
    const percentChange = previous === 0 ? null : (current - previous) / Math.abs(previous);
    result[year] = { year, priorYear, absoluteChange, percentChange };
  }
  return result;
}

export function computeYoYDeltas(
  rows: StatementRow[],
  years: number[],
): YoYDeltasByRow[] {
  return rows.map((row) => ({
    label: row.label,
    deltasByYear: computeRowYoYDeltas(row, years),
  }));
}

/**
 * Compute common-size view for one statement. The denominator is the
 * statement-specific anchor line (revenue / total assets / cash from ops).
 * If the denominator row is missing, every row returns an empty map rather
 * than throwing — the caller can fall back to the absolute view.
 */
export function computeCommonSize(
  statementId: StatementId,
  rows: StatementRow[],
): CommonSizeRow[] {
  const denominatorLabel = COMMON_SIZE_DENOMINATOR[statementId];
  const denominatorRow = rows.find((row) => row.label === denominatorLabel);

  return rows.map((row) => {
    const percentByYear: Record<number, number | null> = {};
    if (!denominatorRow) {
      return { label: row.label, denominatorLabel, percentByYear };
    }
    for (const [yearText, value] of Object.entries(row.valuesByYear)) {
      const year = Number(yearText);
      const denomValue = denominatorRow.valuesByYear[year];
      if (denomValue === undefined || denomValue === 0) {
        percentByYear[year] = null;
        continue;
      }
      percentByYear[year] = value / denomValue;
    }
    return { label: row.label, denominatorLabel, percentByYear };
  });
}

/**
 * Build ascending-year trend series for inline sparkline rendering.
 * Years are sorted ascending so the chart's leftmost point is the oldest.
 * Rows with no numeric values produce an empty `points` array; the renderer
 * must treat that as "trend unavailable".
 */
export function buildTrendSeries(
  rows: StatementRow[],
  years: number[],
): TrendSeries[] {
  const ascending = [...years].sort((a, b) => a - b);
  return rows.map((row) => {
    const points: TrendPoint[] = [];
    for (const year of ascending) {
      const value = row.valuesByYear[year];
      if (typeof value === 'number' && Number.isFinite(value)) {
        points.push({ year, value });
      }
    }
    return { label: row.label, points };
  });
}

export type FinancialsView = 'absolute' | 'common-size';

/**
 * Parse the `?view=` query parameter. Anything other than the two known
 * values collapses to `absolute` — the default / fallback view.
 */
export function parseFinancialsView(raw: string | undefined): FinancialsView {
  return raw === 'common-size' ? 'common-size' : 'absolute';
}
