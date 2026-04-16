/**
 * Screener backend query layer.
 *
 * Provides pure-function filter normalization and row matching so the screener
 * endpoint stays simple and testable without network calls.
 *
 * Filter categories: size, growth, margin, leverage, liquidity.
 */

export type NumericRange = {
  min?: number;
  max?: number;
};

export type ScreenerSizeFilter = {
  marketCap?: NumericRange;
  revenue?: NumericRange;
  assets?: NumericRange;
};

export type ScreenerGrowthFilter = {
  revenueGrowth?: NumericRange;
  earningsGrowth?: NumericRange;
};

export type ScreenerMarginFilter = {
  grossMargin?: NumericRange;
  operatingMargin?: NumericRange;
  netMargin?: NumericRange;
};

export type ScreenerLeverageFilter = {
  liabilitiesToEquity?: NumericRange;
  liabilitiesToAssets?: NumericRange;
};

export type ScreenerLiquidityFilter = {
  currentRatio?: NumericRange;
  quickRatio?: NumericRange;
};

export type ScreenerFilters = {
  size?: ScreenerSizeFilter;
  growth?: ScreenerGrowthFilter;
  margin?: ScreenerMarginFilter;
  leverage?: ScreenerLeverageFilter;
  liquidity?: ScreenerLiquidityFilter;
};

export type ScreenerRow = {
  companyId: string;
  ticker: string | null;
  name: string;
  marketCap: number | null;
  revenue: number | null;
  assets: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  liabilitiesToEquity: number | null;
  liabilitiesToAssets: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
};

export type ScreenerResult = {
  filtersApplied: ScreenerFilters;
  rows: ScreenerRow[];
  totalMatched: number;
};

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

function clampRange(range: NumericRange | undefined): NumericRange | undefined {
  if (range === undefined) {
    return undefined;
  }
  const { min, max } = range;
  if (min !== undefined && max !== undefined && min > max) {
    throw new Error(`Invalid range: min (${min}) exceeds max (${max})`);
  }
  return range;
}

export function normalizeScreenerFilters(raw: ScreenerFilters): ScreenerFilters {
  const out: ScreenerFilters = {};

  if (raw.size) {
    out.size = {
      marketCap: clampRange(raw.size.marketCap),
      revenue: clampRange(raw.size.revenue),
      assets: clampRange(raw.size.assets),
    };
  }

  if (raw.growth) {
    out.growth = {
      revenueGrowth: clampRange(raw.growth.revenueGrowth),
      earningsGrowth: clampRange(raw.growth.earningsGrowth),
    };
  }

  if (raw.margin) {
    out.margin = {
      grossMargin: clampRange(raw.margin.grossMargin),
      operatingMargin: clampRange(raw.margin.operatingMargin),
      netMargin: clampRange(raw.margin.netMargin),
    };
  }

  if (raw.leverage) {
    out.leverage = {
      liabilitiesToEquity: clampRange(raw.leverage.liabilitiesToEquity),
      liabilitiesToAssets: clampRange(raw.leverage.liabilitiesToAssets),
    };
  }

  if (raw.liquidity) {
    out.liquidity = {
      currentRatio: clampRange(raw.liquidity.currentRatio),
      quickRatio: clampRange(raw.liquidity.quickRatio),
    };
  }

  return out;
}

// ---------------------------------------------------------------------------
// Row matching
// ---------------------------------------------------------------------------

function matchesRange(value: number | null, range: NumericRange | undefined): boolean {
  if (range === undefined) {
    return true;
  }
  if (value === null) {
    return false;
  }
  if (range.min !== undefined && value < range.min) {
    return false;
  }
  if (range.max !== undefined && value > range.max) {
    return false;
  }
  return true;
}

export function matchesScreenerFilters(row: ScreenerRow, filters: ScreenerFilters): boolean {
  // Size
  if (filters.size) {
    if (!matchesRange(row.marketCap, filters.size.marketCap)) return false;
    if (!matchesRange(row.revenue, filters.size.revenue)) return false;
    if (!matchesRange(row.assets, filters.size.assets)) return false;
  }

  // Growth
  if (filters.growth) {
    if (!matchesRange(row.revenueGrowth, filters.growth.revenueGrowth)) return false;
    if (!matchesRange(row.earningsGrowth, filters.growth.earningsGrowth)) return false;
  }

  // Margin
  if (filters.margin) {
    if (!matchesRange(row.grossMargin, filters.margin.grossMargin)) return false;
    if (!matchesRange(row.operatingMargin, filters.margin.operatingMargin)) return false;
    if (!matchesRange(row.netMargin, filters.margin.netMargin)) return false;
  }

  // Leverage
  if (filters.leverage) {
    if (!matchesRange(row.liabilitiesToEquity, filters.leverage.liabilitiesToEquity)) return false;
    if (!matchesRange(row.liabilitiesToAssets, filters.leverage.liabilitiesToAssets)) return false;
  }

  // Liquidity
  if (filters.liquidity) {
    if (!matchesRange(row.currentRatio, filters.liquidity.currentRatio)) return false;
    if (!matchesRange(row.quickRatio, filters.liquidity.quickRatio)) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Query entry-point
// ---------------------------------------------------------------------------

const MAX_RESULTS = 200;

export function filterScreenerRows(
  rows: ScreenerRow[],
  rawFilters: ScreenerFilters,
): ScreenerResult {
  const filters = normalizeScreenerFilters(rawFilters);
  const matched = rows.filter((row) => matchesScreenerFilters(row, filters));

  return {
    filtersApplied: filters,
    rows: matched.slice(0, MAX_RESULTS),
    totalMatched: matched.length,
  };
}
