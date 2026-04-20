/**
 * GET /api/v1/financials
 *
 * Public v1 annual-financial-statements endpoint. Shapes the SEC XBRL
 * `companyfacts` feed into the `CompanyFinancialsResponse` envelope defined
 * in `packages/schemas/src/api/financials.ts`.
 *
 * Query parameters
 * ----------------
 *   companyId  required. CIK in any padding (digits-only or zero-padded).
 *   years      optional. Positive integer, 1..8. How many most-recent fiscal
 *              years to return. Default 4, matching the financials page.
 *
 * Provenance posture
 * ------------------
 * Exposes:
 *   - `provenance.sourceUrl` — the exact SEC companyfacts URL that seeded
 *     this response.
 *   - `provenance.fetchedAt` — the server-side fetch time (ISO 8601), so
 *     callers can distinguish view staleness from filing age.
 *   - `years` — the exact fiscal-year set the view covers.
 *
 * Does NOT expose:
 *   - Raw XBRL concept keys (e.g. `us-gaap:Revenues`). Rows carry stable
 *     labels only. Concept mapping is an internal detail.
 *   - Per-concept FactPoint trees, filing unit strings, raw period envelopes.
 *   - Parser/ingest-job metadata, checksums, internal storage keys.
 *
 * Pure helpers (parsing, concept matching, consistency check, envelope
 * building) live in `./helpers.ts` so Next.js's route-segment export rules
 * are respected while tests can still import them directly.
 */

import { NextResponse } from 'next/server';

import {
  buildCompanyFactsUrl,
  buildFinancialsResponse,
  normalizeFinancialsQuery,
  padCik,
  type CompanyFactsResponse,
  type FinancialsQuery,
} from './helpers';

function secUserAgent(): string {
  return process.env.SEC_USER_AGENT?.trim() || 'DataDogs/1.0 (contact: engineering@datadogs.local)';
}

export async function GET(request: Request): Promise<NextResponse> {
  let query: FinancialsQuery;
  try {
    query = normalizeFinancialsQuery(new URL(request.url).searchParams);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid query' },
      { status: 400 },
    );
  }

  const cikPadded = padCik(query.companyId);
  const sourceUrl = buildCompanyFactsUrl(cikPadded);

  let payload: CompanyFactsResponse;
  let fetchedAt: string;
  try {
    const response = await fetch(sourceUrl, {
      method: 'GET',
      headers: {
        'User-Agent': secUserAgent(),
        Accept: 'application/json',
      },
      next: { revalidate: 300 },
    });
    fetchedAt = new Date().toISOString();
    if (!response.ok) {
      throw new Error(`SEC companyfacts request failed (${response.status}) for CIK ${cikPadded}`);
    }
    payload = (await response.json()) as CompanyFactsResponse;
  } catch (error) {
    return NextResponse.json(
      { error: `Upstream SEC companyfacts request failed: ${String(error)}` },
      { status: 502 },
    );
  }

  try {
    const body = buildFinancialsResponse({
      payload,
      cikPadded,
      sourceUrl,
      fetchedAt,
      generatedAt: new Date().toISOString(),
      maxYears: query.years,
    });
    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}
