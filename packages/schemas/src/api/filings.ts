/**
 * Public API read model — filings list / filing summary.
 *
 * Versioning
 * ----------
 * v1 public contract for `GET /api/v1/filings`. The envelope carries
 * `FILINGS_API_VERSION` so clients can detect drift without parsing URL paths.
 *
 * What this contract intentionally does NOT expose
 * ------------------------------------------------
 * - Internal query cursors, DB row IDs, or normalized filter sets.
 * - Raw-artifact storage keys, checksums, fetch timestamps, or parser versions.
 * - Internal error-class enums (callers get a plain HTTP error shape).
 *
 * What this contract DOES expose for traceability
 * -----------------------------------------------
 * - `accession`, `filingDate`, `formType`, `primaryDocument` — all public SEC
 *   fields that identify the source filing.
 * - `primaryDocUrl` and `filingIndexUrl` — canonical SEC URLs, so a caller can
 *   link straight back to the source without reconstructing URLs.
 */

export const FILINGS_API_VERSION = '1' as const;
export type FilingsApiVersion = typeof FILINGS_API_VERSION;

/**
 * A single filing record as it appears in the public API. `formType` is the
 * SEC-canonical form string (e.g. `10-K`, `DEF 14A`, `4`).
 */
export type FilingRecord = {
  issuerCik: string;
  accession: string;
  filingDate: string;
  formType: string;
  primaryDocument: string;
  primaryDocDescription: string;
  primaryDocUrl: string;
  filingIndexUrl: string;
};

/**
 * External query parameters accepted by the filings list endpoint. `issuer`
 * accepts a CIK in any padding; the API is responsible for normalization.
 * `formType` accepts either a single value or a comma-joined list.
 */
export type FilingsQuery = {
  issuer: string;
  formType?: string | string[];
  dateFrom?: string;
  dateTo?: string;
  accession?: string;
};

/**
 * Echo of the filters the server applied, after normalization. This lets
 * clients verify that their filter was understood without exposing internal
 * representation details (e.g. `Set` instances, normalized regex groups).
 */
export type FilingsFiltersApplied = {
  issuerCik: string;
  formTypes: string[];
  dateFrom: string | null;
  dateTo: string | null;
  accession: string | null;
};

/**
 * Top-level response envelope for the filings list endpoint.
 */
export type FilingsListResponse = {
  apiVersion: FilingsApiVersion;
  generatedAt: string;
  filtersApplied: FilingsFiltersApplied;
  filings: FilingRecord[];
};
