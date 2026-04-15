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

export type NormalizedFilingQueryFilters = {
  issuerCik: string;
  formTypes: Set<string>;
  dateFrom: string | null;
  dateTo: string | null;
  accession: string | null;
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

type SecSubmissionsResponse = {
  cik?: string;
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

function secUserAgent(): string {
  return process.env.SEC_USER_AGENT?.trim() || 'DataDogs/1.0 (contact: engineering@datadogs.local)';
}

function padCik(issuer: string): string {
  const digits = issuer.replace(/\D/g, '');
  if (!digits) {
    throw new Error('issuer filter is required and must contain at least one digit');
  }
  return digits.padStart(10, '0');
}

function asArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizeDate(value: string | undefined, fieldName: 'dateFrom' | 'dateTo'): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error(`${fieldName} must be YYYY-MM-DD`);
  }
  return trimmed;
}

function normalizeFormTypes(value: string | string[] | undefined): Set<string> {
  if (value === undefined) {
    return new Set();
  }

  const entries = Array.isArray(value) ? value : value.split(',');
  return new Set(
    entries
      .map((item) => item.trim().toUpperCase())
      .filter((item) => item.length > 0),
  );
}

function normalizeAccession(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeFilingQueryFilters(filters: FilingQueryFilters): NormalizedFilingQueryFilters {
  const issuerCik = padCik(filters.issuer);
  const dateFrom = normalizeDate(filters.dateFrom, 'dateFrom');
  const dateTo = normalizeDate(filters.dateTo, 'dateTo');
  if (dateFrom !== null && dateTo !== null && dateFrom > dateTo) {
    throw new Error('dateFrom must be <= dateTo');
  }

  return {
    issuerCik,
    formTypes: normalizeFormTypes(filters.formType),
    dateFrom,
    dateTo,
    accession: normalizeAccession(filters.accession),
  };
}

function withinDateRange(*, filingDate: string, dateFrom: string | null, dateTo: string | null): boolean {
  if (dateFrom !== null && filingDate < dateFrom) {
    return false;
  }
  if (dateTo !== null && filingDate > dateTo) {
    return false;
  }
  return true;
}

export function filterFilingsRows(
  rows: FilingRecord[],
  filters: NormalizedFilingQueryFilters,
): FilingRecord[] {
  return rows.filter((row) => {
    if (row.issuerCik !== filters.issuerCik) {
      return false;
    }
    if (filters.formTypes.size > 0 && !filters.formTypes.has(row.formType.toUpperCase())) {
      return false;
    }
    if (!withinDateRange(filingDate=row.filingDate, dateFrom=filters.dateFrom, dateTo=filters.dateTo)) {
      return false;
    }
    if (filters.accession !== null && row.accession !== filters.accession) {
      return false;
    }
    return true;
  });
}

export async function queryFilings(filters: FilingQueryFilters): Promise<FilingQueryResult> {
  const normalized = normalizeFilingQueryFilters(filters);
  const url = `https://data.sec.gov/submissions/CIK${normalized.issuerCik}.json`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': secUserAgent(),
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`SEC submissions request failed (${response.status}) for CIK ${normalized.issuerCik}`);
  }

  const payload = (await response.json()) as SecSubmissionsResponse;
  const recent = payload.filings?.recent;
  const accessionNumbers = asArray(recent?.accessionNumber);
  const filingDates = asArray(recent?.filingDate);
  const forms = asArray(recent?.form);
  const primaryDocuments = asArray(recent?.primaryDocument);
  const primaryDescriptions = asArray(recent?.primaryDocDescription);

  const rows: FilingRecord[] = accessionNumbers.map((accession, index) => ({
    issuerCik: normalized.issuerCik,
    accession,
    filingDate: filingDates[index] ?? 'unknown',
    formType: forms[index] ?? 'unknown',
    primaryDocument: primaryDocuments[index] ?? '',
    primaryDocDescription: primaryDescriptions[index] ?? '',
  }));

  return {
    issuerCik: normalized.issuerCik,
    filtersApplied: {
      formTypes: [...normalized.formTypes],
      dateFrom: normalized.dateFrom,
      dateTo: normalized.dateTo,
      accession: normalized.accession,
    },
    filings: filterFilingsRows(rows, normalized).slice(0, 200),
  };
}
