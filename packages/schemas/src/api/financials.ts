/**
 * Public API read model — annual financial statements view.
 *
 * Versioning
 * ----------
 * v1 public contract for `GET /api/v1/companies/{companyId}/financials`. The
 * envelope carries `FINANCIALS_API_VERSION` so clients can detect drift.
 *
 * What this contract intentionally does NOT expose
 * ------------------------------------------------
 * - Raw XBRL concept keys (e.g. `us-gaap:Revenues`, `us-gaap:ProfitLoss`).
 *   Callers see stable labels; concept-to-label mapping is an internal detail.
 * - Per-concept `FactPoint` arrays, the SEC `companyfacts` JSON tree, filing
 *   unit strings, or raw period envelopes (`fy`, `fp`, `form`, `filed`).
 * - Parser-version / ingest-job / checksum metadata for the underlying facts.
 * - Internal per-metric fallback lists and unit coercion state.
 *
 * What this contract DOES expose for traceability
 * -----------------------------------------------
 * - `sourceUrl` — the public SEC `companyfacts` endpoint that seeded the view.
 * - `fetchedAt` — the UTC timestamp at which the server pulled `companyfacts`,
 *   so analysts can distinguish view staleness from filing age.
 * - `years[]` — the exact fiscal-year set the view covers.
 * - `consistency` — a cheap balance-sheet sanity check (`assets ≈ liabilities +
 *   equity`) so callers can tell when the labelled view disagrees with the
 *   underlying facts.
 */

export const FINANCIALS_API_VERSION = '1' as const;
export type FinancialsApiVersion = typeof FINANCIALS_API_VERSION;

/**
 * The three statement surfaces the v1 API exposes. Stable IDs so clients can
 * key UI tabs and filters against the contract instead of the label.
 */
export type FinancialsStatementId = 'income' | 'balance' | 'cashflow';

/**
 * A single metric row in a statement. `valuesByYear` is a sparse map — only
 * years where the metric was populated appear. Units are always USD for v1;
 * the dimension is declared on the envelope, not per-row, to keep rows lean.
 */
export type FinancialsMetricRow = {
  label: string;
  valuesByYear: Record<number, number>;
};

/**
 * A statement block (one of income, balance, cash flow) with its ordered rows.
 */
export type FinancialsStatement = {
  id: FinancialsStatementId;
  title: string;
  rows: FinancialsMetricRow[];
};

/**
 * Per-response provenance. All fields here are public SEC URLs or UTC
 * timestamps; no internal storage keys.
 */
export type FinancialsProvenance = {
  sourceUrl: string;
  fetchedAt: string;
};

/**
 * Result of the inexpensive balance-sheet consistency check.
 *
 * - `ok`          — `assets` ≈ `liabilities + equity` within tolerance for
 *                   every year present.
 * - `incomplete`  — one or more of the three components was missing for the
 *                   years checked, so equality could not be evaluated.
 * - `mismatch`    — all three components were present but the equality did
 *                   not hold within tolerance for at least one year.
 */
export type FinancialsConsistencyStatus = 'ok' | 'incomplete' | 'mismatch';

export type FinancialsConsistency = {
  status: FinancialsConsistencyStatus;
  message: string;
};

/**
 * Top-level response envelope for the annual financials endpoint.
 *
 * `currency` and `units` are declared here (not on each row) because every
 * metric in the v1 view is a USD currency amount. If v2 introduces non-USD or
 * non-currency metrics, the contract should expand rather than overload these
 * envelope fields.
 */
export type CompanyFinancialsResponse = {
  apiVersion: FinancialsApiVersion;
  generatedAt: string;
  companyName: string;
  cik: string;
  currency: 'USD';
  units: 'currency';
  years: number[];
  statements: FinancialsStatement[];
  consistency: FinancialsConsistency;
  provenance: FinancialsProvenance;
};
