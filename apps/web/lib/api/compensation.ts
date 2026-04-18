export type CompensationRow = {
  executiveName: string;
  title: string;
  fiscalYear: number;
  totalCompensationUsd: number;
  sourceUrl: string;
  accession: string;
  filingDate: string;
};

export type CompensationSource = {
  accession: string;
  filingDate: string;
  form: string;
  sourceUrl: string;
};

export type CompensationHistoryPoint = {
  executiveName: string;
  fiscalYear: number;
  totalCompensationUsd: number;
  latestSourceUrl: string;
};

export type CompanyCompensationData = {
  companyName: string;
  cik: string;
  rows: CompensationRow[];
  history: CompensationHistoryPoint[];
  sources: CompensationSource[];
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
  sourceUrl: string;
};

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

function toSourceUrl(cik: string, accession: string, primaryDocument: string): string {
  const safeDoc = primaryDocument || 'index.htm';
  return `https://www.sec.gov/Archives/edgar/data/${Number.parseInt(cik, 10)}/${accessionForPath(accession)}/${safeDoc}`;
}

function decodeHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#160;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeExecutiveName(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/\*+/g, '')
    .replace(/\([^)]*\)/g, '')
    .trim();
}

function extractYearTokens(text: string): number[] {
  const matches = text.match(/\b(20\d{2}|19\d{2})\b/g) ?? [];
  const out: number[] = [];
  for (const match of matches) {
    const year = Number.parseInt(match, 10);
    if (year >= 1990 && year <= 2100) {
      out.push(year);
    }
  }
  return out;
}

function parseDollarValue(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.()-]/g, '');
  if (!cleaned) {
    return null;
  }
  const negative = cleaned.startsWith('(') && cleaned.endsWith(')');
  const numeric = cleaned.replace(/[()]/g, '');
  const parsed = Number.parseFloat(numeric);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return negative ? -parsed : parsed;
}

function titleFromLine(line: string): string {
  const lower = line.toLowerCase();
  if (lower.includes('chief executive officer') || lower.includes(' ceo')) {
    return 'Chief Executive Officer';
  }
  if (lower.includes('chief financial officer') || lower.includes(' cfo')) {
    return 'Chief Financial Officer';
  }
  if (lower.includes('chief operating officer') || lower.includes(' coo')) {
    return 'Chief Operating Officer';
  }
  if (lower.includes('president')) {
    return 'President';
  }
  return 'Named Executive Officer';
}

function uniqueRows(rows: CompensationRow[]): CompensationRow[] {
  const seen = new Set<string>();
  const out: CompensationRow[] = [];
  for (const row of rows) {
    const key = `${row.executiveName}|${row.fiscalYear}|${row.totalCompensationUsd}|${row.accession}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(row);
  }
  return out;
}

function parseCompensationRows(args: {
  rawHtml: string;
  filing: FilingCandidate;
}): CompensationRow[] {
  const plain = decodeHtmlText(args.rawHtml);
  const lines = plain
    .split(/(?<=\.)\s+|\s{2,}/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 8000);

  const rows: CompensationRow[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (!lower.includes('total') && !lower.includes('compensation')) {
      continue;
    }

    const amountMatches = line.match(/\$?\(?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\)?/g) ?? [];
    const years = extractYearTokens(line);
    if (amountMatches.length === 0 || years.length === 0) {
      continue;
    }

    const nameMatch = line.match(/([A-Z][A-Za-z'\-.]+(?:\s+[A-Z][A-Za-z'\-.]+){1,3})/);
    if (!nameMatch) {
      continue;
    }

    const executiveName = normalizeExecutiveName(nameMatch[1] ?? '');
    if (executiveName.length < 3) {
      continue;
    }

    const year = years[0];
    const parsedAmounts = amountMatches
      .map((value) => parseDollarValue(value))
      .filter((value): value is number => value !== null)
      .filter((value) => value > 10_000)
      .sort((a, b) => b - a);

    if (parsedAmounts.length === 0) {
      continue;
    }

    rows.push({
      executiveName,
      title: titleFromLine(line),
      fiscalYear: year,
      totalCompensationUsd: parsedAmounts[0],
      sourceUrl: args.filing.sourceUrl,
      accession: args.filing.accession,
      filingDate: args.filing.filingDate,
    });
  }

  return uniqueRows(rows);
}

function buildHistory(rows: CompensationRow[]): CompensationHistoryPoint[] {
  const grouped = new Map<string, CompensationRow>();

  for (const row of rows) {
    const key = `${row.executiveName}|${row.fiscalYear}`;
    const existing = grouped.get(key);
    if (!existing || row.filingDate > existing.filingDate) {
      grouped.set(key, row);
    }
  }

  return [...grouped.values()]
    .map((row) => ({
      executiveName: row.executiveName,
      fiscalYear: row.fiscalYear,
      totalCompensationUsd: row.totalCompensationUsd,
      latestSourceUrl: row.sourceUrl,
    }))
    .sort((a, b) => (a.executiveName === b.executiveName ? b.fiscalYear - a.fiscalYear : a.executiveName.localeCompare(b.executiveName)));
}

export async function getCompanyCompensation(companyId: string): Promise<CompanyCompensationData> {
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
    .map((accession, index) => ({
      accession,
      filingDate: filingDates[index] ?? 'unknown',
      form: forms[index] ?? 'unknown',
      primaryDocument: primaryDocuments[index] ?? 'index.htm',
      sourceUrl: toSourceUrl(cik, accession, primaryDocuments[index] ?? 'index.htm'),
    }))
    .filter((filing) => filing.form === 'DEF 14A' || filing.form === 'DEFA14A')
    .slice(0, 6);

  const sources: CompensationSource[] = candidates.map((item) => ({
    accession: item.accession,
    filingDate: item.filingDate,
    form: item.form,
    sourceUrl: item.sourceUrl,
  }));

  const parsedRows: CompensationRow[] = [];

  for (const filing of candidates) {
    const filingResponse = await fetch(filing.sourceUrl, {
      method: 'GET',
      headers: {
        'User-Agent': secUserAgent(),
        Accept: 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 900 },
    });

    if (!filingResponse.ok) {
      continue;
    }

    const rawHtml = await filingResponse.text();
    parsedRows.push(...parseCompensationRows({ rawHtml, filing }));
  }

  const rows = parsedRows
    .sort((a, b) => (b.fiscalYear - a.fiscalYear) || (b.totalCompensationUsd - a.totalCompensationUsd))
    .slice(0, 60);

  return {
    companyName: payload.name ?? `CIK ${cik}`,
    cik,
    rows,
    history: buildHistory(rows),
    sources,
  };
}
