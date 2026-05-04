import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FEATURED_ISSUERS,
  findIssuerByCik,
  findIssuerByTicker,
  isLikelyTicker,
  resolveCompanyIdToCik,
} from '../lib/sec/issuers';

test('FEATURED_ISSUERS covers AAPL/MSFT/GOOGL/NVDA/META with 10-digit CIKs', () => {
  const tickers = FEATURED_ISSUERS.map((i) => i.ticker);
  for (const required of ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META']) {
    assert.ok(tickers.includes(required), `missing ticker ${required}`);
  }
  for (const issuer of FEATURED_ISSUERS) {
    assert.match(issuer.cik, /^\d{10}$/, `${issuer.ticker} cik is not 10 digits: ${issuer.cik}`);
    assert.ok(issuer.name.length > 0, `${issuer.ticker} has no name`);
  }
});

test('findIssuerByTicker is case-insensitive', () => {
  assert.equal(findIssuerByTicker('AAPL')?.cik, '0000320193');
  assert.equal(findIssuerByTicker('aapl')?.cik, '0000320193');
  assert.equal(findIssuerByTicker(' AaPl ')?.cik, '0000320193');
});

test('findIssuerByTicker returns null for unknown ticker', () => {
  assert.equal(findIssuerByTicker('FOO'), null);
  assert.equal(findIssuerByTicker(''), null);
});

test('findIssuerByCik handles padding', () => {
  assert.equal(findIssuerByCik('320193')?.ticker, 'AAPL');
  assert.equal(findIssuerByCik('0000320193')?.ticker, 'AAPL');
  assert.equal(findIssuerByCik('00000320193')?.ticker, 'AAPL');
});

test('findIssuerByCik returns null for unknown', () => {
  assert.equal(findIssuerByCik('9999999999'), null);
});

test('resolveCompanyIdToCik passes digits through unchanged', () => {
  assert.equal(resolveCompanyIdToCik('320193'), '320193');
  assert.equal(resolveCompanyIdToCik('0000320193'), '0000320193');
});

test('resolveCompanyIdToCik resolves known tickers to padded CIK', () => {
  assert.equal(resolveCompanyIdToCik('AAPL'), '0000320193');
  assert.equal(resolveCompanyIdToCik('msft'), '0000789019');
  assert.equal(resolveCompanyIdToCik('META'), '0001326801');
});

test('resolveCompanyIdToCik returns null for unknown ticker', () => {
  assert.equal(resolveCompanyIdToCik('FOO'), null);
  assert.equal(resolveCompanyIdToCik(''), null);
  assert.equal(resolveCompanyIdToCik('   '), null);
});

test('isLikelyTicker accepts short alphabetic strings', () => {
  for (const t of ['A', 'AAPL', 'BRK.A', 'AAP-L', 'MSFT']) {
    assert.equal(isLikelyTicker(t), true, `${t} should be a likely ticker`);
  }
});

test('isLikelyTicker rejects digits-only and bad shapes', () => {
  for (const t of ['320193', '0000320193', '', '   ', '$$$', '12345']) {
    assert.equal(isLikelyTicker(t), false, `${t} should not be a ticker`);
  }
});
