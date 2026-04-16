import assert from 'node:assert/strict';
import test from 'node:test';

// ---------------------------------------------------------------------------
// Required text fragments that prove the screener page has real content.
// ---------------------------------------------------------------------------

const REQUIRED_TEXT = [
  'Stock screener',
  'Filter chips',
  'Query summary',
  'Premium results table',
  'Responsive layout',
  'Ticker',
  'Company',
  'Market cap',
  'Revenue',
  'Gross margin',
  'Net margin',
  'Rev growth',
  'Current ratio',
] as const;

const FORBIDDEN_TEXT = ['Placeholder', 'Coming soon', 'TODO'] as const;

export function assertScreenerPageMarkup(markup: string): void {
  for (const fragment of REQUIRED_TEXT) {
    if (!markup.includes(fragment)) {
      throw new Error(`Missing required screener page text: "${fragment}"`);
    }
  }

  for (const fragment of FORBIDDEN_TEXT) {
    if (markup.includes(fragment)) {
      throw new Error(`Found forbidden placeholder text: "${fragment}"`);
    }
  }
}

// ---------------------------------------------------------------------------
// Acceptance: screener page has all required sections
// ---------------------------------------------------------------------------

test('assertScreenerPageMarkup accepts screener page with filter chips, query summary, results table', () => {
  const markup = `
    <main>
      <h1>Stock screener</h1>
      <h2>Filter chips</h2>
      <button>Size</button>
      <button>Growth</button>
      <button>Margin</button>
      <button>Leverage</button>
      <button>Liquidity</button>
      <h2>Query summary</h2>
      <div>No filters active — showing all 5 companies.</div>
      <h2>Premium results table</h2>
      <table>
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Company</th>
            <th>Market cap</th>
            <th>Revenue</th>
            <th>Gross margin</th>
            <th>Net margin</th>
            <th>Rev growth</th>
            <th>Current ratio</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>AAPL</td><td>Apple Inc.</td></tr>
        </tbody>
      </table>
      <h2>Responsive layout</h2>
    </main>
  `;

  assert.doesNotThrow(() => assertScreenerPageMarkup(markup));
});

// ---------------------------------------------------------------------------
// Acceptance: rejects placeholder leakage
// ---------------------------------------------------------------------------

test('assertScreenerPageMarkup rejects placeholder leakage', () => {
  const markup = `
    <main>
      <h1>Stock screener</h1>
      <h2>Filter chips</h2>
      <h2>Query summary</h2>
      <h2>Premium results table</h2>
      <th>Ticker</th><th>Company</th><th>Market cap</th><th>Revenue</th>
      <th>Gross margin</th><th>Net margin</th><th>Rev growth</th><th>Current ratio</th>
      <h2>Responsive layout</h2>
      <p>Placeholder data</p>
    </main>
  `;

  assert.throws(() => assertScreenerPageMarkup(markup), /forbidden placeholder text/);
});

// ---------------------------------------------------------------------------
// Acceptance: rejects missing filter chips section
// ---------------------------------------------------------------------------

test('assertScreenerPageMarkup rejects missing filter chips section', () => {
  const markup = `
    <main>
      <h1>Stock screener</h1>
      <h2>Query summary</h2>
      <h2>Premium results table</h2>
      <th>Ticker</th><th>Company</th><th>Market cap</th><th>Revenue</th>
      <th>Gross margin</th><th>Net margin</th><th>Rev growth</th><th>Current ratio</th>
      <h2>Responsive layout</h2>
    </main>
  `;

  assert.throws(() => assertScreenerPageMarkup(markup), /Missing required screener page text.*Filter chips/);
});

// ---------------------------------------------------------------------------
// Acceptance: rejects missing query summary
// ---------------------------------------------------------------------------

test('assertScreenerPageMarkup rejects missing query summary', () => {
  const markup = `
    <main>
      <h1>Stock screener</h1>
      <h2>Filter chips</h2>
      <h2>Premium results table</h2>
      <th>Ticker</th><th>Company</th><th>Market cap</th><th>Revenue</th>
      <th>Gross margin</th><th>Net margin</th><th>Rev growth</th><th>Current ratio</th>
      <h2>Responsive layout</h2>
    </main>
  `;

  assert.throws(() => assertScreenerPageMarkup(markup), /Missing required screener page text.*Query summary/);
});

// ---------------------------------------------------------------------------
// Acceptance: rejects missing premium results table
// ---------------------------------------------------------------------------

test('assertScreenerPageMarkup rejects missing premium results table', () => {
  const markup = `
    <main>
      <h1>Stock screener</h1>
      <h2>Filter chips</h2>
      <h2>Query summary</h2>
      <th>Ticker</th><th>Company</th><th>Market cap</th><th>Revenue</th>
      <th>Gross margin</th><th>Net margin</th><th>Rev growth</th><th>Current ratio</th>
      <h2>Responsive layout</h2>
    </main>
  `;

  assert.throws(() => assertScreenerPageMarkup(markup), /Missing required screener page text.*Premium results table/);
});

// ---------------------------------------------------------------------------
// Component file structure checks
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SCREENER_COMPONENTS = [
  join(__dirname, '..', '..', '..', 'packages', 'ui', 'src', 'components', 'screener', 'ScreenerFilterChips.tsx'),
  join(__dirname, '..', '..', '..', 'packages', 'ui', 'src', 'components', 'screener', 'ScreenerResultsTable.tsx'),
  join(__dirname, '..', '..', '..', 'packages', 'ui', 'src', 'components', 'screener', 'ScreenerQuerySummary.tsx'),
];

for (const filePath of SCREENER_COMPONENTS) {
  const basename = filePath.split('/').pop() ?? filePath;

  test(`${basename} imports design tokens`, () => {
    const content = readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('tokens'), `${basename} should import from design tokens`);
  });
}
