/**
 * Note / disclosure retrieval API layer.
 *
 * Provides types and a lookup function that maps financial line-item concepts
 * to their related SEC XBRL note disclosures. The mapping is derived from
 * standard US-GAAP taxonomy relationships — each concept may reference one or
 * more note/policy text blocks that issuers include in their 10-K/10-Q filings.
 *
 * Source: SEC EDGAR XBRL taxonomy (us-gaap-2024).
 */

export type NoteDisclosure = {
  /** The US-GAAP concept that anchors this note (e.g. RevenueFromContractWithCustomerTextBlock). */
  concept: string;
  /** Human-readable title of the note. */
  title: string;
  /** Abbreviated summary suitable for a side-panel preview. */
  summary: string;
  /** SEC taxonomy section reference. */
  taxonomySection: string;
};

export type NoteDisclosureResult = {
  /** The financial-line-item concept that was queried. */
  queryConcept: string;
  /** Whether any linked notes were found. */
  found: boolean;
  /** Linked note disclosures (empty array when none). */
  disclosures: NoteDisclosure[];
};

/**
 * Static mapping from financial line-item concepts to related note text-block
 * concepts. Derived from the US-GAAP 2024 taxonomy presentation linkbase.
 */

const REVENUE_RECOGNITION_NOTE: NoteDisclosure = {
  concept: 'RevenueFromContractWithCustomerTextBlock',
  title: 'Revenue recognition',
  summary:
    'Describes the entity\u2019s accounting policy for revenue from contracts with customers, including timing of recognition, significant judgments, and contract balances.',
  taxonomySection: '606-10',
};

const DEBT_DISCLOSURE_NOTE: NoteDisclosure = {
  concept: 'DebtDisclosureTextBlock',
  title: 'Debt obligations',
  summary:
    'Covers short-term and long-term debt instruments, maturities, covenants, and fair-value disclosures.',
  taxonomySection: '470-10',
};

const CASH_FLOW_SUPPLEMENTAL_NOTE: NoteDisclosure = {
  concept: 'CashFlowSupplementalDisclosuresTextBlock',
  title: 'Cash-flow supplemental disclosures',
  summary:
    'Presents supplemental cash-flow information including taxes paid, interest paid, and non-cash investing and financing activities.',
  taxonomySection: '230-10',
};

const INCOME_TAX_NOTE: NoteDisclosure = {
  concept: 'IncomeTaxDisclosureTextBlock',
  title: 'Income taxes',
  summary:
    'Discloses current and deferred income tax provisions, effective tax rate reconciliation, and significant tax positions.',
  taxonomySection: '740-10',
};

const CASH_EQUIVALENTS_POLICY_NOTE: NoteDisclosure = {
  concept: 'CashAndCashEquivalentsPolicyTextBlock',
  title: 'Cash & equivalents policy',
  summary:
    'Describes what the entity considers cash equivalents and any restrictions on cash balances.',
  taxonomySection: '305-10',
};

const STOCKHOLDERS_EQUITY_NOTE: NoteDisclosure = {
  concept: 'StockholdersEquityNoteDisclosureTextBlock',
  title: "Shareholders\u2019 equity",
  summary:
    'Details common stock, preferred stock, treasury stock activity, and any equity-classified instruments.',
  taxonomySection: '505-10',
};

const INVESTMENT_DISCLOSURES_NOTE: NoteDisclosure = {
  concept: 'InvestmentsInDebtAndMarketableEquitySecuritiesAndCertainTradingAssetsDisclosureTextBlock',
  title: 'Investment disclosures',
  summary:
    'Covers classification, fair value, and impairment of debt and equity securities held by the entity.',
  taxonomySection: '320-10',
};

const CONCEPT_TO_NOTES: Record<string, NoteDisclosure[]> = {
  Revenues: [REVENUE_RECOGNITION_NOTE],
  RevenueFromContractWithCustomerExcludingAssessedTax: [REVENUE_RECOGNITION_NOTE],
  SalesRevenueNet: [REVENUE_RECOGNITION_NOTE],
  GrossProfit: [
    {
      concept: 'CostOfGoodsAndServicesSoldPolicyTextBlock',
      title: 'Cost of revenue policy',
      summary:
        'Outlines how the entity classifies and measures cost of goods sold and cost of services, including allocation methods and vendor arrangements.',
      taxonomySection: '330-10',
    },
  ],
  OperatingIncomeLoss: [
    {
      concept: 'CompensationAndEmployeeBenefitPlansTextBlock',
      title: 'Compensation & benefits',
      summary:
        'Details stock-based compensation plans, pension obligations, and other employee benefit arrangements that affect operating expenses.',
      taxonomySection: '718-10',
    },
  ],
  NetIncomeLoss: [
    INCOME_TAX_NOTE,
    {
      concept: 'EarningsPerShareTextBlock',
      title: 'Earnings per share',
      summary:
        'Presents basic and diluted EPS calculations, including the effect of potentially dilutive securities.',
      taxonomySection: '260-10',
    },
  ],
  ProfitLoss: [INCOME_TAX_NOTE],
  CashAndCashEquivalentsAtCarryingValue: [CASH_EQUIVALENTS_POLICY_NOTE],
  CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents: [CASH_EQUIVALENTS_POLICY_NOTE],
  Assets: [
    {
      concept: 'SignificantAccountingPoliciesTextBlock',
      title: 'Significant accounting policies',
      summary:
        'Summarizes the entity\u2019s material accounting policies affecting total asset recognition and measurement.',
      taxonomySection: '235-10',
    },
  ],
  Liabilities: [
    DEBT_DISCLOSURE_NOTE,
    {
      concept: 'CommitmentsAndContingenciesDisclosureTextBlock',
      title: 'Commitments & contingencies',
      summary:
        'Describes pending litigation, guarantees, operating lease commitments, and other contingent liabilities.',
      taxonomySection: '450-20',
    },
  ],
  StockholdersEquity: [STOCKHOLDERS_EQUITY_NOTE],
  StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest: [STOCKHOLDERS_EQUITY_NOTE],
  NetCashProvidedByUsedInOperatingActivities: [CASH_FLOW_SUPPLEMENTAL_NOTE],
  NetCashProvidedByUsedInOperatingActivitiesContinuingOperations: [CASH_FLOW_SUPPLEMENTAL_NOTE],
  NetCashProvidedByUsedInInvestingActivities: [INVESTMENT_DISCLOSURES_NOTE],
  NetCashProvidedByUsedInInvestingActivitiesContinuingOperations: [INVESTMENT_DISCLOSURES_NOTE],
  NetCashProvidedByUsedInFinancingActivities: [DEBT_DISCLOSURE_NOTE],
  NetCashProvidedByUsedInFinancingActivitiesContinuingOperations: [DEBT_DISCLOSURE_NOTE],
  PaymentsToAcquirePropertyPlantAndEquipment: [
    {
      concept: 'PropertyPlantAndEquipmentDisclosureTextBlock',
      title: 'Property, plant & equipment',
      summary:
        'Details useful-life assumptions, depreciation methods, and carrying amounts of PP&E.',
      taxonomySection: '360-10',
    },
  ],
};

/**
 * Look up note disclosures linked to a financial line-item concept.
 *
 * @param concept  US-GAAP concept name (e.g. "Revenues")
 * @returns        Result with matched disclosures or an empty array
 */
export function getNotesForConcept(concept: string): NoteDisclosureResult {
  if (!concept) {
    return { queryConcept: concept, found: false, disclosures: [] };
  }
  const disclosures = CONCEPT_TO_NOTES[concept] ?? [];
  return {
    queryConcept: concept,
    found: disclosures.length > 0,
    disclosures,
  };
}

/**
 * Retrieve all unique note disclosures linked to a set of concepts.
 * De-duplicates by note concept name.
 *
 * @param concepts  Array of US-GAAP concept names
 * @returns         De-duplicated array of NoteDisclosure objects
 */
export function getNotesForConcepts(concepts: string[]): NoteDisclosure[] {
  const seen = new Set<string>();
  const results: NoteDisclosure[] = [];
  for (const concept of concepts) {
    const result = getNotesForConcept(concept);
    for (const disclosure of result.disclosures) {
      if (!seen.has(disclosure.concept)) {
        seen.add(disclosure.concept);
        results.push(disclosure);
      }
    }
  }
  return results;
}
