/**
 * Pure helpers for the `/api/v1/financials` route handler.
 *
 * Kept in a sibling module so Next.js's route-segment export rules (which
 * reject non-HTTP-verb / non-config exports from `route.ts`) do not force us
 * to hide pure logic from unit tests. `route.ts` re-imports from here.
 *
 * The concept-matching / year-selection / balance-consistency logic mirrors
 * the financials page (`apps/web/app/company/[companyId]/financials/page.tsx`)
 * so the public API presents the same labelled rows as the UI.
 */

import {
  FINANCIALS_API_VERSION,
  type CompanyFinancialsResponse,
  type FinancialsConsistency,
  type FinancialsMetricRow,
  type FinancialsStatement,
  type FinancialsStatementId,
} from '../../../../../../packages/schemas/src/api/financials';

import { parsePositiveInt } from '../companies/helpers';

export const FINANCIALS_DEFAULT_YEARS = 4;
export const FINANCIALS_MAX_YEARS = 8;

export type FactPoint = {
  end: string;
  fy?: number;
  fp?: string;
  form?: string;
  filed?: string;
  val?: number;
};

export type ConceptUnits = Record<string, FactPoint[]>;

export type CompanyFactsResponse = {
  cik?: string;
  entityName?: string;
  facts?: {
    'us-gaap'?: Record<string, { units?: ConceptUnits }>;
  };
};

type MetricSpec = {
  label: string;
  concepts: string[];
  units: string[];
};

type StatementSpec = {
  title: string;
  id: FinancialsStatementId;
  metrics: MetricSpec[];
};

export type FinancialsQuery = {
  companyId: string;
  years: number;
};

const ANNUAL_FORMS = new Set(['10-K', '10-K/A', '20-F', '20-F/A', '40-F', '40-F/A']);

const STATEMENT_SPECS: StatementSpec[] = [
  {
    title: 'Income statement',
    id: 'income',
    metrics: [
      { label: 'Revenue', concepts: ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'SalesRevenueNet'], units: ['USD'] },
      { label: 'Gross profit', concepts: ['GrossProfit'], units: ['USD'] },
      { label: 'Operating income', concepts: ['OperatingIncomeLoss'], units: ['USD'] },
      { label: 'Net income', concepts: ['NetIncomeLoss', 'ProfitLoss'], units: ['USD'] },
    ],
  },
  {
    title: 'Balance sheet',
    id: 'balance',
    metrics: [
      { label: 'Cash & equivalents', concepts: ['CashAndCashEquivalentsAtCarryingValue', 'CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents'], units: ['USD'] },
      { label: 'Total assets', concepts: ['Assets'], units: ['USD'] },
      { label: 'Total liabilities', concepts: ['Liabilities'], units: ['USD'] },
      { label: "Shareholders' equity", concepts: ['StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest'], units: ['USD'] },
    ],
  },
  {
    title: 'Cash flow',
    id: 'cashflow',
    metrics: [
      { label: 'Cash from operations', concepts: ['NetCashProvidedByUsedInOperatingActivities', 'NetCashProvidedByUsedInOperatingActivitiesContinuingOperations'], units: ['USD'] },
      { label: 'Cash from investing', concepts: ['NetCashProvidedByUsedInInvestingActivities', 'NetCashProvidedByUsedInInvestingActivitiesContinuingOperations'], units: ['USD'] },
      { label: 'Cash from financing', concepts: ['NetCashProvidedByUsedInFinancingActivities', 'NetCashProvidedByUsedInFinancingActivitiesContinuingOperations'], units: ['USD'] },
      { label: 'Capital expenditures', concepts: ['PaymentsToAcquirePropertyPlantAndEquipment'], units: ['USD'] },
    ],
  },
];

export function normalizeFinancialsQuery(searchParams: URLSearchParams): FinancialsQuery {
  const raw = searchParams.get('companyId');
  if (raw === null || raw.trim() === '') {
    throw new Error('companyId query parameter is required');
  }
  const companyId = raw.trim();
  if (!/\d/.test(companyId)) {
    throw new Error('companyId must contain at least one digit');
  }
  const years = parsePositiveInt(searchParams.get('years'), FINANCIALS_DEFAULT_YEARS, 'years');
  if (years > FINANCIALS_MAX_YEARS) {
    throw new Error(`years must be <= ${FINANCIALS_MAX_YEARS}`);
  }
  return { companyId, years };
}

export function padCik(companyId: string): string {
  const digits = companyId.replace(/\D/g, '');
  if (!digits) {
    throw new Error('companyId must contain at least one digit');
  }
  return digits.padStart(10, '0');
}

export function buildCompanyFactsUrl(cikPadded: string): string {
  return `https://data.sec.gov/api/xbrl/companyfacts/CIK${cikPadded}.json`;
}

function parseAnnualYear(point: FactPoint): number | null {
  if (typeof point.fy === 'number') {
    return point.fy;
  }
  if (!point.end) {
    return null;
  }
  const year = Number.parseInt(point.end.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

function preferMoreRecent(a: FactPoint, b: FactPoint): FactPoint {
  const aFiled = a.filed ?? '';
  const bFiled = b.filed ?? '';
  if (aFiled !== bFiled) {
    return aFiled > bFiled ? a : b;
  }
  return (a.end ?? '') >= (b.end ?? '') ? a : b;
}

export function collectMetricValues(
  usGaap: Record<string, { units?: ConceptUnits }>,
  metric: MetricSpec,
): Record<number, number> {
  for (const concept of metric.concepts) {
    const conceptNode = usGaap[concept];
    if (!conceptNode?.units) {
      continue;
    }
    for (const unit of metric.units) {
      const points = conceptNode.units[unit] ?? [];
      const annual = points.filter((point) => {
        const year = parseAnnualYear(point);
        return (
          year !== null
          && typeof point.val === 'number'
          && ANNUAL_FORMS.has(point.form ?? '')
          && (point.fp === 'FY' || !point.fp)
        );
      });
      if (annual.length === 0) {
        continue;
      }
      const byYear = new Map<number, FactPoint>();
      for (const point of annual) {
        const year = parseAnnualYear(point);
        if (year === null) {
          continue;
        }
        const existing = byYear.get(year);
        byYear.set(year, existing ? preferMoreRecent(existing, point) : point);
      }
      const valuesByYear: Record<number, number> = {};
      for (const [year, point] of byYear.entries()) {
        valuesByYear[year] = point.val as number;
      }
      return valuesByYear;
    }
  }
  return {};
}

export function selectYears(
  statements: Array<Pick<FinancialsStatement, 'rows'>>,
  maxYears: number,
): number[] {
  const yearSet = new Set<number>();
  for (const statement of statements) {
    for (const row of statement.rows) {
      for (const yearKey of Object.keys(row.valuesByYear)) {
        const year = Number(yearKey);
        if (Number.isFinite(year)) {
          yearSet.add(year);
        }
      }
    }
  }
  return [...yearSet].sort((a, b) => b - a).slice(0, maxYears);
}

export function restrictStatementsToYears(
  statements: FinancialsStatement[],
  years: number[],
): FinancialsStatement[] {
  const allowed = new Set(years);
  return statements.map((statement) => ({
    id: statement.id,
    title: statement.title,
    rows: statement.rows.map((row) => {
      const narrowed: Record<number, number> = {};
      for (const [yearKey, value] of Object.entries(row.valuesByYear)) {
        const year = Number(yearKey);
        if (allowed.has(year)) {
          narrowed[year] = value;
        }
      }
      return { label: row.label, valuesByYear: narrowed };
    }),
  }));
}

export function summarizeConsistency(
  statements: FinancialsStatement[],
  years: number[],
): FinancialsConsistency {
  const balance = statements.find((item) => item.id === 'balance');
  if (!balance) {
    return { status: 'incomplete', message: 'Balance sheet was unavailable.' };
  }

  const assets = balance.rows.find((row) => row.label === 'Total assets');
  const liabilities = balance.rows.find((row) => row.label === 'Total liabilities');
  const equity = balance.rows.find((row) => row.label === "Shareholders' equity");

  if (!assets || !liabilities || !equity) {
    return { status: 'incomplete', message: 'Balance-sheet check could not run.' };
  }

  for (const year of years) {
    const assetValue = assets.valuesByYear[year];
    const liabilityValue = liabilities.valuesByYear[year];
    const equityValue = equity.valuesByYear[year];
    if (assetValue === undefined || liabilityValue === undefined || equityValue === undefined) {
      continue;
    }
    const diff = Math.abs(assetValue - (liabilityValue + equityValue));
    if (diff > Math.max(Math.abs(assetValue), 1) * 0.03) {
      return { status: 'mismatch', message: `Potential mismatch in ${year}: assets differ from liabilities + equity.` };
    }
  }

  return { status: 'ok', message: 'No obvious annual balance-sheet mismatch detected in available years.' };
}

export function buildStatements(
  usGaap: Record<string, { units?: ConceptUnits }>,
): FinancialsStatement[] {
  return STATEMENT_SPECS.map((spec) => ({
    id: spec.id,
    title: spec.title,
    rows: spec.metrics.map<FinancialsMetricRow>((metric) => ({
      label: metric.label,
      valuesByYear: collectMetricValues(usGaap, metric),
    })),
  }));
}

export function buildFinancialsResponse(args: {
  payload: CompanyFactsResponse;
  cikPadded: string;
  sourceUrl: string;
  fetchedAt: string;
  generatedAt: string;
  maxYears: number;
}): CompanyFinancialsResponse {
  const usGaap = args.payload.facts?.['us-gaap'];
  if (!usGaap) {
    throw new Error(`No us-gaap facts found for CIK ${args.cikPadded}`);
  }
  const fullStatements = buildStatements(usGaap);
  const years = selectYears(fullStatements, args.maxYears);
  if (years.length === 0) {
    throw new Error(`No annual facts were available for CIK ${args.cikPadded}`);
  }
  const statements = restrictStatementsToYears(fullStatements, years);
  const consistency = summarizeConsistency(statements, years);
  return {
    apiVersion: FINANCIALS_API_VERSION,
    generatedAt: args.generatedAt,
    companyName: args.payload.entityName ?? `CIK ${args.cikPadded}`,
    cik: args.payload.cik ?? args.cikPadded,
    currency: 'USD',
    units: 'currency',
    years,
    statements,
    consistency,
    provenance: {
      sourceUrl: args.sourceUrl,
      fetchedAt: args.fetchedAt,
    },
  };
}
