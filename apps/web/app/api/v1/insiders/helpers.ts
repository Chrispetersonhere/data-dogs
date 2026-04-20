/**
 * Pure helpers for the `/api/v1/insiders` route handler.
 *
 * Kept in a sibling module so Next.js's route-segment export rules (which
 * reject non-HTTP-verb / non-config exports from `route.ts`) do not force us
 * to hide pure logic from unit tests. `route.ts` re-imports from here.
 *
 * Projection layer responsibilities
 * ---------------------------------
 * - Map the internal `InsiderActivityRow` (see
 *   `apps/web/lib/api/insiders.ts`) onto the public `InsiderActivityRow`
 *   declared in `packages/schemas/src/api/insiders.ts`.
 * - Derive a stable `transactionClass` label from `transactionCode` ×
 *   `acquiredOrDisposed` × `isDerivative`. The internal row carries the raw
 *   Section 16 code; the public contract only exposes a narrow enum
 *   (`buy | sell | grant | derivative_event | holdings_change | ambiguous`).
 * - Do not leak any internal raw-storage provenance: `rawInsiderArtifactId`,
 *   `sourceChecksum`, `parserVersion`, `ingestJobId`, `sourceFetchedAt`,
 *   `normalizerVersion`, internal `insiderId`, or raw XML. None of those
 *   live on `InsiderActivityRow` today, but the projection only copies
 *   fields the public contract declares.
 */

import {
  normalizeInsiderRoleFilter,
  type CompanyInsidersData,
  type InsiderRoleFilter,
  type InsiderActivityRow as InternalInsiderActivityRow,
} from '../../../../lib/api/insiders';
import {
  INSIDERS_API_VERSION,
  type CompanyInsidersResponse,
  type InsiderActivityRow,
  type InsiderTransactionClass,
} from '../../../../../../packages/schemas/src/api/insiders';

export type InsidersQuery = {
  companyId: string;
  role: InsiderRoleFilter;
};

export function normalizeInsidersQuery(searchParams: URLSearchParams): InsidersQuery {
  const raw = searchParams.get('companyId');
  if (raw === null || raw.trim() === '') {
    throw new Error('companyId query parameter is required');
  }
  const companyId = raw.trim();
  if (!/\d/.test(companyId)) {
    throw new Error('companyId must contain at least one digit');
  }
  const role = normalizeInsiderRoleFilter(searchParams.get('role'));
  return { companyId, role };
}

/**
 * Classify an insider activity row into the narrow public enum.
 *
 * Policy (stable projection):
 *   derivative flag set                                          -> derivative_event
 *   no code AND no shares AND no direction                       -> holdings_change
 *   code ∈ {A, M, X, G} AND direction = A                        -> grant
 *   code = P AND direction = A                                   -> buy
 *   code = S AND direction = D                                   -> sell
 *   otherwise                                                    -> ambiguous
 */
export function classifyTransaction(
  row: Pick<InternalInsiderActivityRow, 'transactionCode' | 'acquiredOrDisposed' | 'isDerivative' | 'shares'>,
): InsiderTransactionClass {
  if (row.isDerivative) {
    return 'derivative_event';
  }
  if (row.transactionCode === null && row.shares === null && row.acquiredOrDisposed === null) {
    return 'holdings_change';
  }
  const code = row.transactionCode ?? '';
  const dir = row.acquiredOrDisposed;
  if (dir === 'A' && (code === 'A' || code === 'M' || code === 'X' || code === 'G')) {
    return 'grant';
  }
  if (dir === 'A' && code === 'P') {
    return 'buy';
  }
  if (dir === 'D' && code === 'S') {
    return 'sell';
  }
  return 'ambiguous';
}

export function projectInsiderRow(row: InternalInsiderActivityRow): InsiderActivityRow {
  return {
    reporterName: row.reporterName,
    reporterCik: row.reporterCik,
    officerTitle: row.officerTitle,
    roles: {
      isDirector: row.roles.isDirector,
      isOfficer: row.roles.isOfficer,
      isTenPercentOwner: row.roles.isTenPercentOwner,
      isOther: row.roles.isOther,
    },
    securityTitle: row.securityTitle,
    transactionDate: row.transactionDate,
    transactionCode: row.transactionCode,
    acquiredOrDisposed: row.acquiredOrDisposed,
    shares: row.shares,
    pricePerShare: row.pricePerShare,
    sharesOwnedAfter: row.sharesOwnedAfter,
    isDerivative: row.isDerivative,
    transactionClass: classifyTransaction(row),
    accession: row.accession,
    filingDate: row.filingDate,
    form: row.form,
    primaryDocument: row.primaryDocument,
    primaryDocUrl: row.primaryDocUrl,
    filingIndexUrl: row.filingIndexUrl,
    issuerCik: row.issuerCik,
  };
}

export function buildInsidersResponse(
  data: CompanyInsidersData,
  generatedAt: string,
): CompanyInsidersResponse {
  return {
    apiVersion: INSIDERS_API_VERSION,
    generatedAt,
    companyName: data.companyName,
    cik: data.cik,
    role: data.role,
    rows: data.rows.map(projectInsiderRow),
    sources: data.sources.map((source) => ({
      accession: source.accession,
      form: source.form,
      filingDate: source.filingDate,
      primaryDocUrl: source.primaryDocUrl,
      filingIndexUrl: source.filingIndexUrl,
    })),
  };
}
