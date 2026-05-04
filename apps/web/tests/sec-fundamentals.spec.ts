import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAccessionIndexUrl,
  formatUsdCompact,
} from '../lib/sec/fundamentals';

test('formatUsdCompact handles trillions with two decimals', () => {
  assert.equal(formatUsdCompact(3_500_000_000_000), '3.50T');
});

test('formatUsdCompact handles billions with two decimals', () => {
  assert.equal(formatUsdCompact(394_328_000_000), '394.33B');
});

test('formatUsdCompact handles millions', () => {
  assert.equal(formatUsdCompact(124_500_000), '124.50M');
});

test('formatUsdCompact handles thousands', () => {
  assert.equal(formatUsdCompact(82_300), '82.3K');
});

test('formatUsdCompact handles small values without scaling', () => {
  assert.equal(formatUsdCompact(947), '947');
});

test('formatUsdCompact handles zero', () => {
  assert.equal(formatUsdCompact(0), '0');
});

test('formatUsdCompact handles negatives', () => {
  assert.equal(formatUsdCompact(-1_500_000_000), '-1.50B');
});

test('formatUsdCompact returns dash for null', () => {
  assert.equal(formatUsdCompact(null), '—');
});

test('buildAccessionIndexUrl produces a valid SEC EDGAR URL', () => {
  const url = buildAccessionIndexUrl('0000320193', '0000320193-23-000106');
  assert.equal(
    url,
    'https://www.sec.gov/Archives/edgar/data/320193/000032019323000106/0000320193-23-000106-index.htm',
  );
});

test('buildAccessionIndexUrl strips leading zeros from CIK directory', () => {
  // SEC's filing-index URLs use the unpadded CIK in the path.
  const url = buildAccessionIndexUrl('0001326801', '0001326801-24-000012');
  assert.ok(url?.includes('/edgar/data/1326801/'));
  assert.ok(!url?.includes('/edgar/data/0001326801/'));
});

test('buildAccessionIndexUrl returns null for empty accession', () => {
  assert.equal(buildAccessionIndexUrl('0000320193', ''), null);
});
