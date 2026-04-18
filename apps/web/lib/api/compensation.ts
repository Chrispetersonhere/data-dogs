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
    .replace(/\s*,\s*/g, ', ')
    .trim();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#160;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
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

function stripHtml(cell: string): string {
  return decodeHtmlEntities(cell.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function extractTableRows(html: string): string[][] {
  const rowMatches = html.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  const rows: string[][] = [];

  for (const rowHtml of rowMatches) {
    const cells = rowHtml.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) ?? [];
    const parsed = cells.map((cell) => stripHtml(cell));
    if (parsed.length > 0) {
      rows.push(parsed);
    }
  }

  return rows;
}

const NOISE_EXECUTIVE_LABELS = new Set([
  'summary compensation table',
  'proxy statement',
  'relative tsr',
  'audit fees',
  'other neo',
  'name stock options',
  'name estimated total value',
  'name grant date number',
  'cash incentive plan',
  'scorecard focus',
  'contents summary governance directors',
  'average summary compensation table',
  'base salary',
  'variable cash',
  'cash bonus',
  'salary',
  'bonus',
  'stock awards',
  'option awards',
  'non-equity incentive plan compensation',
  'all other compensation',
  'total',
  'my psus',
  'sy psus',
]);

function looksLikeExecutiveName(value: string): boolean {
  const normalized = normalizeExecutiveName(value);
  if (normalized.length < 5 || normalized.length > 60) {
    return false;
  }
  if (NOISE_EXECUTIVE_LABELS.has(normalized.toLowerCase())) {
    return false;
  }
  return /^[A-Z][A-Za-z'-.]+(?:\s+[A-Z][A-Za-z'-.]+){1,3}$/.test(normalized);
}

function parseYearFromCells(cells: string[], filingYear: number, yearIndex: number | null): number | null {
  if (yearIndex !== null && yearIndex < cells.length) {
    const yearMatch = cells[yearIndex].match(/\b(20\d{2}|19\d{2})\b/);
    if (yearMatch) {
      const year = Number.parseInt(yearMatch[1], 10);
      if (year >= filingYear - 15 && year <= filingYear - 1) {
        return year;
      }
    }
  }

  const years = extractYearTokens(cells.join(' '));
  const valid = years.filter((year) => year <= filingYear - 1 && year >= filingYear - 15);
  return valid.length > 0 ? valid[0] : null;
}

function parseMoneyFromCells(cells: string[], totalIndex: number | null): number | null {
  if (totalIndex !== null && totalIndex < cells.length) {
    const exact = parseDollarValue(cells[totalIndex]);
    if (exact !== null && exact > 10_000) {
      return exact;
    }
  }

  const parsed = cells
    .flatMap((cell) => cell.match(/\$?\(?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\)?/g) ?? [])
    .map((value) => parseDollarValue(value))
    .filter((value): value is number => value !== null)
    .filter((value) => value > 10_000)
    .sort((a, b) => b - a);

  return parsed.length > 0 ? parsed[0] : null;
}

function parseCompensationRowsFromTables(args: {
  rawHtml: string;
  filing: FilingCandidate;
}): CompensationRow[] {
  const rows = extractTableRows(args.rawHtml);
  const filingYear = Number.parseInt(args.filing.filingDate.slice(0, 4), 10);
  const out: CompensationRow[] = [];
  let currentTotalColumn: number | null = null;
  let currentYearColumn: number | null = null;

  for (const cells of rows) {
    const lowered = cells.map((cell) => cell.toLowerCase());
    const headerLike = lowered.some((cell) => cell.includes('year'))
      && lowered.some((cell) => cell.includes('total'))
      && lowered.some((cell) => cell.includes('name') || cell.includes('principal position'));
    if (headerLike) {
      currentTotalColumn = lowered.findIndex((cell) => cell.includes('total'));
      currentYearColumn = lowered.findIndex((cell) => cell.includes('year'));
      continue;
    }

    const nameCandidate = normalizeExecutiveName(cells[0] ?? '');
    if (!looksLikeExecutiveName(nameCandidate)) {
      continue;
    }

    const fiscalYear = parseYearFromCells(cells, filingYear, currentYearColumn);
    if (fiscalYear === null) {
      continue;
    }

    const totalCompensationUsd = parseMoneyFromCells(cells, currentTotalColumn);
    if (totalCompensationUsd === null) {
      continue;
    }

    out.push({
      executiveName: nameCandidate,
      title: titleFromLine(cells.join(' ')),
      fiscalYear,
      totalCompensationUsd,
      sourceUrl: args.filing.sourceUrl,
      accession: args.filing.accession,
      filingDate: args.filing.filingDate,
    });
  }

  return uniqueRows(out);
}

export function extractCompensationRowsForTest(args: { rawHtml: string; filingDate: string }): CompensationRow[] {
  const filing: FilingCandidate = {
    accession: 'TEST',
    filingDate: args.filingDate,
    form: 'DEF 14A',
    primaryDocument: 'test.htm',
    sourceUrl: 'https://example.test',
  };
  return parseCompensationRowsFromTables({ rawHtml: args.rawHtml, filing });
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
  const tableRows = parseCompensationRowsFromTables(args);
  if (tableRows.length > 0) {
    return tableRows;
  }

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
