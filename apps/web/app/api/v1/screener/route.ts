/**
 * GET /api/v1/screener
 *
 * Public v1 stock-screener endpoint. Returns the `ScreenerResult` envelope
 * declared in `packages/schemas/src/api/screener.ts`:
 *
 *   { filtersApplied, rows, totalMatched }
 *
 * The contract does not declare an `apiVersion` / `generatedAt` wrapper —
 * adding one would broaden the response beyond the read model and violate
 * the Day 73 rollback rule. The `filtersApplied` field itself is the public
 * echo of the server-side normalized filter tree.
 *
 * Query parameters
 * ----------------
 * Per metric, `min{Field}` and `max{Field}` are accepted as finite numbers
 * (either bound is optional):
 *
 *   size      — minMarketCap,   maxMarketCap,
 *               minRevenue,     maxRevenue,
 *               minAssets,      maxAssets
 *   growth    — minRevenueGrowth, maxRevenueGrowth,
 *               minEarningsGrowth, maxEarningsGrowth
 *   margin    — minGrossMargin,   maxGrossMargin,
 *               minOperatingMargin, maxOperatingMargin,
 *               minNetMargin,     maxNetMargin
 *   leverage  — minLiabilitiesToEquity, maxLiabilitiesToEquity,
 *               minLiabilitiesToAssets, maxLiabilitiesToAssets
 *   liquidity — minCurrentRatio,  maxCurrentRatio,
 *               minQuickRatio,    maxQuickRatio
 *
 * Growth and margin values are decimals (e.g. `minRevenueGrowth=0.10` for
 * "at least 10%"), matching the internal read model and the screener page.
 *
 * `min{Field}` must be `<= max{Field}` when both are present, enforced by
 * `normalizeScreenerFilters`.
 *
 * Pure helpers (query parsing, sample rows, envelope building) live in
 * `./helpers.ts` so Next.js's route-segment export rules are respected while
 * tests can still import them directly.
 */

import { NextResponse } from 'next/server';

import type { ScreenerFilters } from '../../../../lib/api/screener';

import { buildScreenerResponse, getScreenerRows, normalizeScreenerQuery } from './helpers';

export async function GET(request: Request): Promise<NextResponse> {
  let filters: ScreenerFilters;
  try {
    filters = normalizeScreenerQuery(new URL(request.url).searchParams);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid query' },
      { status: 400 },
    );
  }

  try {
    const body = buildScreenerResponse(getScreenerRows(), filters);
    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}
