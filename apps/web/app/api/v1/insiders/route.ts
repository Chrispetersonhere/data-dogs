/**
 * GET /api/v1/insiders
 *
 * Public v1 insider-activity endpoint. Shapes parsed SEC Form 3/4/5 rows into
 * the `CompanyInsidersResponse` envelope defined in
 * `packages/schemas/src/api/insiders.ts`.
 *
 * Query parameters
 * ----------------
 *   companyId  required. CIK in any padding (digits-only or zero-padded).
 *   role       optional. One of the `InsiderRoleFilter` values
 *              (`all | director | officer | ten_percent_owner | other`).
 *              Unknown / empty values normalize to `all`, matching the UI.
 *
 * Provenance posture
 * ------------------
 * Exposes only public SEC-side handles on every row: `accession`,
 * `filingDate`, `form`, `primaryDocument`, `primaryDocUrl`, `filingIndexUrl`,
 * `issuerCik`. Never exposes raw XML, internal surrogate IDs, parser /
 * normalizer versions, ingest-job IDs, source checksums, or internal fetch
 * timestamps. `generatedAt` is the API response time, not an internal DB
 * write time.
 *
 * Pure helpers (parsing, projection, transaction classification, envelope
 * building) live in `./helpers.ts` so Next.js's route-segment export rules
 * are respected while tests can still import them directly.
 */

import { NextResponse } from 'next/server';

import { getCompanyInsiders } from '../../../../lib/api/insiders';

import {
  buildInsidersResponse,
  normalizeInsidersQuery,
  type InsidersQuery,
} from './helpers';

export async function GET(request: Request): Promise<NextResponse> {
  let query: InsidersQuery;
  try {
    query = normalizeInsidersQuery(new URL(request.url).searchParams);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid query' },
      { status: 400 },
    );
  }

  try {
    const data = await getCompanyInsiders(query.companyId, query.role);
    const body = buildInsidersResponse(data, new Date().toISOString());
    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Upstream SEC insiders request failed: ${String(error)}` },
      { status: 502 },
    );
  }
}
