import assert from 'node:assert/strict';
import test from 'node:test';

import {
  type FilingRecord,
  filterFilingsRows,
  normalizeFilingQueryFilters,
} from '../lib/api/filings';

const SAMPLE_ROWS: FilingRecord[] = [
  {
    issuerCik: '0000320193',
    accession: '0000320193-24-000123',
    filingDate: '2025-02-01',
    formType: '10-K',
    primaryDocument: 'a10k.htm',
    primaryDocDescription: 'Annual report',
  },
  {
    issuerCik: '0000320193',
    accession: '0000320193-24-000130',
    filingDate: '2025-03-15',
    formType: '8-K',
    primaryDocument: 'a8k.htm',
    primaryDocDescription: 'Current report',
  },
  {
    issuerCik: '0000789019',
    accession: '0000789019-24-000045',
    filingDate: '2025-02-10',
    formType: '10-K',
    primaryDocument: 'msft10k.htm',
    primaryDocDescription: 'Annual report',
  },
];

test('normalizeFilingQueryFilters normalizes issuer and filter contracts', () => {
  const normalized = normalizeFilingQueryFilters({
    issuer: '320193',
    formType: '10-k, 8-k',
    dateFrom: '2025-01-01',
    dateTo: '2025-12-31',
    accession: '0000320193-24-000123',
  });

  assert.equal(normalized.issuerCik, '0000320193');
  assert.deepEqual([...normalized.formTypes].sort(), ['10-K', '8-K']);
  assert.equal(normalized.dateFrom, '2025-01-01');
  assert.equal(normalized.dateTo, '2025-12-31');
  assert.equal(normalized.accession, '0000320193-24-000123');
});

test('filterFilingsRows applies issuer, form, date-range and accession filters together', () => {
  const normalized = normalizeFilingQueryFilters({
    issuer: '0000320193',
    formType: ['10-k'],
    dateFrom: '2025-01-01',
    dateTo: '2025-02-28',
    accession: '0000320193-24-000123',
  });

  const rows = filterFilingsRows(SAMPLE_ROWS, normalized);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].accession, '0000320193-24-000123');
  assert.equal(rows[0].formType, '10-K');
});

test('normalizeFilingQueryFilters rejects invalid date contracts', () => {
  assert.throws(
    () => normalizeFilingQueryFilters({ issuer: '320193', dateFrom: '2025/01/01' }),
    /dateFrom must be YYYY-MM-DD/,
  );

  assert.throws(
    () =>
      normalizeFilingQueryFilters({
        issuer: '320193',
        dateFrom: '2025-03-01',
        dateTo: '2025-02-01',
      }),
    /dateFrom must be <= dateTo/,
  );
});
