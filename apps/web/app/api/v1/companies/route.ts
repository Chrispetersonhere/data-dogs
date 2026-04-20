/**
 * GET /api/v1/companies
 *
 * Public v1 company-profile endpoint. Shapes the SEC submissions feed into the
 * `CompanyProfileResponse` envelope defined in
 * `packages/schemas/src/api/companies.ts`.
 *
 * Query parameters
 * ----------------
 *   companyId  required. CIK in any padding (digits-only or zero-padded).
 *   page       optional, default 1. 1-indexed page into `recentFilings`.
 *   pageSize   optional, default 25, clamped to `[1, 100]`. Page size for
 *              `recentFilings`.
 *
 * Provenance posture
 * ------------------
 * Exposes only public SEC-side provenance: `cik`, per-filing `accession`,
 * `filingDate`, `form`, `primaryDocument`. Never exposes internal raw-storage
 * fields (checksum, parser version, fetch timestamp, job id, surrogate keys).
 * `generatedAt` on the envelope is the API response time, not an internal
 * DB write time.
 *
 * Pure helpers (parsing, building) live in `./helpers.ts` so Next.js's
 * route-segment export rules are respected while tests can still import
 * them directly.
 */

import { NextResponse } from 'next/server';

import { getCompanyOverview } from '../../../../lib/api/company';

import {
  buildCompaniesResponse,
  normalizeCompaniesQuery,
  type CompaniesQuery,
} from './helpers';

export async function GET(request: Request): Promise<NextResponse> {
  let query: CompaniesQuery;
  try {
    query = normalizeCompaniesQuery(new URL(request.url).searchParams);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid query' },
      { status: 400 },
    );
  }

  try {
    const overview = await getCompanyOverview(query.companyId);
    const body = buildCompaniesResponse(overview, query, new Date().toISOString());
    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Upstream SEC submissions request failed: ${String(error)}` },
      { status: 502 },
    );
  }
}
