export type IssuerMetadata = {
  cik: string;
  companyId: string;
  name: string;
  ticker: string | null;
  exchange: string | null;
  sic: string | null;
  sicDescription: string | null;
  stateOfIncorporation: string | null;
  fiscalYearEnd: string | null;
};

export type IdentityHistoryItem = {
  name: string;
  from: string | null;
  to: string | null;
};

export type FilingCountSummary = {
  recentFilings: number;
  uniqueForms: number;
  annualFilings: number;
  quarterlyFilings: number;
  currentReportFilings: number;
};

export type LatestFiling = {
  accessionNumber: string;
  filingDate: string;
  form: string;
  primaryDocument: string;
  primaryDocDescription: string;
};

export type CompanyOverviewData = {
  issuerMetadata: IssuerMetadata;
  identityHistorySummary: IdentityHistoryItem[];
  filingCountSummary: FilingCountSummary;
  latestFilingsSummary: LatestFiling[];
};

type SecSubmissionsResponse = {
  cik: string;
  name: string;
  tickers?: string[];
  exchanges?: string[];
  sic?: string;
  sicDescription?: string;
  stateOfIncorporation?: string;
  fiscalYearEnd?: string;
  formerNames?: Array<{ name?: string; from?: string; to?: string }>;
  filings?: {
    recent?: {
      accessionNumber?: string[];
      filingDate?: string[];
      form?: string[];
      primaryDocument?: string[];
      primaryDocDescription?: string[];
    };
  };
};

function normalizeCompanyId(companyId: string): string {
  const digits = companyId.replace(/\D/g, '');
  if (!digits) {
    throw new Error('companyId must contain at least one digit');
  }
  return digits;
}

function padCik(companyId: string): string {
  return normalizeCompanyId(companyId).padStart(10, '0');
}

function secUserAgent(): string {
  return process.env.SEC_USER_AGENT?.trim() || 'DataDogs/1.0 (contact: engineering@datadogs.local)';
}

function asArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export async function getCompanyOverview(companyId: string): Promise<CompanyOverviewData> {
  const cikPadded = padCik(companyId);
  const url = `https://data.sec.gov/submissions/CIK${cikPadded}.json`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': secUserAgent(),
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`SEC submissions request failed (${response.status}) for CIK ${cikPadded}`);
  }

  const payload = (await response.json()) as SecSubmissionsResponse;
  const filings = payload.filings?.recent;
  const accessions = asArray(filings?.accessionNumber);
  const filingDates = asArray(filings?.filingDate);
  const forms = asArray(filings?.form);
  const primaryDocuments = asArray(filings?.primaryDocument);
  const primaryDescriptions = asArray(filings?.primaryDocDescription);

  const latestFilingsSummary: LatestFiling[] = accessions.slice(0, 8).map((accessionNumber, index) => ({
    accessionNumber,
    filingDate: filingDates[index] ?? 'unknown',
    form: forms[index] ?? 'unknown',
    primaryDocument: primaryDocuments[index] ?? '',
    primaryDocDescription: primaryDescriptions[index] ?? '',
  }));

  const filingCountSummary: FilingCountSummary = {
    recentFilings: accessions.length,
    uniqueForms: new Set(forms).size,
    annualFilings: forms.filter((form) => form === '10-K' || form === '20-F').length,
    quarterlyFilings: forms.filter((form) => form === '10-Q').length,
    currentReportFilings: forms.filter((form) => form === '8-K' || form === '6-K').length,
  };

  const identityHistorySummary: IdentityHistoryItem[] = asArray(payload.formerNames)
    .map((entry) => ({
      name: entry.name?.trim() || 'Unnamed historical identity',
      from: entry.from ?? null,
      to: entry.to ?? null,
    }))
    .slice(0, 10);

  return {
    issuerMetadata: {
      cik: payload.cik,
      companyId: normalizeCompanyId(companyId),
      name: payload.name,
      ticker: payload.tickers?.[0] ?? null,
      exchange: payload.exchanges?.[0] ?? null,
      sic: payload.sic ?? null,
      sicDescription: payload.sicDescription ?? null,
      stateOfIncorporation: payload.stateOfIncorporation ?? null,
      fiscalYearEnd: payload.fiscalYearEnd ?? null,
    },
    identityHistorySummary,
    filingCountSummary,
    latestFilingsSummary,
  };
}
