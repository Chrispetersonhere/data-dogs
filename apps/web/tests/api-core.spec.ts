/**
 * Unit tests for the core public API route handlers at
 *   /api/v1/companies
 *   /api/v1/filings
 *   /api/v1/financials
 *
 * Tests target the pure helpers exported from each route so they run
 * fully offline (no SEC network access required). The GET handlers are
 * thin wrappers around these helpers plus a fetch and a NextResponse.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCompaniesResponse,
  clampPageSize,
  normalizeCompaniesQuery,
  parsePositiveInt,
} from '../app/api/v1/companies/helpers';
import {
  buildFilingIndexUrl,
  buildFilingsFiltersApplied,
  buildFilingsResponse,
  buildPrimaryDocUrl,
  normalizeFilingsQuery,
  projectFilingRecord,
} from '../app/api/v1/filings/helpers';
import {
  buildCompanyFactsUrl,
  buildFinancialsResponse,
  buildStatements,
  collectMetricValues,
  normalizeFinancialsQuery,
  padCik,
  restrictStatementsToYears,
  selectYears,
  summarizeConsistency,
  type CompanyFactsResponse,
} from '../app/api/v1/financials/helpers';
import { COMPANIES_API_VERSION } from '../../../packages/schemas/src/api/companies';
import { FILINGS_API_VERSION } from '../../../packages/schemas/src/api/filings';
import { FINANCIALS_API_VERSION } from '../../../packages/schemas/src/api/financials';
import type { CompanyOverviewData } from '../lib/api/company';
import type { FilingRecord as InternalFilingRecord } from '../lib/api/filings';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

test('parsePositiveInt returns the fallback when the param is null', () => {
  assert.equal(parsePositiveInt(null, 7, 'page'), 7);
});

test('parsePositiveInt returns the fallback for empty string', () => {
  assert.equal(parsePositiveInt('', 3, 'pageSize'), 3);
});

test('parsePositiveInt rejects zero and negative values', () => {
  assert.throws(() => parsePositiveInt('0', 1, 'page'), /page must be a positive integer/);
  assert.throws(() => parsePositiveInt('-5', 1, 'page'), /page must be a positive integer/);
});

test('parsePositiveInt rejects non-integer strings', () => {
  assert.throws(() => parsePositiveInt('2.5', 1, 'page'), /page must be a positive integer/);
  assert.throws(() => parsePositiveInt('abc', 1, 'page'), /page must be a positive integer/);
  assert.throws(() => parsePositiveInt('12x', 1, 'page'), /page must be a positive integer/);
});

test('clampPageSize clamps to the requested max', () => {
  assert.equal(clampPageSize(50, 100), 50);
  assert.equal(clampPageSize(500, 100), 100);
});

test('clampPageSize rejects non-positive sizes', () => {
  assert.throws(() => clampPageSize(0, 100), /pageSize must be >= 1/);
});

// ---------------------------------------------------------------------------
// /api/v1/companies — normalizeCompaniesQuery
// ---------------------------------------------------------------------------

test('normalizeCompaniesQuery requires companyId', () => {
  assert.throws(
    () => normalizeCompaniesQuery(new URLSearchParams()),
    /companyId query parameter is required/,
  );
});

test('normalizeCompaniesQuery rejects non-digit companyId', () => {
  assert.throws(
    () => normalizeCompaniesQuery(new URLSearchParams({ companyId: 'apple' })),
    /companyId must contain at least one digit/,
  );
});

test('normalizeCompaniesQuery defaults page=1, pageSize=25 and clamps at 100', () => {
  const q = normalizeCompaniesQuery(new URLSearchParams({ companyId: '320193' }));
  assert.equal(q.page, 1);
  assert.equal(q.pageSize, 25);

  const clamped = normalizeCompaniesQuery(
    new URLSearchParams({ companyId: '320193', pageSize: '999' }),
  );
  assert.equal(clamped.pageSize, 100);
});

test('normalizeCompaniesQuery propagates explicit page/pageSize', () => {
  const q = normalizeCompaniesQuery(
    new URLSearchParams({ companyId: '320193', page: '3', pageSize: '10' }),
  );
  assert.equal(q.page, 3);
  assert.equal(q.pageSize, 10);
  assert.equal(q.companyId, '320193');
});

// ---------------------------------------------------------------------------
// /api/v1/companies — buildCompaniesResponse
// ---------------------------------------------------------------------------

function sampleCompanyOverview(): CompanyOverviewData {
  return {
    issuerMetadata: {
      cik: '0000320193',
      companyId: '320193',
      name: 'Apple Inc.',
      ticker: 'AAPL',
      exchange: 'Nasdaq',
      sic: '3571',
      sicDescription: 'Electronic Computers',
      stateOfIncorporation: 'CA',
      fiscalYearEnd: '0930',
    },
    identityHistorySummary: [
      { name: 'Apple Computer, Inc.', from: '1977-01-01', to: '2007-01-08' },
    ],
    filingCountSummary: {
      recentFilings: 5,
      uniqueForms: 3,
      annualFilings: 1,
      quarterlyFilings: 2,
      currentReportFilings: 2,
    },
    latestFilingsSummary: [
      { accessionNumber: '0000320193-24-000001', filingDate: '2024-02-01', form: '10-K', primaryDocument: 'a.htm', primaryDocDescription: 'Annual' },
      { accessionNumber: '0000320193-24-000002', filingDate: '2024-05-01', form: '10-Q', primaryDocument: 'b.htm', primaryDocDescription: 'Quarterly' },
      { accessionNumber: '0000320193-24-000003', filingDate: '2024-08-01', form: '10-Q', primaryDocument: 'c.htm', primaryDocDescription: 'Quarterly' },
      { accessionNumber: '0000320193-24-000004', filingDate: '2024-09-15', form: '8-K', primaryDocument: 'd.htm', primaryDocDescription: 'Current' },
      { accessionNumber: '0000320193-24-000005', filingDate: '2024-10-01', form: '8-K', primaryDocument: 'e.htm', primaryDocDescription: 'Current' },
    ],
  };
}

test('buildCompaniesResponse stamps apiVersion and exact envelope shape', () => {
  const overview = sampleCompanyOverview();
  const body = buildCompaniesResponse(
    overview,
    { companyId: '320193', page: 1, pageSize: 25 },
    '2026-04-20T00:00:00.000Z',
  );

  assert.equal(body.apiVersion, COMPANIES_API_VERSION);
  assert.equal(body.generatedAt, '2026-04-20T00:00:00.000Z');
  assert.equal(body.profile.cik, '0000320193');
  assert.equal(body.profile.companyId, '320193');
  assert.equal(body.profile.name, 'Apple Inc.');
  assert.equal(body.profile.ticker, 'AAPL');
  assert.equal(body.identityHistory.length, 1);
  assert.equal(body.filingFootprint.recentFilings, 5);
  assert.equal(body.recentFilings.length, 5);
  assert.equal(body.recentFilings[0].accession, '0000320193-24-000001');
  assert.equal(body.recentFilings[0].form, '10-K');
});

test('buildCompaniesResponse paginates recentFilings via page/pageSize', () => {
  const overview = sampleCompanyOverview();

  const page1 = buildCompaniesResponse(
    overview,
    { companyId: '320193', page: 1, pageSize: 2 },
    'now',
  );
  assert.equal(page1.recentFilings.length, 2);
  assert.deepEqual(
    page1.recentFilings.map((f) => f.accession),
    ['0000320193-24-000001', '0000320193-24-000002'],
  );

  const page2 = buildCompaniesResponse(
    overview,
    { companyId: '320193', page: 2, pageSize: 2 },
    'now',
  );
  assert.equal(page2.recentFilings.length, 2);
  assert.deepEqual(
    page2.recentFilings.map((f) => f.accession),
    ['0000320193-24-000003', '0000320193-24-000004'],
  );

  const page3 = buildCompaniesResponse(
    overview,
    { companyId: '320193', page: 3, pageSize: 2 },
    'now',
  );
  assert.equal(page3.recentFilings.length, 1);
  assert.equal(page3.recentFilings[0].accession, '0000320193-24-000005');

  const beyond = buildCompaniesResponse(
    overview,
    { companyId: '320193', page: 10, pageSize: 2 },
    'now',
  );
  assert.equal(beyond.recentFilings.length, 0);
});

test('buildCompaniesResponse never exposes internal raw-storage provenance fields', () => {
  const overview = sampleCompanyOverview();
  const body = buildCompaniesResponse(
    overview,
    { companyId: '320193', page: 1, pageSize: 25 },
    'now',
  );
  const json = JSON.stringify(body);
  for (const forbidden of [
    'checksum',
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

// ---------------------------------------------------------------------------
// /api/v1/filings — normalizeFilingsQuery
// ---------------------------------------------------------------------------

test('normalizeFilingsQuery requires issuer', () => {
  assert.throws(
    () => normalizeFilingsQuery(new URLSearchParams()),
    /issuer query parameter is required/,
  );
});

test('normalizeFilingsQuery pads CIK, parses form types and dates', () => {
  const q = normalizeFilingsQuery(
    new URLSearchParams({
      issuer: '320193',
      formType: '10-k, 8-k',
      dateFrom: '2024-01-01',
      dateTo: '2024-12-31',
      accession: '0000320193-24-000001',
    }),
  );
  assert.equal(q.filters.issuerCik, '0000320193');
  assert.deepEqual([...q.filters.formTypes].sort(), ['10-K', '8-K']);
  assert.equal(q.filters.dateFrom, '2024-01-01');
  assert.equal(q.filters.dateTo, '2024-12-31');
  assert.equal(q.filters.accession, '0000320193-24-000001');
});

test('normalizeFilingsQuery defaults page=1, pageSize=50 and clamps at 200', () => {
  const q = normalizeFilingsQuery(new URLSearchParams({ issuer: '320193' }));
  assert.equal(q.page, 1);
  assert.equal(q.pageSize, 50);

  const clamped = normalizeFilingsQuery(
    new URLSearchParams({ issuer: '320193', pageSize: '5000' }),
  );
  assert.equal(clamped.pageSize, 200);
});

test('normalizeFilingsQuery rejects invalid date ranges', () => {
  assert.throws(
    () => normalizeFilingsQuery(new URLSearchParams({ issuer: '320193', dateFrom: '2024/01/01' })),
    /dateFrom must be YYYY-MM-DD/,
  );
  assert.throws(
    () =>
      normalizeFilingsQuery(
        new URLSearchParams({ issuer: '320193', dateFrom: '2024-06-01', dateTo: '2024-01-01' }),
      ),
    /dateFrom must be <= dateTo/,
  );
});

// ---------------------------------------------------------------------------
// /api/v1/filings — URL builders
// ---------------------------------------------------------------------------

test('buildPrimaryDocUrl constructs canonical SEC archive URL', () => {
  assert.equal(
    buildPrimaryDocUrl('0000320193', '0000320193-24-000001', 'aapl-10k.htm'),
    'https://www.sec.gov/Archives/edgar/data/320193/000032019324000001/aapl-10k.htm',
  );
});

test('buildPrimaryDocUrl tolerates empty primaryDocument (returns index dir)', () => {
  assert.equal(
    buildPrimaryDocUrl('0000320193', '0000320193-24-000001', ''),
    'https://www.sec.gov/Archives/edgar/data/320193/000032019324000001/',
  );
});

test('buildFilingIndexUrl constructs canonical SEC filing-index URL', () => {
  assert.equal(
    buildFilingIndexUrl('0000320193', '0000320193-24-000001'),
    'https://www.sec.gov/Archives/edgar/data/320193/000032019324000001/0000320193-24-000001-index.htm',
  );
});

// ---------------------------------------------------------------------------
// /api/v1/filings — projectFilingRecord & buildFilingsResponse
// ---------------------------------------------------------------------------

function sampleInternalFilingRows(): InternalFilingRecord[] {
  return [
    {
      issuerCik: '0000320193',
      accession: '0000320193-24-000001',
      filingDate: '2024-02-01',
      formType: '10-K',
      primaryDocument: 'a.htm',
      primaryDocDescription: 'Annual',
    },
    {
      issuerCik: '0000320193',
      accession: '0000320193-24-000002',
      filingDate: '2024-05-01',
      formType: '10-Q',
      primaryDocument: 'b.htm',
      primaryDocDescription: 'Quarterly',
    },
    {
      issuerCik: '0000320193',
      accession: '0000320193-24-000003',
      filingDate: '2024-08-01',
      formType: '10-Q',
      primaryDocument: 'c.htm',
      primaryDocDescription: 'Quarterly',
    },
  ];
}

test('projectFilingRecord adds canonical SEC URLs without leaking internal fields', () => {
  const projected = projectFilingRecord(sampleInternalFilingRows()[0]);
  assert.equal(projected.accession, '0000320193-24-000001');
  assert.equal(projected.formType, '10-K');
  assert.equal(
    projected.primaryDocUrl,
    'https://www.sec.gov/Archives/edgar/data/320193/000032019324000001/a.htm',
  );
  assert.equal(
    projected.filingIndexUrl,
    'https://www.sec.gov/Archives/edgar/data/320193/000032019324000001/0000320193-24-000001-index.htm',
  );
});

test('buildFilingsFiltersApplied echoes normalized filters in sorted form', () => {
  const q = normalizeFilingsQuery(
    new URLSearchParams({ issuer: '320193', formType: '8-k,10-k' }),
  );
  const echo = buildFilingsFiltersApplied(q.filters);
  assert.equal(echo.issuerCik, '0000320193');
  assert.deepEqual(echo.formTypes, ['10-K', '8-K']);
  assert.equal(echo.dateFrom, null);
  assert.equal(echo.dateTo, null);
  assert.equal(echo.accession, null);
});

test('buildFilingsResponse envelope is stable and paginates', () => {
  const rows = sampleInternalFilingRows();
  const q = normalizeFilingsQuery(new URLSearchParams({ issuer: '320193', pageSize: '2', page: '1' }));
  const body = buildFilingsResponse(rows, q, '2026-04-20T00:00:00.000Z');
  assert.equal(body.apiVersion, FILINGS_API_VERSION);
  assert.equal(body.generatedAt, '2026-04-20T00:00:00.000Z');
  assert.equal(body.filtersApplied.issuerCik, '0000320193');
  assert.equal(body.filings.length, 2);
  assert.equal(body.filings[0].accession, '0000320193-24-000001');
  assert.equal(body.filings[1].accession, '0000320193-24-000002');

  const q2 = normalizeFilingsQuery(new URLSearchParams({ issuer: '320193', pageSize: '2', page: '2' }));
  const body2 = buildFilingsResponse(rows, q2, 'now');
  assert.equal(body2.filings.length, 1);
  assert.equal(body2.filings[0].accession, '0000320193-24-000003');
});

test('buildFilingsResponse never exposes internal raw-storage provenance fields', () => {
  const rows = sampleInternalFilingRows();
  const q = normalizeFilingsQuery(new URLSearchParams({ issuer: '320193' }));
  const body = buildFilingsResponse(rows, q, 'now');
  const json = JSON.stringify(body);
  for (const forbidden of [
    'checksum',
    'rawArtifactId',
    'raw_artifact_id',
    'parserVersion',
    'parser_version',
    'ingestJobId',
    'ingest_job_id',
    'sourceFetchedAt',
    'sha256',
  ]) {
    assert.ok(!json.includes(forbidden), `Internal field leaked: ${forbidden}`);
  }
});

// ---------------------------------------------------------------------------
// /api/v1/financials — normalizeFinancialsQuery / padCik / URL
// ---------------------------------------------------------------------------

test('normalizeFinancialsQuery requires companyId', () => {
  assert.throws(
    () => normalizeFinancialsQuery(new URLSearchParams()),
    /companyId query parameter is required/,
  );
});

test('normalizeFinancialsQuery rejects non-digit companyId', () => {
  assert.throws(
    () => normalizeFinancialsQuery(new URLSearchParams({ companyId: 'apple' })),
    /companyId must contain at least one digit/,
  );
});

test('normalizeFinancialsQuery defaults years=4 and caps at 8', () => {
  const q = normalizeFinancialsQuery(new URLSearchParams({ companyId: '320193' }));
  assert.equal(q.years, 4);
  assert.throws(
    () => normalizeFinancialsQuery(new URLSearchParams({ companyId: '320193', years: '100' })),
    /years must be <= 8/,
  );
});

test('padCik pads digits-only companyIds to 10 characters', () => {
  assert.equal(padCik('320193'), '0000320193');
  assert.equal(padCik('0000320193'), '0000320193');
});

test('padCik rejects no-digit input', () => {
  assert.throws(() => padCik('abc'), /companyId must contain at least one digit/);
});

test('buildCompanyFactsUrl points at the public SEC companyfacts endpoint', () => {
  assert.equal(
    buildCompanyFactsUrl('0000320193'),
    'https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json',
  );
});

// ---------------------------------------------------------------------------
// /api/v1/financials — buildStatements / collectMetricValues / buildFinancialsResponse
// ---------------------------------------------------------------------------

function sampleUsGaapFacts() {
  return {
    Revenues: {
      units: {
        USD: [
          { end: '2023-12-31', fy: 2023, fp: 'FY', form: '10-K', filed: '2024-02-01', val: 100 },
          { end: '2022-12-31', fy: 2022, fp: 'FY', form: '10-K', filed: '2023-02-01', val: 80 },
        ],
      },
    },
    Assets: {
      units: {
        USD: [
          { end: '2023-12-31', fy: 2023, fp: 'FY', form: '10-K', filed: '2024-02-01', val: 1000 },
          { end: '2022-12-31', fy: 2022, fp: 'FY', form: '10-K', filed: '2023-02-01', val: 900 },
        ],
      },
    },
    Liabilities: {
      units: {
        USD: [
          { end: '2023-12-31', fy: 2023, fp: 'FY', form: '10-K', filed: '2024-02-01', val: 600 },
          { end: '2022-12-31', fy: 2022, fp: 'FY', form: '10-K', filed: '2023-02-01', val: 540 },
        ],
      },
    },
    StockholdersEquity: {
      units: {
        USD: [
          { end: '2023-12-31', fy: 2023, fp: 'FY', form: '10-K', filed: '2024-02-01', val: 400 },
          { end: '2022-12-31', fy: 2022, fp: 'FY', form: '10-K', filed: '2023-02-01', val: 360 },
        ],
      },
    },
  };
}

test('collectMetricValues picks the first present concept in the fallback list', () => {
  const usGaap = sampleUsGaapFacts();
  const values = collectMetricValues(usGaap, {
    label: 'Revenue',
    concepts: ['SalesRevenueNet', 'Revenues'],
    units: ['USD'],
  });
  assert.equal(values[2023], 100);
  assert.equal(values[2022], 80);
});

test('collectMetricValues returns an empty map when no concept matches', () => {
  const usGaap = sampleUsGaapFacts();
  const values = collectMetricValues(usGaap, {
    label: 'Revenue',
    concepts: ['DoesNotExist'],
    units: ['USD'],
  });
  assert.deepEqual(values, {});
});

test('collectMetricValues ignores non-annual forms and non-FY periods', () => {
  const usGaap = {
    Revenues: {
      units: {
        USD: [
          { end: '2023-12-31', fy: 2023, fp: 'FY', form: '10-K', filed: '2024-02-01', val: 100 },
          { end: '2023-03-31', fy: 2023, fp: 'Q1', form: '10-Q', filed: '2023-05-01', val: 25 },
          { end: '2024-06-30', fy: 2024, fp: 'Q2', form: '8-K', filed: '2024-08-01', val: 999 },
        ],
      },
    },
  };
  const values = collectMetricValues(usGaap, {
    label: 'Revenue',
    concepts: ['Revenues'],
    units: ['USD'],
  });
  assert.deepEqual(values, { 2023: 100 });
});

test('selectYears returns descending most-recent years, capped at the requested max', () => {
  const years = selectYears(
    [
      {
        rows: [
          { label: 'a', valuesByYear: { 2020: 1, 2021: 2, 2022: 3 } },
          { label: 'b', valuesByYear: { 2023: 4, 2019: 5 } },
        ],
      },
    ],
    3,
  );
  assert.deepEqual(years, [2023, 2022, 2021]);
});

test('restrictStatementsToYears drops years outside the envelope', () => {
  const statements = restrictStatementsToYears(
    [
      {
        id: 'income',
        title: 'Income statement',
        rows: [{ label: 'Revenue', valuesByYear: { 2021: 10, 2022: 20, 2023: 30 } }],
      },
    ],
    [2023, 2022],
  );
  assert.deepEqual(statements[0].rows[0].valuesByYear, { 2022: 20, 2023: 30 });
});

test('summarizeConsistency returns ok when assets ~= liabilities + equity', () => {
  const statements = buildStatements(sampleUsGaapFacts());
  const years = selectYears(statements, 4);
  const consistency = summarizeConsistency(statements, years);
  assert.equal(consistency.status, 'ok');
});

test('summarizeConsistency flags mismatch when assets != liabilities + equity', () => {
  const broken = {
    ...sampleUsGaapFacts(),
    Assets: {
      units: {
        USD: [
          { end: '2023-12-31', fy: 2023, fp: 'FY', form: '10-K', filed: '2024-02-01', val: 2000 },
          { end: '2022-12-31', fy: 2022, fp: 'FY', form: '10-K', filed: '2023-02-01', val: 1800 },
        ],
      },
    },
  };
  const statements = buildStatements(broken);
  const years = selectYears(statements, 4);
  const consistency = summarizeConsistency(statements, years);
  assert.equal(consistency.status, 'mismatch');
});

test('buildFinancialsResponse builds a stable envelope with provenance', () => {
  const payload: CompanyFactsResponse = {
    cik: '320193',
    entityName: 'Apple Inc.',
    facts: { 'us-gaap': sampleUsGaapFacts() },
  };
  const body = buildFinancialsResponse({
    payload,
    cikPadded: '0000320193',
    sourceUrl: 'https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json',
    fetchedAt: '2026-04-20T00:00:00.000Z',
    generatedAt: '2026-04-20T00:00:01.000Z',
    maxYears: 4,
  });

  assert.equal(body.apiVersion, FINANCIALS_API_VERSION);
  assert.equal(body.generatedAt, '2026-04-20T00:00:01.000Z');
  assert.equal(body.companyName, 'Apple Inc.');
  assert.equal(body.cik, '320193');
  assert.equal(body.currency, 'USD');
  assert.equal(body.units, 'currency');
  assert.deepEqual(body.years, [2023, 2022]);
  assert.equal(body.statements.length, 3);
  assert.equal(body.statements[0].id, 'income');
  assert.equal(body.statements[1].id, 'balance');
  assert.equal(body.statements[2].id, 'cashflow');
  assert.equal(body.consistency.status, 'ok');
  assert.equal(
    body.provenance.sourceUrl,
    'https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json',
  );
  assert.equal(body.provenance.fetchedAt, '2026-04-20T00:00:00.000Z');
});

test('buildFinancialsResponse throws when us-gaap facts are missing', () => {
  const payload: CompanyFactsResponse = { cik: '320193', entityName: 'Apple', facts: {} };
  assert.throws(
    () =>
      buildFinancialsResponse({
        payload,
        cikPadded: '0000320193',
        sourceUrl: 'https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json',
        fetchedAt: 'now',
        generatedAt: 'now',
        maxYears: 4,
      }),
    /No us-gaap facts found/,
  );
});

test('buildFinancialsResponse throws when no annual facts are available', () => {
  const payload: CompanyFactsResponse = {
    cik: '320193',
    entityName: 'Apple',
    facts: { 'us-gaap': {} },
  };
  assert.throws(
    () =>
      buildFinancialsResponse({
        payload,
        cikPadded: '0000320193',
        sourceUrl: 'https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json',
        fetchedAt: 'now',
        generatedAt: 'now',
        maxYears: 4,
      }),
    /No annual facts were available/,
  );
});

test('buildFinancialsResponse never exposes raw XBRL concept keys or internal provenance', () => {
  const payload: CompanyFactsResponse = {
    cik: '320193',
    entityName: 'Apple Inc.',
    facts: { 'us-gaap': sampleUsGaapFacts() },
  };
  const body = buildFinancialsResponse({
    payload,
    cikPadded: '0000320193',
    sourceUrl: 'https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json',
    fetchedAt: 'now',
    generatedAt: 'now',
    maxYears: 4,
  });
  const json = JSON.stringify(body);
  for (const forbidden of [
    'us-gaap',
    'Revenues',
    'StockholdersEquity',
    'checksum',
    'parserVersion',
    'ingestJobId',
    'conceptUsed',
  ]) {
    assert.ok(!json.includes(forbidden), `Internal field leaked: ${forbidden}`);
  }
});
