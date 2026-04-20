/**
 * Pure helpers for the `/api/v1/screener` route handler.
 *
 * Kept in a sibling module so Next.js's route-segment export rules (which
 * reject non-HTTP-verb / non-config exports from `route.ts`) do not force us
 * to hide pure logic from unit tests. `route.ts` re-imports from here.
 *
 * Contract alignment
 * ------------------
 * The public screener contract in `packages/schemas/src/api/screener.ts` is a
 * literal projection of the internal screener read model
 * (`apps/web/lib/api/screener.ts`). It does not declare an `apiVersion` /
 * `generatedAt` envelope, so the route returns exactly `ScreenerResult`
 * (`{ filtersApplied, rows, totalMatched }`). Adding any other top-level
 * field would broaden the contract and violate the Day 73 rollback rule.
 *
 * Data source
 * -----------
 * Until a screener corpus is persisted (out of Day 73 scope), the endpoint
 * reuses the same `SAMPLE_ROWS` constant the screener page renders. The
 * values are duplicated here (not imported from the page module) because
 * `apps/web/app/screener/page.tsx` is a React Server Component and is not in
 * today's allow-list for refactoring. When the real read model arrives it
 * replaces `getScreenerRows()` in a single swap.
 */

import {
  filterScreenerRows,
  type NumericRange,
  type ScreenerFilters,
  type ScreenerResult,
  type ScreenerRow,
} from '../../../../lib/api/screener';

// ---------------------------------------------------------------------------
// Query parsing
// ---------------------------------------------------------------------------

type RangeField = {
  category: keyof ScreenerFilters;
  field: string;
};

const RANGE_FIELDS: RangeField[] = [
  { category: 'size', field: 'marketCap' },
  { category: 'size', field: 'revenue' },
  { category: 'size', field: 'assets' },
  { category: 'growth', field: 'revenueGrowth' },
  { category: 'growth', field: 'earningsGrowth' },
  { category: 'margin', field: 'grossMargin' },
  { category: 'margin', field: 'operatingMargin' },
  { category: 'margin', field: 'netMargin' },
  { category: 'leverage', field: 'liabilitiesToEquity' },
  { category: 'leverage', field: 'liabilitiesToAssets' },
  { category: 'liquidity', field: 'currentRatio' },
  { category: 'liquidity', field: 'quickRatio' },
];

function capitalize(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function parseFiniteNumber(raw: string | null, paramName: string): number | undefined {
  if (raw === null || raw.trim() === '') {
    return undefined;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${paramName} must be a finite number`);
  }
  return parsed;
}

function readRange(searchParams: URLSearchParams, field: string): NumericRange | undefined {
  const minName = `min${capitalize(field)}`;
  const maxName = `max${capitalize(field)}`;
  const min = parseFiniteNumber(searchParams.get(minName), minName);
  const max = parseFiniteNumber(searchParams.get(maxName), maxName);
  if (min === undefined && max === undefined) {
    return undefined;
  }
  const range: NumericRange = {};
  if (min !== undefined) {
    range.min = min;
  }
  if (max !== undefined) {
    range.max = max;
  }
  return range;
}

/**
 * Parse query parameters into the raw `ScreenerFilters` tree. The result is
 * passed through the read model's `normalizeScreenerFilters` downstream,
 * which enforces `min <= max` consistency per range.
 */
export function normalizeScreenerQuery(searchParams: URLSearchParams): ScreenerFilters {
  const filters: ScreenerFilters = {};
  for (const { category, field } of RANGE_FIELDS) {
    const range = readRange(searchParams, field);
    if (range === undefined) {
      continue;
    }
    const bucket = (filters[category] ?? {}) as Record<string, NumericRange>;
    bucket[field] = range;
    (filters as Record<string, unknown>)[category] = bucket;
  }
  return filters;
}

// ---------------------------------------------------------------------------
// Data source — mirrored from apps/web/app/screener/page.tsx.
// See the module header for why this list is duplicated.
// ---------------------------------------------------------------------------

export const SAMPLE_ROWS: ScreenerRow[] = [
  {
    companyId: '320193',
    ticker: 'AAPL',
    name: 'Apple Inc.',
    marketCap: 3_000_000_000_000,
    revenue: 380_000_000_000,
    assets: 350_000_000_000,
    revenueGrowth: 0.08,
    earningsGrowth: 0.10,
    grossMargin: 0.44,
    operatingMargin: 0.30,
    netMargin: 0.25,
    liabilitiesToEquity: 1.8,
    liabilitiesToAssets: 0.65,
    currentRatio: 1.0,
    quickRatio: 0.85,
  },
  {
    companyId: '789019',
    ticker: 'MSFT',
    name: 'Microsoft Corp.',
    marketCap: 2_800_000_000_000,
    revenue: 220_000_000_000,
    assets: 410_000_000_000,
    revenueGrowth: 0.15,
    earningsGrowth: 0.18,
    grossMargin: 0.69,
    operatingMargin: 0.42,
    netMargin: 0.34,
    liabilitiesToEquity: 0.9,
    liabilitiesToAssets: 0.47,
    currentRatio: 1.8,
    quickRatio: 1.6,
  },
  {
    companyId: '1018724',
    ticker: 'AMZN',
    name: 'Amazon.com Inc.',
    marketCap: 1_600_000_000_000,
    revenue: 570_000_000_000,
    assets: 520_000_000_000,
    revenueGrowth: 0.12,
    earningsGrowth: 0.50,
    grossMargin: 0.47,
    operatingMargin: 0.06,
    netMargin: 0.04,
    liabilitiesToEquity: 2.2,
    liabilitiesToAssets: 0.69,
    currentRatio: 1.1,
    quickRatio: 0.8,
  },
  {
    companyId: '1652044',
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    marketCap: 2_000_000_000_000,
    revenue: 310_000_000_000,
    assets: 400_000_000_000,
    revenueGrowth: 0.13,
    earningsGrowth: 0.22,
    grossMargin: 0.57,
    operatingMargin: 0.28,
    netMargin: 0.24,
    liabilitiesToEquity: 0.5,
    liabilitiesToAssets: 0.34,
    currentRatio: 2.1,
    quickRatio: 2.0,
  },
  {
    companyId: '1326801',
    ticker: 'META',
    name: 'Meta Platforms Inc.',
    marketCap: 1_200_000_000_000,
    revenue: 135_000_000_000,
    assets: 190_000_000_000,
    revenueGrowth: 0.22,
    earningsGrowth: 0.35,
    grossMargin: 0.81,
    operatingMargin: 0.35,
    netMargin: 0.29,
    liabilitiesToEquity: 0.6,
    liabilitiesToAssets: 0.38,
    currentRatio: 2.7,
    quickRatio: 2.5,
  },
];

export function getScreenerRows(): ScreenerRow[] {
  return SAMPLE_ROWS;
}

export function buildScreenerResponse(
  rows: ScreenerRow[],
  filters: ScreenerFilters,
): ScreenerResult {
  return filterScreenerRows(rows, filters);
}
