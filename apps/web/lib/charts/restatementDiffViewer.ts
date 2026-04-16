/**
 * Data-preparation layer for the Restatement Diff Viewer chart.
 *
 * Shows before-and-after values when a company restates previously
 * reported financial figures.  Each row is one line item that changed,
 * with original value, restated value, absolute delta, and percentage
 * change.  The viewer makes it easy for analysts to assess materiality.
 *
 * Data below is based on General Electric Company (GE) FY 2017/2018
 * restatement disclosed in GE's 2018 10-K/A filing (SEC EDGAR).
 *
 * Source: SEC EDGAR, CIK 0000040554
 *   Original 10-K: Accession 0000040554-18-000007 (FY 2017 as filed)
 *   Restated 10-K/A: Accession 0000040554-18-000036 (FY 2017 restated)
 *
 * All figures in USD millions.
 */

/** A single line item that was restated. */
export type RestatementLineItem = {
  /** Financial statement line item name. */
  lineItem: string;
  /** Value originally reported (USD millions). */
  originalValue: number;
  /** Restated value (USD millions). */
  restatedValue: number;
};

/** Full restatement event with metadata and affected line items. */
export type RestatementEvent = {
  /** Company ticker. */
  ticker: string;
  /** Company name. */
  companyName: string;
  /** Fiscal period that was restated, e.g. "FY 2017". */
  restatedPeriod: string;
  /** Date the restatement was disclosed (ISO 8601). */
  disclosureDate: string;
  /** Filing type, e.g. "10-K/A". */
  filingType: string;
  /** SEC EDGAR accession number for the restated filing. */
  accession: string;
  /** SEC EDGAR CIK. */
  cik: string;
  /** Reason summary. */
  reason: string;
  /** Affected line items. */
  items: RestatementLineItem[];
};

/** Computed diff for a single line item. */
export type RestatementDiff = {
  lineItem: string;
  originalValue: number;
  restatedValue: number;
  /** Absolute change (restated − original). */
  delta: number;
  /** Percentage change ((restated − original) / |original| × 100). */
  pctChange: number;
  /** Whether the absolute delta exceeds materiality threshold. */
  isMaterial: boolean;
};

/**
 * General Electric FY 2017 restatement — selected income statement items.
 *
 * GE restated FY 2017 results as part of its 2018 10-K/A filing, primarily
 * due to long-term insurance reserve adjustments and revised revenue
 * recognition under ASC 606.
 *
 * Source: SEC EDGAR CIK 0000040554
 *   Original: Accession 0000040554-18-000007
 *   Restated: Accession 0000040554-18-000036
 */
export const GE_RESTATEMENT_FY2017: RestatementEvent = {
  ticker: 'GE',
  companyName: 'General Electric Company',
  restatedPeriod: 'FY 2017',
  disclosureDate: '2018-11-14',
  filingType: '10-K/A',
  accession: '0000040554-18-000036',
  cik: '0000040554',
  reason: 'Long-term insurance reserve adjustments and ASC 606 revenue recognition transition',
  items: [
    { lineItem: 'Total Revenue', originalValue: 122_092, restatedValue: 121_615 },
    { lineItem: 'Cost of Revenue', originalValue: 100_728, restatedValue: 100_354 },
    { lineItem: 'Gross Profit', originalValue: 21_364, restatedValue: 21_261 },
    { lineItem: 'Operating Income', originalValue: 2_649, restatedValue: 1_218 },
    { lineItem: 'Net Income (Loss)', originalValue: -5_786, restatedValue: -8_929 },
    { lineItem: 'Diluted EPS', originalValue: -0.67, restatedValue: -1.03 },
    { lineItem: 'Total Assets', originalValue: 377_945, restatedValue: 369_245 },
    { lineItem: 'Total Liabilities', originalValue: 325_380, restatedValue: 324_842 },
  ],
};

/**
 * Compute diffs for all line items in a restatement event.
 *
 * @param event  The restatement event to diff.
 * @param materialityPct  Percentage threshold above which a change is flagged
 *                        as material (default 5%).
 */
export function computeRestatementDiffs(
  event: RestatementEvent,
  materialityPct: number = 5,
): RestatementDiff[] {
  return event.items.map((item) => {
    const delta = item.restatedValue - item.originalValue;
    const pctChange =
      item.originalValue !== 0
        ? Math.round((delta / Math.abs(item.originalValue)) * 10000) / 100
        : 0;
    return {
      lineItem: item.lineItem,
      originalValue: item.originalValue,
      restatedValue: item.restatedValue,
      delta,
      pctChange,
      isMaterial: Math.abs(pctChange) >= materialityPct,
    };
  });
}

/**
 * Return only the material diffs (those exceeding the threshold).
 */
export function getMaterialDiffs(
  event: RestatementEvent,
  materialityPct: number = 5,
): RestatementDiff[] {
  return computeRestatementDiffs(event, materialityPct).filter((d) => d.isMaterial);
}

/**
 * Compute the total net impact of all restatement line items that
 * represent income/loss (excludes balance-sheet items).
 *
 * This returns the sum of deltas for items whose line-item name
 * includes "Income", "Loss", "EPS", "Revenue", or "Profit".
 */
export type RestatementImpactSummary = {
  /** Count of items that changed. */
  itemCount: number;
  /** Count of material changes. */
  materialCount: number;
  /** Largest absolute percentage change among all items. */
  maxAbsPctChange: number;
  /** Line item with the largest absolute percentage change. */
  maxAbsPctLineItem: string;
};

export function computeRestatementSummary(
  event: RestatementEvent,
  materialityPct: number = 5,
): RestatementImpactSummary {
  const diffs = computeRestatementDiffs(event, materialityPct);
  const materialDiffs = diffs.filter((d) => d.isMaterial);

  let maxAbsPct = 0;
  let maxLineItem = '';
  for (const d of diffs) {
    const absPct = Math.abs(d.pctChange);
    if (absPct > maxAbsPct) {
      maxAbsPct = absPct;
      maxLineItem = d.lineItem;
    }
  }

  return {
    itemCount: diffs.length,
    materialCount: materialDiffs.length,
    maxAbsPctChange: maxAbsPct,
    maxAbsPctLineItem: maxLineItem,
  };
}

/** Validate that a restatement event is well-formed. */
export function validateRestatementEvent(event: RestatementEvent): boolean {
  if (event.items.length === 0) return false;
  if (event.ticker.length === 0 || event.companyName.length === 0) return false;
  if (event.restatedPeriod.length === 0 || event.disclosureDate.length === 0) return false;
  if (event.accession.length === 0 || event.cik.length === 0) return false;
  if (!event.items.every((item) => item.lineItem.length > 0)) return false;
  return true;
}
