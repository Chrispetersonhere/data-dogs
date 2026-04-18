export type CompensationCurrency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'JPY' | 'OTHER';

export type CompensationSourceMetadata = {
  sourceUrl: string;
  sourceAccession: string;
  sourceFetchedAt: string;
  sourceChecksum: string;
  parserVersion: string;
  ingestJobId: string;
  recordedAt: string;
};

export type Executive = {
  executiveId: string;
  issuerCik: string;
  personFullName: string;
  personGivenName?: string;
  personFamilyName?: string;
  externalPersonRef?: string;
  createdAt: string;
};

export type ExecutiveRoleHistory = CompensationSourceMetadata & {
  executiveRoleHistoryId: string;
  executiveId: string;
  roleTitle: string;
  roleStartDate: string;
  roleEndDate?: string;
  isPrincipalExecutiveOfficer: boolean;
  isPrincipalFinancialOfficer: boolean;
};

export type CompSummaryComponentCode =
  | 'salary'
  | 'bonus'
  | 'stock_awards'
  | 'option_awards'
  | 'non_equity_incentive_plan'
  | 'change_in_pension_value'
  | 'all_other_compensation'
  | 'total';

export type CompSummary = CompensationSourceMetadata & {
  compSummaryId: string;
  executiveId: string;
  fiscalYear: number;
  summaryComponentCode: CompSummaryComponentCode | (string & {});
  summaryComponentLabel: string;
  amount?: number;
  currency: CompensationCurrency;
};

export type CompAwardType =
  | 'equity_option'
  | 'restricted_stock'
  | 'performance_share'
  | 'cash_incentive'
  | 'deferred_comp'
  | 'other';

export type CompAward = CompensationSourceMetadata & {
  compAwardId: string;
  executiveId: string;
  fiscalYear: number;
  awardType: CompAwardType | (string & {});
  awardGrantDate?: string;
  awardVestDate?: string;
  awardQuantity?: number;
  awardExercisePrice?: number;
  awardTargetValue?: number;
  awardRealizedValue?: number;
  currency: CompensationCurrency;
};

export type GovernanceFactType =
  | 'board_committee_membership'
  | 'related_party_transaction'
  | 'clawback_policy'
  | 'stock_ownership_guideline'
  | 'succession_planning_note'
  | 'other';

export type GovernanceFact = CompensationSourceMetadata & {
  governanceFactId: string;
  executiveId?: string;
  fiscalYear?: number;
  factType: GovernanceFactType | (string & {});
  factValueText: string;
  effectiveDate?: string;
};
