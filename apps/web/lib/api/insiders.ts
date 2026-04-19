export type InsiderRoleFilter = 'all' | 'director' | 'officer' | 'ten_percent_owner' | 'other';

export const INSIDER_ROLE_FILTERS: InsiderRoleFilter[] = [
  'all',
  'director',
  'officer',
  'ten_percent_owner',
  'other',
];

export type InsiderRoleFlags = {
  isDirector: boolean;
  isOfficer: boolean;
  isTenPercentOwner: boolean;
  isOther: boolean;
};

export type InsiderActivityRow = {
  reporterName: string;
  reporterCik: string | null;
  officerTitle: string | null;
  roles: InsiderRoleFlags;
  securityTitle: string | null;
  transactionDate: string;
  transactionCode: string | null;
  acquiredOrDisposed: 'A' | 'D' | null;
  shares: number | null;
  pricePerShare: number | null;
  sharesOwnedAfter: number | null;
  isDerivative: boolean;
  form: string;
  accession: string;
  filingDate: string;
  primaryDocument: string;
  primaryDocUrl: string;
  filingIndexUrl: string;
  issuerCik: string;
};

export type InsiderFilingSource = {
  accession: string;
  form: string;
  filingDate: string;
  primaryDocUrl: string;
  filingIndexUrl: string;
};

export type CompanyInsidersData = {
  companyName: string;
  cik: string;
  role: InsiderRoleFilter;
  rows: InsiderActivityRow[];
  sources: InsiderFilingSource[];
};

type SecSubmissionsResponse = {
  cik?: string;
  name?: string;
  filings?: {
    recent?: {
      accessionNumber?: string[];
      filingDate?: string[];
      form?: string[];
      primaryDocument?: string[];
    };
  };
};

type FilingCandidate = {
  accession: string;
  filingDate: string;
  form: string;
  primaryDocument: string;
  primaryDocUrl: string;
  filingIndexUrl: string;
  issuerCik: string;
};

const INSIDER_FORMS = new Set(['3', '3/A', '4', '4/A', '5', '5/A']);

function secUserAgent(): string {
  return process.env.SEC_USER_AGENT?.trim() || 'DataDogs/1.0 (contact: engineering@datadogs.local)';
}

function padCik(companyId: string): string {
  const digits = companyId.replace(/\D/g, '');
  if (!digits) {
    throw new Error('companyId must contain at least one digit');
  }
  return digits.padStart(10, '0');
}

function asArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function accessionForPath(accession: string): string {
  return accession.replace(/-/g, '');
}

function toPrimaryDocUrl(cik: string, accession: string, primaryDocument: string): string {
  const safeDoc = primaryDocument || 'index.htm';
  return `https://www.sec.gov/Archives/edgar/data/${Number.parseInt(cik, 10)}/${accessionForPath(accession)}/${safeDoc}`;
}

function toFilingDirectoryUrl(cik: string, accession: string): string {
  return `https://www.sec.gov/Archives/edgar/data/${Number.parseInt(cik, 10)}/${accessionForPath(accession)}/`;
}

export function normalizeInsiderRoleFilter(value: string | undefined | null): InsiderRoleFilter {
  if (!value) {
    return 'all';
  }
  const lowered = value.trim().toLowerCase();
  if ((INSIDER_ROLE_FILTERS as string[]).includes(lowered)) {
    return lowered as InsiderRoleFilter;
  }
  return 'all';
}

export function rolesMatchFilter(roles: InsiderRoleFlags, filter: InsiderRoleFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'director':
      return roles.isDirector;
    case 'officer':
      return roles.isOfficer;
    case 'ten_percent_owner':
      return roles.isTenPercentOwner;
    case 'other':
      return roles.isOther;
  }
}

export function filterInsiderActivityRows(
  rows: InsiderActivityRow[],
  filter: InsiderRoleFilter,
): InsiderActivityRow[] {
  return rows.filter((row) => rolesMatchFilter(row.roles, filter));
}

export function compareInsiderRowsChronologically(
  a: InsiderActivityRow,
  b: InsiderActivityRow,
): number {
  if (a.transactionDate !== b.transactionDate) {
    return a.transactionDate < b.transactionDate ? 1 : -1;
  }
  if (a.filingDate !== b.filingDate) {
    return a.filingDate < b.filingDate ? 1 : -1;
  }
  if (a.accession !== b.accession) {
    return a.accession < b.accession ? 1 : -1;
  }
  return a.reporterName.localeCompare(b.reporterName);
}

function xmlField(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  if (!match) {
    return null;
  }
  return match[1].trim();
}

function xmlValue(xml: string, tag: string): string | null {
  const outer = xmlField(xml, tag);
  if (outer === null) {
    return null;
  }
  const innerMatch = outer.match(/<value>([\s\S]*?)<\/value>/i);
  if (innerMatch) {
    return innerMatch[1].trim();
  }
  return outer.replace(/<[^>]+>/g, '').trim();
}

function parseBooleanFlag(xml: string, tag: string): boolean {
  const raw = xmlValue(xml, tag);
  if (raw === null) {
    return false;
  }
  const normalized = raw.trim().toLowerCase();
  return normalized === '1' || normalized === 'true';
}

function parseDecimalValue(xml: string, tag: string): number | null {
  const raw = xmlValue(xml, tag);
  if (raw === null || raw.length === 0) {
    return null;
  }
  const cleaned = raw.replace(/[^0-9.-]/g, '');
  if (!cleaned) {
    return null;
  }
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseAcquiredOrDisposed(block: string): 'A' | 'D' | null {
  const raw = xmlValue(block, 'transactionAcquiredDisposedCode');
  if (raw === 'A' || raw === 'D') {
    return raw;
  }
  return null;
}

function extractBlocks(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>`, 'gi');
  return xml.match(regex) ?? [];
}

function parseReporter(xml: string): {
  reporterName: string;
  reporterCik: string | null;
  roles: InsiderRoleFlags;
  officerTitle: string | null;
} | null {
  const ownerBlock = xmlField(xml, 'reportingOwner');
  if (!ownerBlock) {
    return null;
  }
  const idBlock = xmlField(ownerBlock, 'reportingOwnerId') ?? '';
  const relationshipBlock = xmlField(ownerBlock, 'reportingOwnerRelationship') ?? '';

  const reporterName = xmlValue(idBlock, 'rptOwnerName') ?? xmlValue(ownerBlock, 'rptOwnerName');
  if (!reporterName) {
    return null;
  }
  const reporterCikRaw = xmlValue(idBlock, 'rptOwnerCik') ?? xmlValue(ownerBlock, 'rptOwnerCik');
  const reporterCik = reporterCikRaw && /^\d+$/.test(reporterCikRaw) ? reporterCikRaw.padStart(10, '0') : null;

  const roles: InsiderRoleFlags = {
    isDirector: parseBooleanFlag(relationshipBlock, 'isDirector'),
    isOfficer: parseBooleanFlag(relationshipBlock, 'isOfficer'),
    isTenPercentOwner: parseBooleanFlag(relationshipBlock, 'isTenPercentOwner'),
    isOther: parseBooleanFlag(relationshipBlock, 'isOther'),
  };
  const officerTitleRaw = xmlValue(relationshipBlock, 'officerTitle');
  const officerTitle = officerTitleRaw && officerTitleRaw.length > 0 ? officerTitleRaw : null;

  return { reporterName: reporterName.trim(), reporterCik, roles, officerTitle };
}

export function parseInsiderActivityFromXml(args: {
  xml: string;
  filing: FilingCandidate;
}): InsiderActivityRow[] {
  const { xml, filing } = args;
  const reporter = parseReporter(xml);
  if (!reporter) {
    return [];
  }

  const nonDerivativeBlock = xmlField(xml, 'nonDerivativeTable') ?? '';
  const derivativeBlock = xmlField(xml, 'derivativeTable') ?? '';

  const nonDerivativeTxs = extractBlocks(nonDerivativeBlock, 'nonDerivativeTransaction');
  const derivativeTxs = extractBlocks(derivativeBlock, 'derivativeTransaction');

  const rows: InsiderActivityRow[] = [];

  const buildRow = (block: string, isDerivative: boolean): InsiderActivityRow | null => {
    const securityTitle = xmlValue(block, 'securityTitle');
    const transactionDate = xmlValue(block, 'transactionDate') ?? filing.filingDate;
    const transactionCode = xmlValue(block, 'transactionCode');
    const shares = parseDecimalValue(block, 'transactionShares');
    const pricePerShare = parseDecimalValue(block, 'transactionPricePerShare');
    const sharesOwnedAfter = parseDecimalValue(block, 'sharesOwnedFollowingTransaction');
    const acquiredOrDisposed = parseAcquiredOrDisposed(block);

    return {
      reporterName: reporter.reporterName,
      reporterCik: reporter.reporterCik,
      officerTitle: reporter.officerTitle,
      roles: reporter.roles,
      securityTitle,
      transactionDate,
      transactionCode,
      acquiredOrDisposed,
      shares,
      pricePerShare,
      sharesOwnedAfter,
      isDerivative,
      form: filing.form,
      accession: filing.accession,
      filingDate: filing.filingDate,
      primaryDocument: filing.primaryDocument,
      primaryDocUrl: filing.primaryDocUrl,
      filingIndexUrl: filing.filingIndexUrl,
      issuerCik: filing.issuerCik,
    };
  };

  for (const block of nonDerivativeTxs) {
    const row = buildRow(block, false);
    if (row) {
      rows.push(row);
    }
  }
  for (const block of derivativeTxs) {
    const row = buildRow(block, true);
    if (row) {
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    rows.push({
      reporterName: reporter.reporterName,
      reporterCik: reporter.reporterCik,
      officerTitle: reporter.officerTitle,
      roles: reporter.roles,
      securityTitle: null,
      transactionDate: filing.filingDate,
      transactionCode: null,
      acquiredOrDisposed: null,
      shares: null,
      pricePerShare: null,
      sharesOwnedAfter: null,
      isDerivative: false,
      form: filing.form,
      accession: filing.accession,
      filingDate: filing.filingDate,
      primaryDocument: filing.primaryDocument,
      primaryDocUrl: filing.primaryDocUrl,
      filingIndexUrl: filing.filingIndexUrl,
      issuerCik: filing.issuerCik,
    });
  }

  return rows;
}

export function parseInsiderActivityForTest(args: {
  xml: string;
  accession: string;
  filingDate: string;
  form: string;
  primaryDocument: string;
  issuerCik: string;
}): InsiderActivityRow[] {
  const cik = padCik(args.issuerCik);
  const filing: FilingCandidate = {
    accession: args.accession,
    filingDate: args.filingDate,
    form: args.form,
    primaryDocument: args.primaryDocument,
    primaryDocUrl: toPrimaryDocUrl(cik, args.accession, args.primaryDocument),
    filingIndexUrl: toFilingDirectoryUrl(cik, args.accession),
    issuerCik: cik,
  };
  return parseInsiderActivityFromXml({ xml: args.xml, filing });
}

export async function getCompanyInsiders(
  companyId: string,
  role: InsiderRoleFilter = 'all',
): Promise<CompanyInsidersData> {
  const cik = padCik(companyId);
  const submissionsUrl = `https://data.sec.gov/submissions/CIK${cik}.json`;

  const submissionsResponse = await fetch(submissionsUrl, {
    method: 'GET',
    headers: {
      'User-Agent': secUserAgent(),
      Accept: 'application/json',
    },
    next: { revalidate: 900 },
  });

  if (!submissionsResponse.ok) {
    throw new Error(`SEC submissions request failed (${submissionsResponse.status}) for CIK ${cik}`);
  }

  const payload = (await submissionsResponse.json()) as SecSubmissionsResponse;
  const recent = payload.filings?.recent;
  const accessions = asArray(recent?.accessionNumber);
  const filingDates = asArray(recent?.filingDate);
  const forms = asArray(recent?.form);
  const primaryDocuments = asArray(recent?.primaryDocument);

  const candidates: FilingCandidate[] = accessions
    .map((accession, index) => {
      const form = forms[index] ?? 'unknown';
      const filingDate = filingDates[index] ?? 'unknown';
      const primaryDocument = primaryDocuments[index] ?? 'index.htm';
      return {
        accession,
        form,
        filingDate,
        primaryDocument,
        primaryDocUrl: toPrimaryDocUrl(cik, accession, primaryDocument),
        filingIndexUrl: toFilingDirectoryUrl(cik, accession),
        issuerCik: cik,
      };
    })
    .filter((filing) => INSIDER_FORMS.has(filing.form))
    .sort((a, b) => (a.filingDate < b.filingDate ? 1 : a.filingDate > b.filingDate ? -1 : 0))
    .slice(0, 25);

  const sources: InsiderFilingSource[] = candidates.map((item) => ({
    accession: item.accession,
    form: item.form,
    filingDate: item.filingDate,
    primaryDocUrl: item.primaryDocUrl,
    filingIndexUrl: item.filingIndexUrl,
  }));

  const parsed: InsiderActivityRow[] = [];
  for (const filing of candidates) {
    if (!filing.primaryDocument.toLowerCase().endsWith('.xml')) {
      continue;
    }

    const filingResponse = await fetch(filing.primaryDocUrl, {
      method: 'GET',
      headers: {
        'User-Agent': secUserAgent(),
        Accept: 'application/xml,text/xml',
      },
      next: { revalidate: 900 },
    });

    if (!filingResponse.ok) {
      continue;
    }

    const xml = await filingResponse.text();
    parsed.push(...parseInsiderActivityFromXml({ xml, filing }));
  }

  const rows = filterInsiderActivityRows(parsed, role)
    .sort(compareInsiderRowsChronologically)
    .slice(0, 200);

  return {
    companyName: payload.name ?? `CIK ${cik}`,
    cik,
    role,
    rows,
    sources,
  };
}

