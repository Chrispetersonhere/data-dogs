export type FilingRecord = {
  issuerCik: string;
  accession: string;
  filingDate: string;
  formType: string;
  primaryDocument: string;
  primaryDocDescription: string;
};

export type FilingQueryFilters = {
  issuer: string;
  formType?: string | string[];
  dateFrom?: string;
  dateTo?: string;
  accession?: string;
};

export type FilingQueryResult = {
  issuerCik: string;
  filtersApplied: {
    formTypes: string[];
    dateFrom: string | null;
    dateTo: string | null;
    accession: string | null;
  };
  filings: FilingRecord[];
};
