/**
 * Headline-fundamentals reader for the public `/company/[companyId]` page.
 *
 * Pulls the SEC XBRL `companyfacts` JSON (same endpoint the
 * `/api/v1/financials` route uses) and projects the most-recent annual
 * (10-K) value for a curated set of metrics — Revenue, Net income, Total
 * assets, Cash, Shareholders' equity. The page renders these alongside
 * provenance receipts (source URL, accession, filed date) so a visitor
 * can trace every figure to the exact filing it came from.
 *
 * Why a separate module rather than reusing `apps/web/app/api/v1/financials/helpers.ts`?
 *   - The public API helpers expose an envelope shaped for a paginated JSON
 *     response (statements / metrics / years grid). The page wants a tiny
 *     "headline" view: 5 numbers, each with its own provenance fields.
 *   - Importing route-handler helpers into a server-component page leads to
 *     awkward circular dependencies in Next 16 — keep page-only logic here.
 */

const COMPANYFACTS_BASE = 'https://data.sec.gov/api/xbrl/companyfacts/CIK';

const ANNUAL_FORMS = new Set(['10-K', '10-K/A', '20-F', '20-F/A', '40-F', '40-F/A']);

type FactPoint = {
  end?: string;
  fy?: number;
  fp?: string;
  form?: string;
  filed?: string;
  accn?: string;
  val?: number;
};

type ConceptUnits = Record<string, FactPoint[]>;

type CompanyFactsResponse = {
  cik?: number;
  entityName?: string;
  facts?: {
    'us-gaap'?: Record<string, { units?: ConceptUnits; label?: string; description?: string }>;
  };
};

export type HeadlineMetric = {
  /** Human-readable label, e.g. "Revenue". */
  label: string;
  /** Most-recent annual value in USD, or null when no annual fact is found. */
  valueUsd: number | null;
  /** Fiscal year of the value. */
  fiscalYear: number | null;
  /** Period end date, ISO 8601 (yyyy-mm-dd). */
  periodEnd: string | null;
  /** Form type (10-K, 10-K/A, etc.) the fact came from. */
  form: string | null;
  /** SEC accession number. */
  accession: string | null;
  /** Date the filing was accepted by SEC (yyyy-mm-dd). */
  filedAt: string | null;
  /** Direct link to the filing index on EDGAR for this accession. */
  filingUrl: string | null;
  /** XBRL concept used to source the value, e.g. "Revenues". */
  concept: string | null;
};

export type HeadlineFundamentals = {
  /** SEC companyfacts URL the response came from. */
  sourceUrl: string;
  /** Server-side fetch timestamp (ISO 8601). */
  fetchedAt: string;
  /** Entity name SEC uses for the issuer. */
  entityName: string | null;
  /** Headline metrics, in the order they should render. */
  metrics: ReadonlyArray<HeadlineMetric>;
};

const HEADLINE_SPECS: Array<{ label: string; concepts: string[]; unit: string }> = [
  {
    label: 'Revenue',
    concepts: ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'SalesRevenueNet'],
    unit: 'USD',
  },
  { label: 'Net income', concepts: ['NetIncomeLoss', 'ProfitLoss'], unit: 'USD' },
  { label: 'Total assets', concepts: ['Assets'], unit: 'USD' },
  {
    label: 'Cash & equivalents',
    concepts: ['CashAndCashEquivalentsAtCarryingValue', 'CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents'],
    unit: 'USD',
  },
  {
    label: "Shareholders' equity",
    concepts: ['StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest'],
    unit: 'USD',
  },
];

function padCik(input: string): string {
  return input.replace(/\D/g, '').padStart(10, '0');
}

function secUserAgent(): string {
  return process.env.SEC_USER_AGENT?.trim() || 'DataDogs/1.0 (contact: engineering@datadogs.local)';
}

function buildAccessionFilingUrl(cikPadded: string, accession: string): string | null {
  if (!accession) return null;
  // EDGAR canonical filing-index URL: /Archives/edgar/data/{CIK}/{accession-no-dashes}/index.htm
  const noDashes = accession.replace(/-/g, '');
  // Drop the leading zeros from the CIK to match SEC's directory naming.
  const cikNumeric = String(parseInt(cikPadded, 10));
  return `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cikNumeric}&type=&dateb=&owner=include&count=40&action=getcompany#:~:text=${noDashes}`;
}

function buildAccessionIndexUrl(cikPadded: string, accession: string): string | null {
  if (!accession) return null;
  const noDashes = accession.replace(/-/g, '');
  const cikNumeric = String(parseInt(cikPadded, 10));
  return `https://www.sec.gov/Archives/edgar/data/${cikNumeric}/${noDashes}/${accession}-index.htm`;
}

function pickLatestAnnual(units: FactPoint[]): FactPoint | null {
  let latest: FactPoint | null = null;
  for (const fact of units) {
    if (!fact.form || !ANNUAL_FORMS.has(fact.form)) continue;
    if (fact.fp && fact.fp !== 'FY') continue;
    if (typeof fact.val !== 'number') continue;
    if (!fact.end) continue;
    if (latest === null || (fact.end && fact.end > (latest.end ?? ''))) {
      latest = fact;
    }
  }
  return latest;
}

function findFirstAnnualFact(
  facts: Record<string, { units?: ConceptUnits }>,
  concepts: string[],
  unit: string,
): { concept: string; fact: FactPoint } | null {
  for (const concept of concepts) {
    const conceptEntry = facts[concept];
    const series = conceptEntry?.units?.[unit];
    if (!series || series.length === 0) continue;
    const latest = pickLatestAnnual(series);
    if (latest) {
      return { concept, fact: latest };
    }
  }
  return null;
}

export async function getHeadlineFundamentals(
  companyId: string,
): Promise<HeadlineFundamentals | null> {
  const cikPadded = padCik(companyId);
  if (cikPadded.length !== 10) return null;

  const sourceUrl = `${COMPANYFACTS_BASE}${cikPadded}.json`;
  let payload: CompanyFactsResponse;
  try {
    const response = await fetch(sourceUrl, {
      method: 'GET',
      headers: {
        'User-Agent': secUserAgent(),
        Accept: 'application/json',
      },
      next: { revalidate: 600 },
    });
    if (!response.ok) {
      // Issuer with no XBRL facts (foreign private issuer, recent IPO, etc.)
      // is a soft-miss, not an error. The page renders without headline
      // fundamentals in that case.
      return null;
    }
    payload = (await response.json()) as CompanyFactsResponse;
  } catch {
    return null;
  }

  const usGaap = payload.facts?.['us-gaap'] ?? {};
  const fetchedAt = new Date().toISOString();

  const metrics: HeadlineMetric[] = HEADLINE_SPECS.map((spec) => {
    const found = findFirstAnnualFact(usGaap, spec.concepts, spec.unit);
    if (!found) {
      return {
        label: spec.label,
        valueUsd: null,
        fiscalYear: null,
        periodEnd: null,
        form: null,
        accession: null,
        filedAt: null,
        filingUrl: null,
        concept: null,
      };
    }
    const accession = found.fact.accn ?? null;
    return {
      label: spec.label,
      valueUsd: found.fact.val ?? null,
      fiscalYear: found.fact.fy ?? null,
      periodEnd: found.fact.end ?? null,
      form: found.fact.form ?? null,
      accession,
      filedAt: found.fact.filed ?? null,
      filingUrl: accession ? buildAccessionIndexUrl(cikPadded, accession) : null,
      concept: found.concept,
    };
  });

  return {
    sourceUrl,
    fetchedAt,
    entityName: payload.entityName ?? null,
    metrics,
  };
}

export function formatUsdCompact(value: number | null): string {
  if (value === null) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString('en-US');
}

/**
 * Re-export of the URL builder so the page (and tests) can reuse it for
 * other accession numbers (e.g. items in the recent-filings table).
 */
export { buildAccessionFilingUrl, buildAccessionIndexUrl };
