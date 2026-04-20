/**
 * Unit tests for the extended public API route handlers at
 *   /api/v1/compensation
 *   /api/v1/insiders
 *   /api/v1/screener
 *
 * Tests target the pure helpers exported from each route so they run
 * fully offline (no SEC network access required). The GET handlers are
 * thin wrappers around these helpers plus a fetch and a NextResponse.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCompensationResponse,
  normalizeCompensationQuery,
  projectCompensationHistoryPoint,
  projectCompensationRow,
  indexSources,
} from '../app/api/v1/compensation/helpers';
import {
  buildInsidersResponse,
  classifyTransaction,
  normalizeInsidersQuery,
  projectInsiderRow,
} from '../app/api/v1/insiders/helpers';
import {
  SAMPLE_ROWS,
  buildScreenerResponse,
  getScreenerRows,
  normalizeScreenerQuery,
} from '../app/api/v1/screener/helpers';
import { COMPENSATION_API_VERSION } from '../../../packages/schemas/src/api/compensation';
import { INSIDERS_API_VERSION } from '../../../packages/schemas/src/api/insiders';
import type { CompanyCompensationData } from '../lib/api/compensation';
import type {
  CompanyInsidersData,
  InsiderActivityRow as InternalInsiderActivityRow,
} from '../lib/api/insiders';

// ---------------------------------------------------------------------------
// /api/v1/compensation — normalizeCompensationQuery
// ---------------------------------------------------------------------------

test('normalizeCompensationQuery requires companyId', () => {
  assert.throws(
    () => normalizeCompensationQuery(new URLSearchParams()),
    /companyId query parameter is required/,
  );
});

test('normalizeCompensationQuery rejects non-digit companyId', () => {
  assert.throws(
    () => normalizeCompensationQuery(new URLSearchParams({ companyId: 'apple' })),
    /companyId must contain at least one digit/,
  );
});

test('normalizeCompensationQuery passes through digits-only companyId', () => {
  const q = normalizeCompensationQuery(new URLSearchParams({ companyId: '320193' }));
  assert.equal(q.companyId, '320193');
});

test('normalizeCompensationQuery passes through zero-padded companyId', () => {
  const q = normalizeCompensationQuery(new URLSearchParams({ companyId: '0000320193' }));
  assert.equal(q.companyId, '0000320193');
});

// ---------------------------------------------------------------------------
// /api/v1/compensation — buildCompensationResponse
// ---------------------------------------------------------------------------

function sampleCompensationData(): CompanyCompensationData {
  return {
    companyName: 'Apple Inc.',
    cik: '0000320193',
    rows: [
      {
        executiveName: 'Tim Cook',
        title: 'Chief Executive Officer',
        fiscalYear: 2023,
        totalCompensationUsd: 63_209_845,
        sourceUrl: 'https://www.sec.gov/Archives/edgar/data/320193/000032019324000001/aapl-proxy.htm',
        accession: '0000320193-24-000001',
        filingDate: '2024-01-15',
      },
      {
        executiveName: 'Luca Maestri',
        title: 'Chief Financial Officer',
        fiscalYear: 2023,
        totalCompensationUsd: 27_186_533,
        sourceUrl: 'https://www.sec.gov/Archives/edgar/data/320193/000032019324000001/aapl-proxy.htm',
        accession: '0000320193-24-000001',
        filingDate: '2024-01-15',
      },
    ],
    history: [
      {
        executiveName: 'Tim Cook',
        fiscalYear: 2023,
        totalCompensationUsd: 63_209_845,
        latestSourceUrl: 'https://www.sec.gov/Archives/edgar/data/320193/000032019324000001/aapl-proxy.htm',
        latestAccession: '0000320193-24-000001',
      },
    ],
    sources: [
      {
        accession: '0000320193-24-000001',
        filingDate: '2024-01-15',
        form: 'DEF 14A',
        sourceUrl: 'https://www.sec.gov/Archives/edgar/data/320193/000032019324000001/aapl-proxy.htm',
      },
    ],
  };
}

test('indexSources maps accession -> source', () => {
  const data = sampleCompensationData();
  const idx = indexSources(data.sources);
  assert.equal(idx.size, 1);
  assert.equal(idx.get('0000320193-24-000001')?.form, 'DEF 14A');
});

test('projectCompensationRow attaches form from the source index', () => {
  const data = sampleCompensationData();
  const idx = indexSources(data.sources);
  const projected = projectCompensationRow(data.rows[0], idx);
  assert.equal(projected.executiveName, 'Tim Cook');
  assert.equal(projected.form, 'DEF 14A');
  assert.equal(projected.accession, '0000320193-24-000001');
  assert.equal(projected.filingDate, '2024-01-15');
  assert.equal(projected.totalCompensationUsd, 63_209_845);
});

test('projectCompensationHistoryPoint attaches latestFilingDate from sources', () => {
  const data = sampleCompensationData();
  const idx = indexSources(data.sources);
  const projected = projectCompensationHistoryPoint(data.history[0], idx);
  assert.equal(projected.latestFilingDate, '2024-01-15');
  assert.equal(projected.latestAccession, '0000320193-24-000001');
});

test('buildCompensationResponse stamps apiVersion and the exact envelope shape', () => {
  const body = buildCompensationResponse(sampleCompensationData(), '2026-04-20T00:00:00.000Z');
  assert.equal(body.apiVersion, COMPENSATION_API_VERSION);
  assert.equal(body.generatedAt, '2026-04-20T00:00:00.000Z');
  assert.equal(body.companyName, 'Apple Inc.');
  assert.equal(body.cik, '0000320193');
  assert.equal(body.currency, 'USD');
  assert.equal(body.rows.length, 2);
  assert.equal(body.history.length, 1);
  assert.equal(body.sources.length, 1);
  for (const row of body.rows) {
    assert.ok(row.form, 'each row must carry its source form');
    assert.ok(row.sourceUrl.startsWith('https://www.sec.gov/'));
  }
});

test('buildCompensationResponse never exposes internal raw-storage fields', () => {
  const body = buildCompensationResponse(sampleCompensationData(), 'now');
  const json = JSON.stringify(body);
  for (const forbidden of [
    'checksum',
    'sha256',
    'rawArtifactId',
    'raw_artifact_id',
    'parserVersion',
    'parser_version',
    'ingestJobId',
    'ingest_job_id',
    'sourceFetchedAt',
    'compSummaryId',
    'executiveId',
    'compAwardId',
    'recordedAt',
    'normalizerVersion',
  ]) {
    assert.ok(!json.includes(forbidden), `Internal field leaked: ${forbidden}`);
  }
});

// ---------------------------------------------------------------------------
// /api/v1/insiders — normalizeInsidersQuery
// ---------------------------------------------------------------------------

test('normalizeInsidersQuery requires companyId', () => {
  assert.throws(
    () => normalizeInsidersQuery(new URLSearchParams()),
    /companyId query parameter is required/,
  );
});

test('normalizeInsidersQuery rejects non-digit companyId', () => {
  assert.throws(
    () => normalizeInsidersQuery(new URLSearchParams({ companyId: 'apple' })),
    /companyId must contain at least one digit/,
  );
});

test('normalizeInsidersQuery defaults role to "all"', () => {
  const q = normalizeInsidersQuery(new URLSearchParams({ companyId: '320193' }));
  assert.equal(q.role, 'all');
});

test('normalizeInsidersQuery accepts all known role filters', () => {
  for (const role of ['all', 'director', 'officer', 'ten_percent_owner', 'other'] as const) {
    const q = normalizeInsidersQuery(new URLSearchParams({ companyId: '320193', role }));
    assert.equal(q.role, role);
  }
});

test('normalizeInsidersQuery normalizes unknown role to "all"', () => {
  const q = normalizeInsidersQuery(new URLSearchParams({ companyId: '320193', role: 'garbage' }));
  assert.equal(q.role, 'all');
});

// ---------------------------------------------------------------------------
// /api/v1/insiders — classifyTransaction
// ---------------------------------------------------------------------------

test('classifyTransaction returns derivative_event when isDerivative is true', () => {
  assert.equal(
    classifyTransaction({ transactionCode: 'P', acquiredOrDisposed: 'A', isDerivative: true, shares: 100 }),
    'derivative_event',
  );
});

test('classifyTransaction returns holdings_change for pure holdings rows', () => {
  assert.equal(
    classifyTransaction({ transactionCode: null, acquiredOrDisposed: null, isDerivative: false, shares: null }),
    'holdings_change',
  );
});

test('classifyTransaction returns grant for grant-like codes with direction A', () => {
  for (const code of ['A', 'M', 'X', 'G']) {
    assert.equal(
      classifyTransaction({ transactionCode: code, acquiredOrDisposed: 'A', isDerivative: false, shares: 50 }),
      'grant',
      `code ${code} should classify as grant`,
    );
  }
});

test('classifyTransaction returns buy for code P + direction A', () => {
  assert.equal(
    classifyTransaction({ transactionCode: 'P', acquiredOrDisposed: 'A', isDerivative: false, shares: 500 }),
    'buy',
  );
});

test('classifyTransaction returns sell for code S + direction D', () => {
  assert.equal(
    classifyTransaction({ transactionCode: 'S', acquiredOrDisposed: 'D', isDerivative: false, shares: 500 }),
    'sell',
  );
});

test('classifyTransaction returns ambiguous for unexpected code/direction combos', () => {
  assert.equal(
    classifyTransaction({ transactionCode: 'F', acquiredOrDisposed: 'D', isDerivative: false, shares: 100 }),
    'ambiguous',
  );
  assert.equal(
    classifyTransaction({ transactionCode: 'P', acquiredOrDisposed: 'D', isDerivative: false, shares: 100 }),
    'ambiguous',
  );
  assert.equal(
    classifyTransaction({ transactionCode: 'S', acquiredOrDisposed: 'A', isDerivative: false, shares: 100 }),
    'ambiguous',
  );
});

// ---------------------------------------------------------------------------
// /api/v1/insiders — projectInsiderRow / buildInsidersResponse
// ---------------------------------------------------------------------------

function sampleInternalInsiderRow(
  overrides: Partial<InternalInsiderActivityRow> = {},
): InternalInsiderActivityRow {
  return {
    reporterName: 'Tim Cook',
    reporterCik: '0001214156',
    officerTitle: 'CEO',
    roles: { isDirector: false, isOfficer: true, isTenPercentOwner: false, isOther: false },
    securityTitle: 'Common Stock',
    transactionDate: '2024-10-01',
    transactionCode: 'S',
    acquiredOrDisposed: 'D',
    shares: 100_000,
    pricePerShare: 230.5,
    sharesOwnedAfter: 3_000_000,
    isDerivative: false,
    form: '4',
    accession: '0000320193-24-000010',
    filingDate: '2024-10-02',
    primaryDocument: 'form4.xml',
    primaryDocUrl: 'https://www.sec.gov/Archives/edgar/data/320193/000032019324000010/form4.xml',
    filingIndexUrl: 'https://www.sec.gov/Archives/edgar/data/320193/000032019324000010/',
    issuerCik: '0000320193',
    ...overrides,
  };
}

test('projectInsiderRow copies public fields and classifies transaction', () => {
  const projected = projectInsiderRow(sampleInternalInsiderRow());
  assert.equal(projected.reporterName, 'Tim Cook');
  assert.equal(projected.transactionClass, 'sell');
  assert.equal(projected.accession, '0000320193-24-000010');
  assert.equal(projected.primaryDocUrl.startsWith('https://www.sec.gov/'), true);
  assert.equal(projected.roles.isOfficer, true);
});

test('projectInsiderRow marks derivative rows as derivative_event regardless of code', () => {
  const projected = projectInsiderRow(
    sampleInternalInsiderRow({ isDerivative: true, transactionCode: 'P', acquiredOrDisposed: 'A' }),
  );
  assert.equal(projected.transactionClass, 'derivative_event');
});

function sampleInsidersData(): CompanyInsidersData {
  return {
    companyName: 'Apple Inc.',
    cik: '0000320193',
    role: 'all',
    rows: [
      sampleInternalInsiderRow(),
      sampleInternalInsiderRow({
        reporterName: 'Arthur D. Levinson',
        officerTitle: null,
        roles: { isDirector: true, isOfficer: false, isTenPercentOwner: false, isOther: false },
        transactionCode: 'A',
        acquiredOrDisposed: 'A',
        accession: '0000320193-24-000011',
      }),
    ],
    sources: [
      {
        accession: '0000320193-24-000010',
        form: '4',
        filingDate: '2024-10-02',
        primaryDocUrl: 'https://www.sec.gov/Archives/edgar/data/320193/000032019324000010/form4.xml',
        filingIndexUrl: 'https://www.sec.gov/Archives/edgar/data/320193/000032019324000010/',
      },
    ],
  };
}

test('buildInsidersResponse stamps apiVersion and the exact envelope shape', () => {
  const body = buildInsidersResponse(sampleInsidersData(), '2026-04-20T00:00:00.000Z');
  assert.equal(body.apiVersion, INSIDERS_API_VERSION);
  assert.equal(body.generatedAt, '2026-04-20T00:00:00.000Z');
  assert.equal(body.companyName, 'Apple Inc.');
  assert.equal(body.cik, '0000320193');
  assert.equal(body.role, 'all');
  assert.equal(body.rows.length, 2);
  assert.equal(body.rows[0].transactionClass, 'sell');
  assert.equal(body.rows[1].transactionClass, 'grant');
  assert.equal(body.sources.length, 1);
});

test('buildInsidersResponse never exposes internal raw-storage fields', () => {
  const body = buildInsidersResponse(sampleInsidersData(), 'now');
  const json = JSON.stringify(body);
  for (const forbidden of [
    'checksum',
    'sha256',
    'rawArtifactId',
    'raw_artifact_id',
    'parserVersion',
    'parser_version',
    'ingestJobId',
    'ingest_job_id',
    'sourceFetchedAt',
    'normalizerVersion',
    'insiderId',
    'rawXml',
  ]) {
    assert.ok(!json.includes(forbidden), `Internal field leaked: ${forbidden}`);
  }
});

// ---------------------------------------------------------------------------
// /api/v1/screener — normalizeScreenerQuery
// ---------------------------------------------------------------------------

test('normalizeScreenerQuery returns {} for empty search params', () => {
  const filters = normalizeScreenerQuery(new URLSearchParams());
  assert.deepEqual(filters, {});
});

test('normalizeScreenerQuery parses minMarketCap into size.marketCap.min', () => {
  const filters = normalizeScreenerQuery(new URLSearchParams({ minMarketCap: '2000000000000' }));
  assert.deepEqual(filters.size?.marketCap, { min: 2_000_000_000_000 });
});

test('normalizeScreenerQuery parses matching min/max pair per metric', () => {
  const filters = normalizeScreenerQuery(
    new URLSearchParams({ minGrossMargin: '0.3', maxGrossMargin: '0.8' }),
  );
  assert.deepEqual(filters.margin?.grossMargin, { min: 0.3, max: 0.8 });
});

test('normalizeScreenerQuery spans all five categories', () => {
  const filters = normalizeScreenerQuery(
    new URLSearchParams({
      minMarketCap: '1500000000000',
      minRevenueGrowth: '0.10',
      minGrossMargin: '0.50',
      maxLiabilitiesToEquity: '1.0',
      minCurrentRatio: '1.5',
    }),
  );
  assert.deepEqual(filters.size?.marketCap, { min: 1_500_000_000_000 });
  assert.deepEqual(filters.growth?.revenueGrowth, { min: 0.1 });
  assert.deepEqual(filters.margin?.grossMargin, { min: 0.5 });
  assert.deepEqual(filters.leverage?.liabilitiesToEquity, { max: 1.0 });
  assert.deepEqual(filters.liquidity?.currentRatio, { min: 1.5 });
});

test('normalizeScreenerQuery rejects non-numeric bounds', () => {
  assert.throws(
    () => normalizeScreenerQuery(new URLSearchParams({ minMarketCap: 'big' })),
    /minMarketCap must be a finite number/,
  );
  assert.throws(
    () => normalizeScreenerQuery(new URLSearchParams({ maxQuickRatio: 'NaN' })),
    /maxQuickRatio must be a finite number/,
  );
});

test('normalizeScreenerQuery ignores empty-string params', () => {
  const filters = normalizeScreenerQuery(new URLSearchParams({ minMarketCap: '', maxMarketCap: '' }));
  assert.deepEqual(filters, {});
});

// ---------------------------------------------------------------------------
// /api/v1/screener — buildScreenerResponse
// ---------------------------------------------------------------------------

test('buildScreenerResponse returns all sample rows when no filters applied', () => {
  const result = buildScreenerResponse(getScreenerRows(), {});
  assert.equal(result.totalMatched, SAMPLE_ROWS.length);
  assert.equal(result.rows.length, SAMPLE_ROWS.length);
  assert.deepEqual(result.filtersApplied, {});
});

test('buildScreenerResponse narrows results when combined filters apply', () => {
  const filters = normalizeScreenerQuery(
    new URLSearchParams({
      minMarketCap: '1500000000000',
      minGrossMargin: '0.50',
      maxLiabilitiesToEquity: '1.0',
    }),
  );
  const result = buildScreenerResponse(getScreenerRows(), filters);
  assert.ok(result.totalMatched < SAMPLE_ROWS.length);
  for (const row of result.rows) {
    assert.ok(row.marketCap !== null && row.marketCap >= 1_500_000_000_000);
    assert.ok(row.grossMargin !== null && row.grossMargin >= 0.5);
    assert.ok(row.liabilitiesToEquity !== null && row.liabilitiesToEquity <= 1.0);
  }
});

test('buildScreenerResponse propagates min>max as a descriptive error', () => {
  assert.throws(
    () =>
      buildScreenerResponse(getScreenerRows(), {
        size: { marketCap: { min: 1000, max: 500 } },
      }),
    /Invalid range.*min.*exceeds.*max/,
  );
});

test('buildScreenerResponse returns exactly the ScreenerResult contract', () => {
  const result = buildScreenerResponse(getScreenerRows(), {});
  // The v1 screener contract is strictly {filtersApplied, rows, totalMatched}.
  // Any other top-level key would broaden the read model.
  assert.deepEqual(new Set(Object.keys(result)), new Set(['filtersApplied', 'rows', 'totalMatched']));
});

test('buildScreenerResponse never exposes internal raw-storage fields', () => {
  const result = buildScreenerResponse(getScreenerRows(), {});
  const json = JSON.stringify(result);
  for (const forbidden of [
    'checksum',
    'sha256',
    'rawArtifactId',
    'raw_artifact_id',
    'parserVersion',
    'parser_version',
    'ingestJobId',
    'ingest_job_id',
    'sourceFetchedAt',
  ]) {
    assert.ok(!json.includes(forbidden), `Internal field leaked: ${forbidden}`);
  }
});
