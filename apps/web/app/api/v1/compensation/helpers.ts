/**
 * Pure helpers for the `/api/v1/compensation` route handler.
 *
 * Kept in a sibling module so Next.js's route-segment export rules (which
 * reject non-HTTP-verb / non-config exports from `route.ts`) do not force us
 * to hide pure logic from unit tests. `route.ts` re-imports from here.
 *
 * Projection layer responsibilities
 * ---------------------------------
 * - Map the internal `CompanyCompensationData` (see
 *   `apps/web/lib/api/compensation.ts`) onto the public
 *   `CompanyCompensationResponse` declared in
 *   `packages/schemas/src/api/compensation.ts`.
 * - Re-attach `form` to each row from the envelope's `sources[]`, and attach
 *   `latestFilingDate` to each history point. The internal model omits those
 *   fields on rows / history because they are redundant relative to `sources`
 *   at the internal layer; the public contract carries them per row for
 *   traceability.
 * - Do not leak any internal raw-storage provenance fields (checksums,
 *   parser versions, ingest-job ids, surrogate keys, raw HTML). None of
 *   those are on `CompanyCompensationData` today, but the projection is
 *   explicit about only copying public-safe fields.
 */
import type { CompanyCompensationData } from '../../../../lib/api/compensation';
import {
  COMPENSATION_API_VERSION,
  type CompanyCompensationResponse,
  type CompensationHistoryPoint,
  type CompensationRow,
  type CompensationSource,
} from '../../../../../../packages/schemas/src/api/compensation';

export type CompensationQuery = {
  companyId: string;
};

export function normalizeCompensationQuery(searchParams: URLSearchParams): CompensationQuery {
  const raw = searchParams.get('companyId');
  if (raw === null || raw.trim() === '') {
    throw new Error('companyId query parameter is required');
  }
  const companyId = raw.trim();
  if (!/\d/.test(companyId)) {
    throw new Error('companyId must contain at least one digit');
  }
  return { companyId };
}

type SourceIndex = Map<string, CompensationSource>;

export function indexSources(sources: CompanyCompensationData['sources']): SourceIndex {
  const out: SourceIndex = new Map();
  for (const source of sources) {
    out.set(source.accession, {
      accession: source.accession,
      filingDate: source.filingDate,
      form: source.form,
      sourceUrl: source.sourceUrl,
    });
  }
  return out;
}

export function projectCompensationRow(
  row: CompanyCompensationData['rows'][number],
  sourceIndex: SourceIndex,
): CompensationRow {
  const source = sourceIndex.get(row.accession);
  return {
    executiveName: row.executiveName,
    title: row.title,
    fiscalYear: row.fiscalYear,
    totalCompensationUsd: row.totalCompensationUsd,
    accession: row.accession,
    filingDate: row.filingDate,
    form: source?.form ?? 'DEF 14A',
    sourceUrl: row.sourceUrl,
  };
}

export function projectCompensationHistoryPoint(
  point: CompanyCompensationData['history'][number],
  sourceIndex: SourceIndex,
): CompensationHistoryPoint {
  const source = sourceIndex.get(point.latestAccession);
  return {
    executiveName: point.executiveName,
    fiscalYear: point.fiscalYear,
    totalCompensationUsd: point.totalCompensationUsd,
    latestAccession: point.latestAccession,
    latestFilingDate: source?.filingDate ?? '',
    latestSourceUrl: point.latestSourceUrl,
  };
}

export function buildCompensationResponse(
  data: CompanyCompensationData,
  generatedAt: string,
): CompanyCompensationResponse {
  const sourceIndex = indexSources(data.sources);
  return {
    apiVersion: COMPENSATION_API_VERSION,
    generatedAt,
    companyName: data.companyName,
    cik: data.cik,
    currency: 'USD',
    rows: data.rows.map((row) => projectCompensationRow(row, sourceIndex)),
    history: data.history.map((point) => projectCompensationHistoryPoint(point, sourceIndex)),
    sources: data.sources.map((source) => ({
      accession: source.accession,
      filingDate: source.filingDate,
      form: source.form,
      sourceUrl: source.sourceUrl,
    })),
  };
}
