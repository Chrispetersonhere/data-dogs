/**
 * Screener API contract types.
 *
 * Five filter categories:
 *   size      – market-cap / revenue / assets bands
 *   growth    – revenue or earnings growth rate bounds
 *   margin    – gross / operating / net margin bounds
 *   leverage  – liabilities-to-equity / liabilities-to-assets bounds
 *   liquidity – current ratio / quick ratio bounds
 *
 * Every range uses an inclusive {min, max} pair where either side is optional.
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
