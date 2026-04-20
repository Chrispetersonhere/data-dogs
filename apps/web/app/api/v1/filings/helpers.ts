/**
 * Pure helpers for the `/api/v1/filings` route handler.
 *
 * Kept in a sibling module so Next.js's route-segment export rules (which
 * reject non-HTTP-verb / non-config exports from `route.ts`) do not force us
 * to hide pure logic from unit tests. `route.ts` re-imports from here.
 */

import {
  normalizeFilingQueryFilters,
  type FilingRecord as InternalFilingRecord,
  type NormalizedFilingQueryFilters,
} from '../../../../lib/api/filings';
import {
  FILINGS_API_VERSION,
  type FilingRecord,
  type FilingsFiltersApplied,
  type FilingsListResponse,
} from '../../../../../../packages/schemas/src/api/filings';

import { clampPageSize, parsePositiveInt } from '../companies/helpers';

export const FILINGS_DEFAULT_PAGE_SIZE = 50;
export const FILINGS_MAX_PAGE_SIZE = 200;

export type FilingsQueryNormalized = {
  filters: NormalizedFilingQueryFilters;
  page: number;
  pageSize: number;
};

export function normalizeFilingsQuery(searchParams: URLSearchParams): FilingsQueryNormalized {
  const issuer = searchParams.get('issuer');
  if (issuer === null || issuer.trim() === '') {
    throw new Error('issuer query parameter is required');
  }

  const filters = normalizeFilingQueryFilters({
    issuer,
    formType: searchParams.get('formType') ?? undefined,
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
    accession: searchParams.get('accession') ?? undefined,
  });

  const page = parsePositiveInt(searchParams.get('page'), 1, 'page');
  const pageSize = clampPageSize(
    parsePositiveInt(searchParams.get('pageSize'), FILINGS_DEFAULT_PAGE_SIZE, 'pageSize'),
    FILINGS_MAX_PAGE_SIZE,
  );
  return { filters, page, pageSize };
}

/**
 * Build the canonical SEC primary-document URL for a filing.
 * SEC archive URLs use the non-zero-padded integer CIK and the accession
 * number with dashes stripped.
 */
export function buildPrimaryDocUrl(
  cikPadded: string,
  accession: string,
  primaryDocument: string,
): string {
  const cikInt = String(Number.parseInt(cikPadded, 10));
  const accessionNoDashes = accession.replace(/-/g, '');
  const doc = primaryDocument.trim();
  if (!doc) {
    return `https://www.sec.gov/Archives/edgar/data/${cikInt}/${accessionNoDashes}/`;
  }
  return `https://www.sec.gov/Archives/edgar/data/${cikInt}/${accessionNoDashes}/${doc}`;
}

/**
 * Build the canonical SEC filing-index URL (the `{accession}-index.htm` page
 * the EDGAR browse UI links to).
 */
export function buildFilingIndexUrl(cikPadded: string, accession: string): string {
  const cikInt = String(Number.parseInt(cikPadded, 10));
  const accessionNoDashes = accession.replace(/-/g, '');
  return `https://www.sec.gov/Archives/edgar/data/${cikInt}/${accessionNoDashes}/${accession}-index.htm`;
}

export function projectFilingRecord(row: InternalFilingRecord): FilingRecord {
  return {
    issuerCik: row.issuerCik,
    accession: row.accession,
    filingDate: row.filingDate,
    formType: row.formType,
    primaryDocument: row.primaryDocument,
    primaryDocDescription: row.primaryDocDescription,
    primaryDocUrl: buildPrimaryDocUrl(row.issuerCik, row.accession, row.primaryDocument),
    filingIndexUrl: buildFilingIndexUrl(row.issuerCik, row.accession),
  };
}

export function buildFilingsFiltersApplied(
  filters: NormalizedFilingQueryFilters,
): FilingsFiltersApplied {
  return {
    issuerCik: filters.issuerCik,
    formTypes: [...filters.formTypes].sort(),
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    accession: filters.accession,
  };
}

/**
 * `rows` are assumed to be already filtered by the caller (see `queryFilings`).
 * This function only applies pagination and the public projection.
 */
export function buildFilingsResponse(
  rows: InternalFilingRecord[],
  query: FilingsQueryNormalized,
  generatedAt: string,
): FilingsListResponse {
  const start = (query.page - 1) * query.pageSize;
  const sliced = rows.slice(start, start + query.pageSize);
  return {
    apiVersion: FILINGS_API_VERSION,
    generatedAt,
    filtersApplied: buildFilingsFiltersApplied(query.filters),
    filings: sliced.map(projectFilingRecord),
  };
}
