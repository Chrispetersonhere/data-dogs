export type RatioGroupKey =
  | 'margins'
  | 'leverage'
  | 'liquidity'
  | 'efficiency'
  | 'valuation_support';

export type RatioDefinition = {
  label: string;
  formula: string;
  note: string;
};

export const RATIO_DEFINITIONS: Record<RatioGroupKey, Record<string, RatioDefinition>> = {
  margins: {
    gross_margin: {
      label: 'Gross Margin',
      formula: 'gross_profit / revenue',
      note: 'Profitability before operating expense burden.',
    },
    operating_margin: {
      label: 'Operating Margin',
      formula: 'operating_income / revenue',
      note: 'Operating profitability per revenue dollar.',
    },
    net_margin: {
      label: 'Net Margin',
      formula: 'net_income / revenue',
      note: 'Bottom-line profitability per revenue dollar.',
    },
    fcf_margin: {
      label: 'Free Cash Flow Margin',
      formula: '(cfo - capex) / revenue',
      note: 'Cash generation after reinvestment intensity.',
    },
  },
  leverage: {
    liabilities_to_equity: {
      label: 'Liabilities to Equity',
      formula: 'liabilities / equity',
      note: 'Simple balance-sheet leverage gauge.',
    },
    liabilities_to_assets: {
      label: 'Liabilities to Assets',
      formula: 'liabilities / assets',
      note: 'Share of assets funded by liabilities.',
    },
  },
  liquidity: {
    current_ratio: {
      label: 'Current Ratio',
      formula: 'current_assets / current_liabilities',
      note: 'Near-term obligations coverage from current assets.',
    },
    quick_ratio: {
      label: 'Quick Ratio',
      formula: '(current_assets - inventory) / current_liabilities',
      note: 'Stricter liquidity excluding inventory.',
    },
  },
  efficiency: {
    asset_turnover: {
      label: 'Asset Turnover',
      formula: 'revenue / assets',
      note: 'Revenue productivity of total assets.',
    },
    receivables_turnover: {
      label: 'Receivables Turnover',
      formula: 'revenue / receivables',
      note: 'Collection efficiency proxy.',
    },
  },
  valuation_support: {
    free_cash_flow: {
      label: 'Free Cash Flow',
      formula: 'cfo - capex',
      note: 'Valuation-ready support metric, not a ratio.',
    },
    eps: {
      label: 'Earnings Per Share',
      formula: 'net_income / shares',
      note: 'Per-share earnings support metric.',
    },
    ev_to_revenue: {
      label: 'EV to Revenue',
      formula: 'enterprise_value / revenue',
      note: 'Simple valuation multiple support metric.',
    },
    price_to_earnings: {
      label: 'Price to Earnings',
      formula: 'market_cap / net_income',
      note: 'Simple equity valuation multiple support metric.',
    },
    fcf_yield: {
      label: 'Free Cash Flow Yield',
      formula: '(cfo - capex) / market_cap',
      note: 'Cash return relative to equity valuation.',
    },
  },
};
