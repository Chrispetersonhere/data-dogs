export type FilingDocument = {
  filename: string;
  description: string;
  type: string;
  size: string;
  url: string;
};

export type FilingSection = {
  name: string;
  anchor: string;
};

export type FilingProvenanceSummary = {
  sourceUrl: string;
  fetchedVia: string;
  accession: string;
  filingIndexUrl: string;
};

export type FilingDetailData = {
  accession: string;
  issuerCik: string;
  issuerName: string;
  formType: string;
  filingDate: string;
  acceptanceDateTime: string;
  primaryDocument: string;
  primaryDocDescription: string;
  documents: FilingDocument[];
  sections: FilingSection[];
  provenance: FilingProvenanceSummary;
};

type SecSubmissionsResponse = {
  cik: string;
  name: string;
  filings?: {
    recent?: {
      accessionNumber?: string[];
      filingDate?: string[];
      form?: string[];
      primaryDocument?: string[];
      primaryDocDescription?: string[];
      acceptanceDateTime?: string[];
    };
  };
};

type FilingIndexEntry = {
  name?: string;
  description?: string;
  type?: string;
  size?: number;
};

type FilingIndexResponse = {
  directory?: {
    item?: FilingIndexEntry[];
  };
};

function secUserAgent(): string {
  return process.env.SEC_USER_AGENT?.trim() || 'DataDogs/1.0 (contact: engineering@datadogs.local)';
}

function padCik(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    throw new Error('CIK must contain at least one digit');
  }
  return digits.padStart(10, '0');
}

function asArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function buildFilingBaseUrl(cik: string, accession: string): string {
  const cikNumber = Number.parseInt(cik, 10).toString();
  const accessionCompact = accession.replace(/-/g, '');
  return `https://www.sec.gov/Archives/edgar/data/${cikNumber}/${accessionCompact}`;
}

function buildFilingIndexUrl(cik: string, accession: string): string {
  return `${buildFilingBaseUrl(cik, accession)}/${accession}-index.html`;
}

function buildDocumentUrl(cik: string, accession: string, filename: string): string {
  return `${buildFilingBaseUrl(cik, accession)}/${filename}`;
}

/** Well-known 10-K / 10-Q section anchors for available-section detection. */
const KNOWN_SECTIONS: FilingSection[] = [
  { name: 'Financial Statements', anchor: 'financial-statements' },
  { name: 'Risk Factors', anchor: 'risk-factors' },
  { name: "Management's Discussion and Analysis", anchor: 'mda' },
  { name: 'Controls and Procedures', anchor: 'controls-and-procedures' },
  { name: 'Legal Proceedings', anchor: 'legal-proceedings' },
  { name: 'Executive Compensation', anchor: 'executive-compensation' },
];

function inferSections(formType: string): FilingSection[] {
  const upper = formType.toUpperCase();
  if (upper === '10-K' || upper === '10-Q' || upper === '20-F') {
    return KNOWN_SECTIONS;
  }
  return [];
}

export function normalizeAccession(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error('accession number is required');
  }
  return trimmed;
}

export function buildDocumentsFromIndex(
  items: FilingIndexEntry[],
  cik: string,
  accession: string,
): FilingDocument[] {
  return items
    .filter((item) => item.name && item.name.length > 0)
    .map((item) => ({
      filename: item.name!,
      description: item.description ?? '',
      type: item.type ?? '',
      size: item.size !== undefined ? String(item.size) : '',
      url: buildDocumentUrl(cik, accession, item.name!),
    }));
}

export async function getFilingDetail(accessionRaw: string): Promise<FilingDetailData> {
  const accession = normalizeAccession(accessionRaw);

  // Step 1: Discover the issuer CIK from the accession prefix (first 10 digits).
  const accessionParts = accession.split('-');
  if (accessionParts.length < 3) {
    throw new Error(`Invalid accession format: ${accession}`);
  }
  const issuerCikRaw = accessionParts[0];
  const issuerCik = padCik(issuerCikRaw);
  const submissionsUrl = `https://data.sec.gov/submissions/CIK${issuerCik}.json`;

  const headers = {
    'User-Agent': secUserAgent(),
    Accept: 'application/json',
  };

  // Step 2: Fetch submissions to find this accession's metadata row.
  const submissionsResponse = await fetch(submissionsUrl, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (!submissionsResponse.ok) {
    throw new Error(`SEC submissions request failed (${submissionsResponse.status}) for CIK ${issuerCik}`);
  }

  const submissions = (await submissionsResponse.json()) as SecSubmissionsResponse;
  const recent = submissions.filings?.recent;
  const accessions = asArray(recent?.accessionNumber);
  const filingDates = asArray(recent?.filingDate);
  const forms = asArray(recent?.form);
  const primaryDocuments = asArray(recent?.primaryDocument);
  const primaryDescriptions = asArray(recent?.primaryDocDescription);
  const acceptanceDateTimes = asArray(recent?.acceptanceDateTime);

  const rowIndex = accessions.indexOf(accession);
  if (rowIndex === -1) {
    throw new Error(`Accession ${accession} not found in recent filings for CIK ${issuerCik}`);
  }

  const formType = forms[rowIndex] ?? 'unknown';
  const filingDate = filingDates[rowIndex] ?? 'unknown';
  const primaryDocument = primaryDocuments[rowIndex] ?? '';
  const primaryDocDescription = primaryDescriptions[rowIndex] ?? '';
  const acceptanceDateTime = acceptanceDateTimes[rowIndex] ?? '';

  // Step 3: Fetch the filing index to get linked documents.
  const filingIndexJsonUrl = `${buildFilingBaseUrl(issuerCik, accession)}/${accession}-index.json`;
  let documents: FilingDocument[] = [];

  try {
    const indexResponse = await fetch(filingIndexJsonUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (indexResponse.ok) {
      const indexPayload = (await indexResponse.json()) as FilingIndexResponse;
      const items = indexPayload.directory?.item ?? [];
      documents = buildDocumentsFromIndex(items, issuerCik, accession);
    }
  } catch {
    // Filing index fetch is best-effort; linked documents will be empty.
  }

  return {
    accession,
    issuerCik,
    issuerName: submissions.name ?? 'Issuer name unavailable',
    formType,
    filingDate,
    acceptanceDateTime,
    primaryDocument,
    primaryDocDescription,
    documents,
    sections: inferSections(formType),
    provenance: {
      sourceUrl: submissionsUrl,
      fetchedVia: 'SEC EDGAR submissions API',
      accession,
      filingIndexUrl: buildFilingIndexUrl(issuerCik, accession),
    },
  };
}
