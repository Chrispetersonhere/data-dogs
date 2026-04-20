/**
 * Public API read model — executive compensation.
 *
 * Versioning
 * ----------
 * v1 public contract for `GET /api/v1/companies/{companyId}/compensation`. The
 * envelope carries `COMPENSATION_API_VERSION` so clients can detect drift.
 *
 * What this contract intentionally does NOT expose
 * ------------------------------------------------
 * - Internal DB surrogate keys (`compSummaryId`, `executiveId`,
 *   `compAwardId`, `executiveRoleHistoryId`). Those live on the domain
 *   schema only and are not stable across redeploys or re-ingests.
 * - Raw-storage provenance: `sourceChecksum`, `parserVersion`,
 *   `ingestJobId`, `recordedAt`. Clients should not gate logic on any of
 *   those — they are internal ingestion hygiene fields.
 * - Parser heuristics state (which table shape matched, how many rows were
 *   rejected, which regex passes fired).
 * - Component-level Summary Compensation Table breakdowns. v1 publishes the
 *   top-line `totalCompensationUsd` only; breakdowns are a v2 candidate
 *   once the parser stabilises across irregular issuer layouts.
 *
 * What this contract DOES expose for traceability
 * -----------------------------------------------
 * - `accession`, `filingDate`, `form`, and `sourceUrl` on every row, so
 *   every rendered number ties back to one specific SEC proxy filing.
 * - A `sources[]` list on the envelope echoing the filings consulted, so a
 *   caller can audit "which filings did this response consider" without
 *   re-running the parser.
 */

export const COMPENSATION_API_VERSION = '1' as const;
export type CompensationApiVersion = typeof COMPENSATION_API_VERSION;

/**
 * SEC proxy-statement form types the v1 compensation endpoint reads from.
 * Exposed as a literal union so clients can switch on the value.
 */
export type CompensationFilingForm = 'DEF 14A' | 'DEFA14A';

/**
 * Public-safe provenance tuple attached to each compensation row. Only public
 * SEC identifiers — no checksum, no parser version, no job id.
 */
export type CompensationRowProvenance = {
  accession: string;
  filingDate: string;
  form: CompensationFilingForm | (string & {});
  sourceUrl: string;
};

/**
 * A single Summary-Compensation-Table row extracted from a proxy filing.
 * `title` is the best-effort title for the executive; v1 emits a narrow set
 * (`Chief Executive Officer`, `Chief Financial Officer`, `Chief Operating
 * Officer`, `President`, `Named Executive Officer`) so the field is stable
 * even when the underlying proxy wording varies.
 */
export type CompensationRow = CompensationRowProvenance & {
  executiveName: string;
  title: string;
  fiscalYear: number;
  totalCompensationUsd: number;
};

/**
 * A single (executive, fiscal year) point in the cross-filing history series.
 *
 * The history can span multiple filings; `latest*` fields carry the most
 * recent filing that contributed the point, so the UI can deep-link back to
 * it. They are the public-safe projection of the internal row-level
 * provenance.
 */
export type CompensationHistoryPoint = {
  executiveName: string;
  fiscalYear: number;
  totalCompensationUsd: number;
  latestAccession: string;
  latestFilingDate: string;
  latestSourceUrl: string;
};

/**
 * One filing the response's rows were extracted from. Echoed so callers can
 * audit "which proxy filings did this response consider", independent of how
 * many rows each filing contributed.
 */
export type CompensationSource = {
  accession: string;
  filingDate: string;
  form: CompensationFilingForm | (string & {});
  sourceUrl: string;
};

/**
 * Top-level response envelope for the company compensation endpoint.
 */
export type CompanyCompensationResponse = {
  apiVersion: CompensationApiVersion;
  generatedAt: string;
  companyName: string;
  cik: string;
  currency: 'USD';
  rows: CompensationRow[];
  history: CompensationHistoryPoint[];
  sources: CompensationSource[];
};
