import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_APP_DIR = join(__dirname, '..', 'app');

/**
 * Verify that async pages have corresponding loading.tsx files
 * for proper Next.js Suspense-based loading states.
 */
const ASYNC_PAGES_WITH_LOADING = [
  'filings',
  join('filings', '[accession]'),
  join('company', '[companyId]'),
  join('company', '[companyId]', 'financials'),
];

for (const route of ASYNC_PAGES_WITH_LOADING) {
  test(`loading.tsx exists for route ${route}`, () => {
    const loadingPath = join(WEB_APP_DIR, route, 'loading.tsx');
    assert.ok(existsSync(loadingPath), `Missing loading.tsx at ${loadingPath}`);
  });
}

/**
 * Verify that components in packages/ui/src/components/filings
 * import design tokens instead of using hardcoded hex colors.
 */
const FILING_COMPONENTS = [
  join(__dirname, '..', '..', '..', 'packages', 'ui', 'src', 'components', 'filings', 'FilingsPremiumTable.tsx'),
  join(__dirname, '..', '..', '..', 'packages', 'ui', 'src', 'components', 'filings', 'FilingsSearchFilters.tsx'),
];

for (const filePath of FILING_COMPONENTS) {
  const basename = filePath.split('/').pop() ?? filePath;

  test(`${basename} imports design tokens`, () => {
    const content = readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('tokens'), `${basename} should import from design tokens`);
  });

  test(`${basename} does not use hardcoded #6b7280 or #111827 hex`, () => {
    const content = readFileSync(filePath, 'utf-8');
    assert.ok(!content.includes("'#6b7280'"), `${basename} should not contain hardcoded #6b7280`);
    assert.ok(!content.includes("'#111827'"), `${basename} should not contain hardcoded #111827`);
  });
}
