export type FilingDetailQuery = {
  issuer: string;
  accession: string;
};

export type FilingMetadata = {
  issuerCik: string;
  accession: string;
  filingDate: string;
  formType: string;
  primaryDocument: string;
  primaryDocDescription: string;
  acceptanceDateTime: string;
  reportDate: string;
  fileNumber: string;
  filmNumber: string;
  size: number | null;
  isXbrl: number | null;
  isInlineXbrl: number | null;
  items: string;
};

export type FilingLinkedDocument = {
  name: string;
  href: string;
  size: number | null;
  lastModified: string;
};

export type FilingProvenanceSummary = {
  submissionsUrl: string;
  filingIndexJsonUrl: string;
  filingIndexHtmlUrl: string;
  matchedRecentIndex: number;
  extractedFields: string[];
};

export type FilingDetailResult = {
  metadata: FilingMetadata;
  linkedDocuments: FilingLinkedDocument[];
  provenance: FilingProvenanceSummary;
  availableSections: string[];
};

type SecSubmissionsResponse = {
  filings?: {
    recent?: {
      accessionNumber?: string[];
      filingDate?: string[];
      form?: string[];
      primaryDocument?: string[];
      primaryDocDescription?: string[];
      acceptanceDateTime?: string[];
      reportDate?: string[];
      fileNumber?: string[];
      filmNumber?: string[];
      size?: number[];
      isXBRL?: number[];
      isInlineXBRL?: number[];
      items?: string[];
    };
  };
};

type SecDirectoryItem = {
  name?: string;
  size?: number;
  last_modified?: string;
};

type SecIndexResponse = {
  directory?: {
    item?: SecDirectoryItem[];
  };
};

function secUserAgent(): string {
  return process.env.SEC_USER_AGENT?.trim() || 'DataDogs/1.0 (contact: engineering@datadogs.local)';
}

function padCik(issuer: string): string {
  const digits = issuer.replace(/\D/g, '');
  if (!digits) {
    throw new Error('issuer is required and must contain at least one digit');
  }
  return digits.padStart(10, '0');
}

function requireAccession(accession: string): string {
  const trimmed = accession.trim();
  if (!trimmed) {
    throw new Error('accession is required');
  }
  return trimmed;
}

function asArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export function splitAvailableSections(items: string): string[] {
  return items
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function buildFilingArchiveBaseUrl(issuerCik: string, accession: string): string {
  const cikNumber = Number.parseInt(issuerCik, 10).toString();
  const accessionCompact = accession.replace(/-/g, '');
  return `https://www.sec.gov/Archives/edgar/data/${cikNumber}/${accessionCompact}`;
}

function buildLinkedDocuments(args: { issuerCik: string; accession: string; payload: SecIndexResponse }): FilingLinkedDocument[] {
  const items = asArray(args.payload.directory?.item);
  const baseUrl = buildFilingArchiveBaseUrl(args.issuerCik, args.accession);

  return items
    .filter((item) => typeof item.name === 'string' && item.name.length > 0)
    .map((item) => ({
      name: item.name as string,
      href: `${baseUrl}/${item.name as string}`,
      size: typeof item.size === 'number' ? item.size : null,
      lastModified: item.last_modified ?? '',
    }));
}

export async function queryFilingDetail(query: FilingDetailQuery): Promise<FilingDetailResult> {
  const issuerCik = padCik(query.issuer);
  const accession = requireAccession(query.accession);

  const submissionsUrl = `https://data.sec.gov/submissions/CIK${issuerCik}.json`;
  const submissionsResponse = await fetch(submissionsUrl, {
    method: 'GET',
    headers: {
      'User-Agent': secUserAgent(),
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!submissionsResponse.ok) {
    throw new Error(`SEC submissions request failed (${submissionsResponse.status}) for CIK ${issuerCik}`);
  }

  const submissions = (await submissionsResponse.json()) as SecSubmissionsResponse;
  const recent = submissions.filings?.recent;
  const accessionNumbers = asArray(recent?.accessionNumber);
  const rowIndex = accessionNumbers.findIndex((candidate) => candidate === accession);

  if (rowIndex < 0) {
    throw new Error(`Accession ${accession} not found in recent submissions for CIK ${issuerCik}`);
  }

  const baseUrl = buildFilingArchiveBaseUrl(issuerCik, accession);
  const filingIndexJsonUrl = `${baseUrl}/index.json`;
  const filingIndexHtmlUrl = `${baseUrl}/${accession}-index.html`;

  const indexResponse = await fetch(filingIndexJsonUrl, {
    method: 'GET',
    headers: {
      'User-Agent': secUserAgent(),
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!indexResponse.ok) {
    throw new Error(`SEC filing index request failed (${indexResponse.status}) for accession ${accession}`);
  }

  const indexPayload = (await indexResponse.json()) as SecIndexResponse;

  const metadata: FilingMetadata = {
    issuerCik,
    accession,
    filingDate: asArray(recent?.filingDate)[rowIndex] ?? 'unknown',
    formType: asArray(recent?.form)[rowIndex] ?? 'unknown',
    primaryDocument: asArray(recent?.primaryDocument)[rowIndex] ?? '',
    primaryDocDescription: asArray(recent?.primaryDocDescription)[rowIndex] ?? '',
    acceptanceDateTime: asArray(recent?.acceptanceDateTime)[rowIndex] ?? '',
    reportDate: asArray(recent?.reportDate)[rowIndex] ?? '',
    fileNumber: asArray(recent?.fileNumber)[rowIndex] ?? '',
    filmNumber: asArray(recent?.filmNumber)[rowIndex] ?? '',
    size: asArray(recent?.size)[rowIndex] ?? null,
    isXbrl: asArray(recent?.isXBRL)[rowIndex] ?? null,
    isInlineXbrl: asArray(recent?.isInlineXBRL)[rowIndex] ?? null,
    items: asArray(recent?.items)[rowIndex] ?? '',
  };

  return {
    metadata,
    linkedDocuments: buildLinkedDocuments({ issuerCik, accession, payload: indexPayload }),
    provenance: {
      submissionsUrl,
      filingIndexJsonUrl,
      filingIndexHtmlUrl,
      matchedRecentIndex: rowIndex,
      extractedFields: [
        'filings.recent.accessionNumber',
        'filings.recent.filingDate',
        'filings.recent.form',
        'filings.recent.primaryDocument',
        'filings.recent.primaryDocDescription',
        'filings.recent.items',
        'index.json directory.item[]',
      ],
    },
    availableSections: splitAvailableSections(metadata.items),
  };
}
