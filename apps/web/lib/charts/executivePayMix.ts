/**
 * Data-preparation layer for the Executive Pay Mix Stack chart.
 *
 * Each column is one named executive officer (NEO).  The column is a
 * stacked bar whose segments are the standard Summary Compensation Table
 * components: Salary, Bonus, Stock Awards, Option Awards, Non-Equity
 * Incentive Plan Compensation, Change in Pension Value & NQDC Earnings,
 * and All Other Compensation.  Segment heights are in absolute USD so
 * the analyst can read both overall magnitude and mix in one glance;
 * helpers convert to percentage mix when a normalized view is desired.
 *
 * Data below is sourced from Apple Inc. (AAPL) FY 2023 DEF 14A proxy
 * statement Summary Compensation Table.
 *
 * Source: SEC EDGAR, CIK 0000320193
 *   Accession: 0000320193-24-000008 (DEF 14A filed 2024-01-11)
 *
 * All figures in USD.
 */

/** Canonical Summary Compensation Table component keys. */
export type PayComponentKey =
  | 'salary'
  | 'bonus'
  | 'stockAwards'
  | 'optionAwards'
  | 'nonEquityIncentive'
  | 'pensionAndNqdc'
  | 'otherCompensation';

/** Display label for each component, in stacking order (bottom → top). */
export const PAY_COMPONENT_LABELS: Record<PayComponentKey, string> = {
  salary: 'Salary',
  bonus: 'Bonus',
  stockAwards: 'Stock Awards',
  optionAwards: 'Option Awards',
  nonEquityIncentive: 'Non-Equity Incentive',
  pensionAndNqdc: 'Pension & NQDC',
  otherCompensation: 'All Other',
};

/** Stacking order, bottom → top.  Fixed so charts are visually comparable. */
export const PAY_COMPONENT_ORDER: readonly PayComponentKey[] = [
  'salary',
  'bonus',
  'stockAwards',
  'optionAwards',
  'nonEquityIncentive',
  'pensionAndNqdc',
  'otherCompensation',
] as const;

/** A single NEO's compensation, in USD, broken out by component. */
export type ExecutivePayRow = {
  /** Executive full name as disclosed in the proxy. */
  name: string;
  /** Title as disclosed in the proxy (e.g. "CEO", "SVP and CFO"). */
  title: string;
  /** Compensation components, each in USD.  Zero values are explicit. */
  components: Record<PayComponentKey, number>;
};

/** Full pay-mix dataset with provenance metadata. */
export type ExecutivePayMixData = {
  /** Ticker for the filing company. */
  ticker: string;
  /** Company name as disclosed. */
  companyName: string;
  /** Zero-padded SEC EDGAR CIK. */
  cik: string;
  /** Fiscal year the compensation relates to (e.g. "FY 2023"). */
  fiscalYear: string;
  /** Proxy filing type (DEF 14A or DEFA14A). */
  filingType: 'DEF 14A' | 'DEFA14A';
  /** SEC EDGAR accession for the proxy filing. */
  accession: string;
  /** Proxy filing date (ISO 8601 YYYY-MM-DD). */
  filingDate: string;
  /** One row per NEO. */
  rows: ExecutivePayRow[];
};

/**
 * Apple Inc. FY 2023 executive pay mix — NEOs as disclosed in the
 * Summary Compensation Table of Apple's 2024 proxy statement.
 *
 * Source: SEC EDGAR CIK 0000320193, Accession 0000320193-24-000008
 * (DEF 14A filed 2024-01-11).  All figures in USD.
 */
export const APPLE_EXECUTIVE_PAY_MIX: ExecutivePayMixData = {
  ticker: 'AAPL',
  companyName: 'Apple Inc.',
  cik: '0000320193',
  fiscalYear: 'FY 2023',
  filingType: 'DEF 14A',
  accession: '0000320193-24-000008',
  filingDate: '2024-01-11',
  rows: [
    {
      name: 'Timothy D. Cook',
      title: 'Chief Executive Officer',
      components: {
        salary: 3_000_000,
        bonus: 0,
        stockAwards: 46_968_710,
        optionAwards: 0,
        nonEquityIncentive: 10_713_360,
        pensionAndNqdc: 0,
        otherCompensation: 711_458,
      },
    },
    {
      name: 'Luca Maestri',
      title: 'Senior Vice President, Chief Financial Officer',
      components: {
        salary: 1_000_000,
        bonus: 0,
        stockAwards: 21_884_646,
        optionAwards: 0,
        nonEquityIncentive: 3_570_600,
        pensionAndNqdc: 0,
        otherCompensation: 19_492,
      },
    },
    {
      name: 'Katherine L. Adams',
      title: 'Senior Vice President, General Counsel and Secretary',
      components: {
        salary: 1_000_000,
        bonus: 0,
        stockAwards: 21_884_646,
        optionAwards: 0,
        nonEquityIncentive: 3_570_600,
        pensionAndNqdc: 0,
        otherCompensation: 17_164,
      },
    },
    {
      name: "Deirdre O'Brien",
      title: 'Senior Vice President, Retail',
      components: {
        salary: 1_000_000,
        bonus: 0,
        stockAwards: 21_884_646,
        optionAwards: 0,
        nonEquityIncentive: 3_570_600,
        pensionAndNqdc: 0,
        otherCompensation: 18_133,
      },
    },
    {
      name: 'Jeff Williams',
      title: 'Chief Operating Officer',
      components: {
        salary: 1_000_000,
        bonus: 0,
        stockAwards: 21_884_646,
        optionAwards: 0,
        nonEquityIncentive: 3_570_600,
        pensionAndNqdc: 0,
        otherCompensation: 107_634,
      },
    },
  ],
};

/** Total compensation for a single row (sum of all components). */
export function totalPay(row: ExecutivePayRow): number {
  return PAY_COMPONENT_ORDER.reduce((sum, key) => sum + row.components[key], 0);
}

/** A single stack segment positioned in USD-space for layout. */
export type PayMixSegment = {
  component: PayComponentKey;
  label: string;
  value: number;
  /** Cumulative start of the segment (bottom edge), in USD. */
  start: number;
  /** Cumulative end of the segment (top edge), in USD. */
  end: number;
};

/** A single NEO with its stacked segments in canonical component order. */
export type PayMixStack = {
  name: string;
  title: string;
  total: number;
  segments: PayMixSegment[];
};

/**
 * Build the stacked-segment layout for each NEO.  Segments are emitted in
 * {@link PAY_COMPONENT_ORDER} with explicit zero-width entries for
 * missing components so downstream renderers can iterate a stable shape.
 */
export function computePayMixStacks(data: ExecutivePayMixData): PayMixStack[] {
  return data.rows.map((row) => {
    let running = 0;
    const segments: PayMixSegment[] = PAY_COMPONENT_ORDER.map((key) => {
      const value = row.components[key];
      const start = running;
      running += value;
      return {
        component: key,
        label: PAY_COMPONENT_LABELS[key],
        value,
        start,
        end: running,
      };
    });
    return {
      name: row.name,
      title: row.title,
      total: running,
      segments,
    };
  });
}

/** Percentage mix entry for one component of one NEO. */
export type PayMixPercentEntry = {
  component: PayComponentKey;
  label: string;
  /** Percentage of total pay, rounded to 2 decimals.  0-100. */
  pct: number;
};

/** Normalized percentage mix for one NEO (sums to ~100, modulo rounding). */
export type PayMixPercentRow = {
  name: string;
  title: string;
  total: number;
  mix: PayMixPercentEntry[];
};

/**
 * Normalize each NEO's components to percentage of total pay.  Useful for
 * a mix-only (100% stacked) variant of the chart.  Percentages are
 * rounded to 2 decimals; callers that need an exact sum should use
 * {@link computePayMixStacks} instead.
 */
export function computePayMixPercent(data: ExecutivePayMixData): PayMixPercentRow[] {
  return data.rows.map((row) => {
    const total = totalPay(row);
    const mix = PAY_COMPONENT_ORDER.map((key) => {
      const value = row.components[key];
      const pct = total > 0 ? Math.round((value / total) * 10000) / 100 : 0;
      return { component: key, label: PAY_COMPONENT_LABELS[key], pct };
    });
    return { name: row.name, title: row.title, total, mix };
  });
}

/** Aggregate totals for the full NEO set (one value per component, plus grand total). */
export type PayMixAggregate = {
  totalsByComponent: Record<PayComponentKey, number>;
  grandTotal: number;
  neoCount: number;
};

/**
 * Aggregate every component across all NEOs.  The grand total is the sum
 * of every NEO's total pay and matches the sum of `totalsByComponent`.
 */
export function aggregatePayMix(data: ExecutivePayMixData): PayMixAggregate {
  const totals: Record<PayComponentKey, number> = {
    salary: 0,
    bonus: 0,
    stockAwards: 0,
    optionAwards: 0,
    nonEquityIncentive: 0,
    pensionAndNqdc: 0,
    otherCompensation: 0,
  };
  for (const row of data.rows) {
    for (const key of PAY_COMPONENT_ORDER) {
      totals[key] += row.components[key];
    }
  }
  const grandTotal = PAY_COMPONENT_ORDER.reduce((s, k) => s + totals[k], 0);
  return { totalsByComponent: totals, grandTotal, neoCount: data.rows.length };
}

/** Validate that a pay-mix dataset is well-formed. */
export function validateExecutivePayMix(data: ExecutivePayMixData): boolean {
  if (data.rows.length === 0) return false;
  if (data.ticker.length === 0 || data.companyName.length === 0) return false;
  if (data.cik.length === 0 || data.accession.length === 0) return false;
  if (data.fiscalYear.length === 0 || data.filingDate.length === 0) return false;
  const names = new Set<string>();
  for (const row of data.rows) {
    if (row.name.length === 0 || row.title.length === 0) return false;
    if (names.has(row.name)) return false;
    names.add(row.name);
    for (const key of PAY_COMPONENT_ORDER) {
      const value = row.components[key];
      if (!Number.isFinite(value) || value < 0) return false;
    }
    if (totalPay(row) <= 0) return false;
  }
  return true;
}
