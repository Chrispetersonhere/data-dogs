import assert from 'node:assert/strict';
import test from 'node:test';

import type { ScreenerRow } from '../lib/api/screener';

import {
  filterScreenerRows,
  matchesScreenerFilters,
  normalizeScreenerFilters,
} from '../lib/api/screener';

// ---------------------------------------------------------------------------
// Sample rows
// ---------------------------------------------------------------------------

const SAMPLE_ROWS: ScreenerRow[] = [
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
    companyId: '0000001',
    ticker: null,
    name: 'Tiny Startup Inc.',
    marketCap: 50_000_000,
    revenue: 10_000_000,
    assets: 20_000_000,
    revenueGrowth: null,
    earningsGrowth: null,
    grossMargin: null,
    operatingMargin: null,
    netMargin: null,
    liabilitiesToEquity: null,
    liabilitiesToAssets: null,
    currentRatio: null,
    quickRatio: null,
  },
];

// ---------------------------------------------------------------------------
// normalizeScreenerFilters
// ---------------------------------------------------------------------------

test('normalizeScreenerFilters passes through valid filters unchanged', () => {
  const filters = normalizeScreenerFilters({
    size: { revenue: { min: 100_000_000 } },
    margin: { grossMargin: { min: 0.3, max: 0.8 } },
  });

  assert.deepEqual(filters.size?.revenue, { min: 100_000_000 });
  assert.deepEqual(filters.margin?.grossMargin, { min: 0.3, max: 0.8 });
});

test('normalizeScreenerFilters rejects min > max', () => {
  assert.throws(
    () => normalizeScreenerFilters({ size: { marketCap: { min: 1000, max: 500 } } }),
    /Invalid range.*min.*exceeds.*max/,
  );
});

test('normalizeScreenerFilters accepts empty filter object', () => {
  const filters = normalizeScreenerFilters({});
  assert.deepEqual(filters, {});
});

// ---------------------------------------------------------------------------
// matchesScreenerFilters – individual categories
// ---------------------------------------------------------------------------

test('size filter – market cap min', () => {
  const filters = normalizeScreenerFilters({
    size: { marketCap: { min: 2_000_000_000_000 } },
  });
  assert.equal(matchesScreenerFilters(SAMPLE_ROWS[0], filters), true); // AAPL 3T
  assert.equal(matchesScreenerFilters(SAMPLE_ROWS[2], filters), false); // AMZN 1.6T
});

test('growth filter – revenue growth bounds', () => {
  const filters = normalizeScreenerFilters({
    growth: { revenueGrowth: { min: 0.10 } },
  });
  assert.equal(matchesScreenerFilters(SAMPLE_ROWS[1], filters), true); // MSFT 15%
  assert.equal(matchesScreenerFilters(SAMPLE_ROWS[0], filters), false); // AAPL 8%
});

test('margin filter – net margin range', () => {
  const filters = normalizeScreenerFilters({
    margin: { netMargin: { min: 0.20, max: 0.40 } },
  });
  assert.equal(matchesScreenerFilters(SAMPLE_ROWS[0], filters), true); // AAPL 25%
  assert.equal(matchesScreenerFilters(SAMPLE_ROWS[1], filters), true); // MSFT 34%
  assert.equal(matchesScreenerFilters(SAMPLE_ROWS[2], filters), false); // AMZN 4%
});

test('leverage filter – liabilities-to-equity max', () => {
  const filters = normalizeScreenerFilters({
    leverage: { liabilitiesToEquity: { max: 1.5 } },
  });
  assert.equal(matchesScreenerFilters(SAMPLE_ROWS[1], filters), true); // MSFT 0.9
  assert.equal(matchesScreenerFilters(SAMPLE_ROWS[0], filters), false); // AAPL 1.8
});

test('liquidity filter – current ratio min', () => {
  const filters = normalizeScreenerFilters({
    liquidity: { currentRatio: { min: 1.5 } },
  });
  assert.equal(matchesScreenerFilters(SAMPLE_ROWS[1], filters), true); // MSFT 1.8
  assert.equal(matchesScreenerFilters(SAMPLE_ROWS[0], filters), false); // AAPL 1.0
});

// ---------------------------------------------------------------------------
// null handling
// ---------------------------------------------------------------------------

test('null metric values fail range filters', () => {
  const filters = normalizeScreenerFilters({
    growth: { revenueGrowth: { min: 0 } },
  });
  assert.equal(matchesScreenerFilters(SAMPLE_ROWS[3], filters), false); // Tiny Startup nulls
});

test('row with nulls passes when no filters applied', () => {
  assert.equal(matchesScreenerFilters(SAMPLE_ROWS[3], {}), true);
});

// ---------------------------------------------------------------------------
// Combined filters
// ---------------------------------------------------------------------------

test('combined size + margin + liquidity narrows results correctly', () => {
  const result = filterScreenerRows(SAMPLE_ROWS, {
    size: { marketCap: { min: 1_000_000_000_000 } },
    margin: { grossMargin: { min: 0.40 } },
    liquidity: { currentRatio: { min: 1.5 } },
  });

  assert.equal(result.totalMatched, 1);
  assert.equal(result.rows[0].ticker, 'MSFT');
});

// ---------------------------------------------------------------------------
// filterScreenerRows – cap and structure
// ---------------------------------------------------------------------------

test('filterScreenerRows returns correct result structure', () => {
  const result = filterScreenerRows(SAMPLE_ROWS, {});

  assert.equal(result.totalMatched, SAMPLE_ROWS.length);
  assert.equal(result.rows.length, SAMPLE_ROWS.length);
  assert.ok('filtersApplied' in result);
  assert.ok('rows' in result);
  assert.ok('totalMatched' in result);
});

test('filterScreenerRows caps output at 200 rows', () => {
  const manyRows: ScreenerRow[] = Array.from({ length: 300 }, (_, i) => ({
    companyId: String(i),
    ticker: `T${i}`,
    name: `Company ${i}`,
    marketCap: 1_000_000 * (i + 1),
    revenue: 500_000 * (i + 1),
    assets: 800_000 * (i + 1),
    revenueGrowth: 0.05,
    earningsGrowth: 0.05,
    grossMargin: 0.50,
    operatingMargin: 0.20,
    netMargin: 0.10,
    liabilitiesToEquity: 1.0,
    liabilitiesToAssets: 0.50,
    currentRatio: 1.5,
    quickRatio: 1.2,
  }));

  const result = filterScreenerRows(manyRows, {});
  assert.equal(result.rows.length, 200);
  assert.equal(result.totalMatched, 300);
});
