/**
 * Public API read model — company profile.
 *
 * Versioning
 * ----------
 * This module ships the v1 public contract for `GET /api/v1/companies/{companyId}`.
 * `COMPANIES_API_VERSION` is stamped on the response envelope so clients can
 * detect drift without parsing URL paths.
 *
 * What this contract intentionally does NOT expose
 * ------------------------------------------------
 * - Internal surrogate keys (row IDs, job IDs).
 * - Raw-artifact provenance (checksum, parser version, fetch timestamps,
 *   storage URIs). Those live on the internal raw layer only.
 * - Parser heuristics state (filters applied by internal code, retry counters).
 *
 * What this contract DOES expose for traceability
 * -----------------------------------------------
 * - `cik` and normalized `companyId`.
 * - Recent-filing handles that are themselves public SEC objects
 *   (`accession`, `filingDate`, `form`, `primaryDocument`).
 * - A `generatedAt` timestamp on the envelope so a caller can tell how
 *   fresh the response is. This is NOT the internal DB write time — it is
 *   the time the API generated the response.
 */

export const COMPANIES_API_VERSION = '1' as const;
export type CompaniesApiVersion = typeof COMPANIES_API_VERSION;

/**
 * Stable identifiers for a company. `cik` is the zero-padded 10-digit SEC CIK,
 * `companyId` is the same value without zero-padding (digits only).
 */
export type CompanyIdentifiers = {
  cik: string;
  companyId: string;
};

/**
 * Public-safe descriptive fields for a company. All fields are nullable where
 * the SEC submissions feed itself does not populate them, to avoid forcing
 * callers to parse sentinel strings like "unknown".
 */
export type CompanyProfile = CompanyIdentifiers & {
  name: string;
  ticker: string | null;
  exchange: string | null;
  sic: string | null;
  sicDescription: string | null;
  stateOfIncorporation: string | null;
  fiscalYearEnd: string | null;
};

/**
 * A prior company name and the effective window during which it was in use.
 * `from` / `to` are SEC-sourced ISO dates; `null` means open-ended on that side.
 */
export type CompanyIdentityHistoryEntry = {
  name: string;
  from: string | null;
  to: string | null;
};

/**
 * Aggregate summary of the company's recent filing footprint. Counts are
 * computed from the SEC submissions feed for the window the feed itself
 * returns; we do not expose the internal pagination cursor or raw window.
 */
export type CompanyFilingFootprint = {
  recentFilings: number;
  uniqueForms: number;
  annualFilings: number;
  quarterlyFilings: number;
  currentReportFilings: number;
};

/**
 * A lightweight handle on a recent filing, sufficient for lists and link-outs.
 * For full filing detail, callers should use the filings contract.
 */
export type CompanyRecentFilingSummary = {
  accession: string;
  filingDate: string;
  form: string;
  primaryDocument: string;
  primaryDocDescription: string;
};

/**
 * Top-level response envelope for the company profile endpoint.
 */
export type CompanyProfileResponse = {
  apiVersion: CompaniesApiVersion;
  generatedAt: string;
  profile: CompanyProfile;
  identityHistory: CompanyIdentityHistoryEntry[];
  filingFootprint: CompanyFilingFootprint;
  recentFilings: CompanyRecentFilingSummary[];
};
