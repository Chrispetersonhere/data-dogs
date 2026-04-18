export type RawProxyCompRow = {
  rowId: string;
  executiveName: string;
  role: string;
  salaryUsd: number;
  bonusUsd: number;
  equityUsd: number;
  totalUsd: number;
  sourceUrl: string;
  accession: string;
  fetchTimestamp: string;
  checksum: string;
  parserVersion: string;
  jobId: string;
};

export type ParsedCompRow = {
  rowId: string;
  executiveName: string;
  fiscalYear: number;
  salaryUsd: number;
  bonusUsd: number;
  equityUsd: number;
  totalUsd: number;
  traceSourceRowId: string;
};

export type CompDiscrepancy = {
  rowId: string;
  executiveName: string;
  issue: 'total_mismatch' | 'missing_trace' | 'component_mismatch';
  details: string;
};

export type CompQaView = {
  issuerCik: string;
  rawProxyRows: RawProxyCompRow[];
  parsedRows: ParsedCompRow[];
  discrepancies: CompDiscrepancy[];
};

function normalizeCik(cikInput: string): string {
  const digits = cikInput.replace(/\D/g, '');
  if (!digits) {
    throw new Error('cik is required');
  }

  return digits.padStart(10, '0');
}

function sampleCompQaRows(cik: string): { rawProxyRows: RawProxyCompRow[]; parsedRows: ParsedCompRow[] } {
  const rawProxyRows: RawProxyCompRow[] = [
    {
      rowId: `${cik}-1`,
      executiveName: 'Jane Doe',
      role: 'Chief Executive Officer',
      salaryUsd: 1200000,
      bonusUsd: 400000,
      equityUsd: 3400000,
      totalUsd: 5000000,
      sourceUrl: `https://www.sec.gov/Archives/edgar/data/${cik}/proxy-example.htm`,
      accession: '0000000000-26-000001',
      fetchTimestamp: '2026-04-18T00:00:00Z',
      checksum: 'sha256:1111111111111111111111111111111111111111111111111111111111111111',
      parserVersion: 'proxy-comp-parser@1.0.0',
      jobId: 'job-comp-qa-001',
    },
    {
      rowId: `${cik}-2`,
      executiveName: 'John Smith',
      role: 'Chief Financial Officer',
      salaryUsd: 800000,
      bonusUsd: 220000,
      equityUsd: 1900000,
      totalUsd: 2920000,
      sourceUrl: `https://www.sec.gov/Archives/edgar/data/${cik}/proxy-example.htm`,
      accession: '0000000000-26-000001',
      fetchTimestamp: '2026-04-18T00:00:00Z',
      checksum: 'sha256:1111111111111111111111111111111111111111111111111111111111111111',
      parserVersion: 'proxy-comp-parser@1.0.0',
      jobId: 'job-comp-qa-001',
    },
  ];

  const parsedRows: ParsedCompRow[] = [
    {
      rowId: `${cik}-1`,
      executiveName: 'Jane Doe',
      fiscalYear: 2025,
      salaryUsd: 1200000,
      bonusUsd: 400000,
      equityUsd: 3300000,
      totalUsd: 4900000,
      traceSourceRowId: `${cik}-1`,
    },
    {
      rowId: `${cik}-2`,
      executiveName: 'John Smith',
      fiscalYear: 2025,
      salaryUsd: 800000,
      bonusUsd: 220000,
      equityUsd: 1900000,
      totalUsd: 2920000,
      traceSourceRowId: `${cik}-2`,
    },
  ];

  return { rawProxyRows, parsedRows };
}

export async function getCompQaView(cikInput: string): Promise<CompQaView> {
  const issuerCik = normalizeCik(cikInput);
  const { rawProxyRows, parsedRows } = sampleCompQaRows(issuerCik);

  const rawById = new Map(rawProxyRows.map((row) => [row.rowId, row]));
  const discrepancies: CompDiscrepancy[] = [];

  for (const parsedRow of parsedRows) {
    const rawRow = rawById.get(parsedRow.traceSourceRowId);

    if (!rawRow) {
      discrepancies.push({
        rowId: parsedRow.rowId,
        executiveName: parsedRow.executiveName,
        issue: 'missing_trace',
        details: `Parsed row has no matching raw trace id (${parsedRow.traceSourceRowId}).`,
      });
      continue;
    }

    const rawCalculated = rawRow.salaryUsd + rawRow.bonusUsd + rawRow.equityUsd;
    const parsedCalculated = parsedRow.salaryUsd + parsedRow.bonusUsd + parsedRow.equityUsd;

    if (rawCalculated !== rawRow.totalUsd || parsedCalculated !== parsedRow.totalUsd) {
      discrepancies.push({
        rowId: parsedRow.rowId,
        executiveName: parsedRow.executiveName,
        issue: 'component_mismatch',
        details: 'At least one side has totals that do not equal sum of components.',
      });
    }

    if (rawRow.totalUsd !== parsedRow.totalUsd) {
      discrepancies.push({
        rowId: parsedRow.rowId,
        executiveName: parsedRow.executiveName,
        issue: 'total_mismatch',
        details: `Raw total ${rawRow.totalUsd} does not match parsed total ${parsedRow.totalUsd}.`,
      });
    }
  }

  return {
    issuerCik,
    rawProxyRows,
    parsedRows,
    discrepancies,
  };
}
