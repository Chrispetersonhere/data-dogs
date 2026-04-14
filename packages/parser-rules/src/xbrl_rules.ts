export type CanonicalMetricKey =
  | "revenue"
  | "gross_profit"
  | "operating_income"
  | "net_income"
  | "assets_total"
  | "liabilities_total"
  | "cash_and_equivalents";

export type XbrlMappingRule = {
  rule_id: string;
  source: string;
  source_concept: string;
  allowed_units: string[];
  canonical_metric: CanonicalMetricKey;
  confidence: number;
  explanation: string;
};

/**
 * Deterministic XBRL mapping rules:
 * - only exact concept match + unit allowlist match
 * - no probabilistic/opaque heuristics
 * - each rule carries source/explanation for downstream audit trails
 */
export const XBRL_MAPPING_RULES: ReadonlyArray<XbrlMappingRule> = Object.freeze([
  {
    rule_id: "RULE_REV_US_GAAP_001",
    source: "us-gaap:Revenues",
    source_concept: "us-gaap:Revenues",
    allowed_units: ["USD", "USD/shares"],
    canonical_metric: "revenue",
    confidence: 0.99,
    explanation: "Exact us-gaap revenues concept with currency-denominated unit",
  },
  {
    rule_id: "RULE_GP_US_GAAP_001",
    source: "us-gaap:GrossProfit",
    source_concept: "us-gaap:GrossProfit",
    allowed_units: ["USD", "USD/shares"],
    canonical_metric: "gross_profit",
    confidence: 0.99,
    explanation: "Exact us-gaap gross profit concept with currency-denominated unit",
  },
  {
    rule_id: "RULE_OI_US_GAAP_001",
    source: "us-gaap:OperatingIncomeLoss",
    source_concept: "us-gaap:OperatingIncomeLoss",
    allowed_units: ["USD", "USD/shares"],
    canonical_metric: "operating_income",
    confidence: 0.99,
    explanation: "Exact us-gaap operating income(loss) concept with currency-denominated unit",
  },
  {
    rule_id: "RULE_NI_US_GAAP_001",
    source: "us-gaap:NetIncomeLoss",
    source_concept: "us-gaap:NetIncomeLoss",
    allowed_units: ["USD", "USD/shares"],
    canonical_metric: "net_income",
    confidence: 0.99,
    explanation: "Exact us-gaap net income(loss) concept with currency-denominated unit",
  },
  {
    rule_id: "RULE_ASSETS_US_GAAP_001",
    source: "us-gaap:Assets",
    source_concept: "us-gaap:Assets",
    allowed_units: ["USD"],
    canonical_metric: "assets_total",
    confidence: 0.995,
    explanation: "Exact us-gaap total assets concept with USD unit",
  },
  {
    rule_id: "RULE_LIAB_US_GAAP_001",
    source: "us-gaap:Liabilities",
    source_concept: "us-gaap:Liabilities",
    allowed_units: ["USD"],
    canonical_metric: "liabilities_total",
    confidence: 0.995,
    explanation: "Exact us-gaap total liabilities concept with USD unit",
  },
  {
    rule_id: "RULE_CASH_US_GAAP_001",
    source: "us-gaap:CashAndCashEquivalentsAtCarryingValue",
    source_concept: "us-gaap:CashAndCashEquivalentsAtCarryingValue",
    allowed_units: ["USD"],
    canonical_metric: "cash_and_equivalents",
    confidence: 0.995,
    explanation: "Exact us-gaap cash and cash equivalents concept with USD unit",
  },
]);
