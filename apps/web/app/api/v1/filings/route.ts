/**
 * GET /api/v1/filings
 *
 * Public v1 filings-list endpoint. Shapes the SEC submissions feed into the
 * `FilingsListResponse` envelope defined in
 * `packages/schemas/src/api/filings.ts`.
 *
 * Query parameters
 * ----------------
 *   issuer     required. CIK in any padding (digits-only or zero-padded).
 *   formType   optional. Single value or comma-joined list (case-insensitive).
 *   dateFrom   optional. YYYY-MM-DD.
 *   dateTo     optional. YYYY-MM-DD. Must be >= dateFrom when both present.
 *   accession  optional. Exact accession-number match.
 *   page       optional, default 1. 1-indexed page.
 *   pageSize   optional, default 50, clamped to `[1, 200]`.
 *
 * Provenance posture
 * ------------------
 * Returns only public SEC-side handles: accession, filingDate, formType,
 * primaryDocument, primaryDocDescription, and the two canonical SEC URLs
 * (`primaryDocUrl`, `filingIndexUrl`). Never returns raw-artifact storage
 * keys, checksums, parser versions, ingest job IDs, or internal surrogate
 * keys.
 *
 * Pure helpers (parsing, URL building, projection) live in `./helpers.ts`
 * so Next.js's route-segment export rules are respected while tests can
 * still import them directly.
 */

import { NextResponse } from 'next/server';

import { queryFilings } from '../../../../lib/api/filings';

import {
  buildFilingsResponse,
  normalizeFilingsQuery,
  type FilingsQueryNormalized,
} from './helpers';

export async function GET(request: Request): Promise<NextResponse> {
  let query: FilingsQueryNormalized;
  try {
    query = normalizeFilingsQuery(new URL(request.url).searchParams);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid query' },
      { status: 400 },
    );
  }

  try {
    // `queryFilings` normalizes, fetches and filters against SEC.
    const result = await queryFilings({
      issuer: query.filters.issuerCik,
      formType: [...query.filters.formTypes],
      dateFrom: query.filters.dateFrom ?? undefined,
      dateTo: query.filters.dateTo ?? undefined,
      accession: query.filters.accession ?? undefined,
    });
    const response = buildFilingsResponse(result.filings, query, new Date().toISOString());
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Upstream SEC submissions request failed: ${String(error)}` },
      { status: 502 },
    );
  }
}
