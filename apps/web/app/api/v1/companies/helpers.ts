/**
 * Pure helpers for the `/api/v1/companies` route handler.
 *
 * Kept in a sibling module so Next.js's route-segment export rules (which
 * reject non-HTTP-verb / non-config exports from `route.ts`) do not force us
 * to hide pure logic from unit tests. `route.ts` re-imports from here.
 */

import type { CompanyOverviewData } from '../../../../lib/api/company';
import {
  COMPANIES_API_VERSION,
  type CompanyProfileResponse,
  type CompanyRecentFilingSummary,
} from '../../../../../../packages/schemas/src/api/companies';

export const COMPANIES_DEFAULT_PAGE_SIZE = 25;
export const COMPANIES_MAX_PAGE_SIZE = 100;

export type CompaniesQuery = {
  companyId: string;
  page: number;
  pageSize: number;
};

export function parsePositiveInt(raw: string | null, fallback: number, fieldName: string): number {
  if (raw === null || raw.trim() === '') {
    return fallback;
  }
  const trimmed = raw.trim();
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || String(parsed) !== trimmed) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
  return parsed;
}

export function clampPageSize(size: number, max: number = COMPANIES_MAX_PAGE_SIZE): number {
  if (size < 1) {
    throw new Error('pageSize must be >= 1');
  }
  return size > max ? max : size;
}

export function normalizeCompaniesQuery(searchParams: URLSearchParams): CompaniesQuery {
  const raw = searchParams.get('companyId');
  if (raw === null || raw.trim() === '') {
    throw new Error('companyId query parameter is required');
  }
  const companyId = raw.trim();
  if (!/\d/.test(companyId)) {
    throw new Error('companyId must contain at least one digit');
  }
  const page = parsePositiveInt(searchParams.get('page'), 1, 'page');
  const pageSize = clampPageSize(
    parsePositiveInt(searchParams.get('pageSize'), COMPANIES_DEFAULT_PAGE_SIZE, 'pageSize'),
  );
  return { companyId, page, pageSize };
}

export function buildCompaniesResponse(
  overview: CompanyOverviewData,
  query: CompaniesQuery,
  generatedAt: string,
): CompanyProfileResponse {
  const allRecent: CompanyRecentFilingSummary[] = overview.latestFilingsSummary.map((filing) => ({
    accession: filing.accessionNumber,
    filingDate: filing.filingDate,
    form: filing.form,
    primaryDocument: filing.primaryDocument,
    primaryDocDescription: filing.primaryDocDescription,
  }));

  const start = (query.page - 1) * query.pageSize;
  const sliced = allRecent.slice(start, start + query.pageSize);

  return {
    apiVersion: COMPANIES_API_VERSION,
    generatedAt,
    profile: {
      cik: overview.issuerMetadata.cik,
      companyId: overview.issuerMetadata.companyId,
      name: overview.issuerMetadata.name,
      ticker: overview.issuerMetadata.ticker,
      exchange: overview.issuerMetadata.exchange,
      sic: overview.issuerMetadata.sic,
      sicDescription: overview.issuerMetadata.sicDescription,
      stateOfIncorporation: overview.issuerMetadata.stateOfIncorporation,
      fiscalYearEnd: overview.issuerMetadata.fiscalYearEnd,
    },
    identityHistory: overview.identityHistorySummary,
    filingFootprint: overview.filingCountSummary,
    recentFilings: sliced,
  };
}
