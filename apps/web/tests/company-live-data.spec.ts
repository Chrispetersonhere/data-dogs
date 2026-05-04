import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const PAGE_SRC = readFileSync(
  join(ROOT, 'app', 'company', '[companyId]', 'page.tsx'),
  'utf-8',
);

const OVERVIEW_SRC = readFileSync(join(ROOT, 'app', 'overview', 'page.tsx'), 'utf-8');

test('company page imports the ticker resolver', () => {
  assert.match(
    PAGE_SRC,
    /from '\.\.\/\.\.\/\.\.\/lib\/sec\/issuers'/,
    'expected import from lib/sec/issuers',
  );
  assert.ok(PAGE_SRC.includes('findIssuerByTicker'));
  assert.ok(PAGE_SRC.includes('isLikelyTicker'));
});

test('company page imports the fundamentals fetcher', () => {
  assert.match(
    PAGE_SRC,
    /from '\.\.\/\.\.\/\.\.\/lib\/sec\/fundamentals'/,
    'expected import from lib/sec/fundamentals',
  );
  assert.ok(PAGE_SRC.includes('getHeadlineFundamentals'));
  assert.ok(PAGE_SRC.includes('formatUsdCompact'));
});

test('company page surfaces a Headline fundamentals section', () => {
  assert.ok(PAGE_SRC.includes('Headline fundamentals'));
});

test('company page surfaces a Provenance receipt section', () => {
  assert.ok(PAGE_SRC.includes('Provenance receipt'));
  assert.ok(PAGE_SRC.includes('Live from SEC EDGAR'));
});

test('company page links the SEC submissions feed', () => {
  assert.ok(PAGE_SRC.includes('https://data.sec.gov/submissions/CIK'));
});

test('company page calls notFound() on unknown tickers', () => {
  assert.ok(PAGE_SRC.includes("from 'next/navigation'"));
  assert.ok(PAGE_SRC.includes('notFound()'));
});

test('overview page links to ticker-style company URLs', () => {
  assert.ok(
    OVERVIEW_SRC.includes('/company/AAPL'),
    'expected /company/AAPL to appear on the overview page',
  );
  assert.ok(OVERVIEW_SRC.includes("ticker: 'META'"), 'META should be in the featured chips');
  // The chip <a> href interpolates the ticker, not the CIK.
  assert.ok(OVERVIEW_SRC.includes('href={`/company/${c.ticker}`}'));
});
