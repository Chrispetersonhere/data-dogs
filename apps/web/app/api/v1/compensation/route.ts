/**
 * GET /api/v1/compensation
 *
 * Public v1 executive-compensation endpoint. Shapes parsed SEC proxy-statement
 * Summary Compensation Table rows into the `CompanyCompensationResponse`
 * envelope defined in `packages/schemas/src/api/compensation.ts`.
 *
 * Query parameters
 * ----------------
 *   companyId  required. CIK in any padding (digits-only or zero-padded).
 *
 * Provenance posture
 * ------------------
 * Exposes only public SEC-side handles on every row and history point:
 * `accession`, `filingDate`, `form`, `sourceUrl`. Never exposes parser
 * heuristics state, component-level Summary Compensation Table breakdowns,
 * internal surrogate keys, checksums, parser versions, ingest-job IDs, or
 * raw HTML artifacts. `generatedAt` is the API response time, not an
 * internal DB write time.
 *
 * Pure helpers (parsing, projection, envelope building) live in
 * `./helpers.ts` so Next.js's route-segment export rules are respected while
 * tests can still import them directly.
 */

import { NextResponse } from 'next/server';

import { getCompanyCompensation } from '../../../../lib/api/compensation';

import {
  buildCompensationResponse,
  normalizeCompensationQuery,
  type CompensationQuery,
} from './helpers';

export async function GET(request: Request): Promise<NextResponse> {
  let query: CompensationQuery;
  try {
    query = normalizeCompensationQuery(new URL(request.url).searchParams);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid query' },
      { status: 400 },
    );
  }

  try {
    const data = await getCompanyCompensation(query.companyId);
    const body = buildCompensationResponse(data, new Date().toISOString());
    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Upstream SEC compensation request failed: ${String(error)}` },
      { status: 502 },
    );
  }
}
