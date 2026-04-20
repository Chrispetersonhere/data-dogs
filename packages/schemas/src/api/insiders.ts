/**
 * Public API read model — insider activity (Form 3 / 4 / 5).
 *
 * Versioning
 * ----------
 * v1 public contract for `GET /api/v1/companies/{companyId}/insiders`. The
 * envelope carries `INSIDERS_API_VERSION` so clients can detect drift.
 *
 * What this contract intentionally does NOT expose
 * ------------------------------------------------
 * - Internal raw-storage keys: `rawInsiderArtifactId`, `sourceChecksum`,
 *   `parserVersion`, `ingestJobId`, `sourceFetchedAt`, `recordedAt`. All of
 *   those live on the internal `services/market-data` raw + normalized
 *   layers and are not part of any public contract.
 * - Internal insider surrogate IDs (`insiderId`). `reporterCik` is the
 *   public cross-filing identity.
 * - The raw XML tree, payload blob, or parser pass results.
 * - Internal normalization bookkeeping (`normalizerVersion`,
 *   `normalized_at`). Publishable normalization output is the
 *   `transactionClass` enum below, which is a stable projection of the
 *   underlying transaction-code × acquired/disposed mapping.
 *
 * What this contract DOES expose for traceability
 * -----------------------------------------------
 * - Every row carries `accession`, `filingDate`, `form`, `primaryDocUrl`, and
 *   `filingIndexUrl`, so a consumer can link straight back to the SEC source.
 * - The envelope's `sources[]` echoes the filings the response considered,
 *   independent of which ones produced parseable transactions.
 */

export const INSIDERS_API_VERSION = '1' as const;
export type InsidersApiVersion = typeof INSIDERS_API_VERSION;

/**
 * Discrete role filter accepted by the insiders endpoint. Mirrors the five
 * public SEC Section 16 role categories; the API normalizes arbitrary input
 * (empty, unknown, mixed case) to `all`.
 */
export type InsiderRoleFilter = 'all' | 'director' | 'officer' | 'ten_percent_owner' | 'other';

export const INSIDER_ROLE_FILTERS: readonly InsiderRoleFilter[] = [
  'all',
  'director',
  'officer',
  'ten_percent_owner',
  'other',
] as const;

/**
 * Declared role flags for a reporter, sourced from the
 * `<reportingOwnerRelationship>` section of a Form 3/4/5 XML. All four flags
 * can be true simultaneously.
 */
export type InsiderRoleFlags = {
  isDirector: boolean;
  isOfficer: boolean;
  isTenPercentOwner: boolean;
  isOther: boolean;
};

/**
 * SEC Form 3/4/5 acquired/disposed indicator. `null` for holdings-only rows
 * and for transactions the XML did not tag.
 */
export type InsiderAcquiredOrDisposed = 'A' | 'D';

/**
 * Canonical transaction class, derived from `transactionCode` × acquired/
 * disposed direction by the internal normalizer. `ambiguous` is an explicit,
 * first-class value — callers should not treat it as missing data.
 *
 * This contract intentionally narrows a wide internal code space into a
 * small stable enum; it does NOT expose the normalizer's human-readable
 * "reason" text, which is internal debugging telemetry.
 */
export type InsiderTransactionClass =
  | 'buy'
  | 'sell'
  | 'grant'
  | 'derivative_event'
  | 'holdings_change'
  | 'ambiguous';

/**
 * Public-safe provenance tuple attached to each insider activity row. Only
 * public SEC identifiers — no raw artifact id, no checksum, no parser version,
 * no ingest job id, no internal fetch timestamp.
 */
export type InsiderRowProvenance = {
  accession: string;
  filingDate: string;
  form: string;
  primaryDocument: string;
  primaryDocUrl: string;
  filingIndexUrl: string;
  issuerCik: string;
};

/**
 * A single insider activity row. `shares`, `pricePerShare`, and
 * `sharesOwnedAfter` are nullable because Form 4 filings legally omit them in
 * several scenarios (e.g. derivative grants without an explicit price). v1
 * does not synthesise values; callers see the SEC-reported `null` directly.
 */
export type InsiderActivityRow = InsiderRowProvenance & {
  reporterName: string;
  reporterCik: string | null;
  officerTitle: string | null;
  roles: InsiderRoleFlags;
  securityTitle: string | null;
  transactionDate: string;
  transactionCode: string | null;
  acquiredOrDisposed: InsiderAcquiredOrDisposed | null;
  shares: number | null;
  pricePerShare: number | null;
  sharesOwnedAfter: number | null;
  isDerivative: boolean;
  transactionClass: InsiderTransactionClass;
};

/**
 * One filing considered by the response, irrespective of whether it produced
 * any activity rows. Useful for auditing drilldown completeness.
 */
export type InsiderFilingSource = {
  accession: string;
  form: string;
  filingDate: string;
  primaryDocUrl: string;
  filingIndexUrl: string;
};

/**
 * Top-level response envelope for the insider activity endpoint.
 */
export type CompanyInsidersResponse = {
  apiVersion: InsidersApiVersion;
  generatedAt: string;
  companyName: string;
  cik: string;
  role: InsiderRoleFilter;
  rows: InsiderActivityRow[];
  sources: InsiderFilingSource[];
};
