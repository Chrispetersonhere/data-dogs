import assert from 'node:assert/strict';
import test from 'node:test';

import { buildFilingArchiveBaseUrl, splitAvailableSections } from '../lib/api/filing-detail';

const REQUIRED_TEXT = [
  'Filing metadata',
  'Linked documents',
  'Provenance summary',
  'Available sections (if present)',
  'CIK submissions JSON',
  'filing index.json',
  'Matched array index in filings.recent',
  'Extracted fields:',
] as const;

const FORBIDDEN_TEXT = ['Placeholder', 'Coming soon'] as const;

export function assertFilingDetailMarkup(markup: string): void {
  for (const fragment of REQUIRED_TEXT) {
    if (!markup.includes(fragment)) {
      throw new Error(`Missing required filing detail text: ${fragment}`);
    }
  }

  for (const fragment of FORBIDDEN_TEXT) {
    if (markup.includes(fragment)) {
      throw new Error(`Found forbidden placeholder text: ${fragment}`);
    }
  }
}

test('splitAvailableSections parses SEC items into visible sections', () => {
  assert.deepEqual(splitAvailableSections('2.02, 5.02, 8.01'), ['2.02', '5.02', '8.01']);
  assert.deepEqual(splitAvailableSections(''), []);
});

test('buildFilingArchiveBaseUrl composes stable SEC archive path', () => {
  assert.equal(
    buildFilingArchiveBaseUrl('0000320193', '0000320193-24-000123'),
    'https://www.sec.gov/Archives/edgar/data/320193/000032019324000123',
  );
});

test('assertFilingDetailMarkup accepts filing detail content with source traceability', () => {
  const markup = `
    <main>
      <h2>Filing metadata</h2>
      <h2>Linked documents</h2>
      <h2>Provenance summary</h2>
      <a>CIK submissions JSON</a>
      <a>filing index.json</a>
      <p>Matched array index in filings.recent</p>
      <p>Extracted fields:</p>
      <h2>Available sections (if present)</h2>
    </main>
  `;

  assert.doesNotThrow(() => assertFilingDetailMarkup(markup));
});

test('assertFilingDetailMarkup rejects placeholders', () => {
  const markup = `
    <main>
      <h2>Filing metadata</h2>
      <h2>Linked documents</h2>
      <h2>Provenance summary</h2>
      <a>CIK submissions JSON</a>
      <a>filing index.json</a>
      <p>Matched array index in filings.recent</p>
      <p>Extracted fields:</p>
      <h2>Available sections (if present)</h2>
      <p>Coming soon</p>
    </main>
  `;

  assert.throws(() => assertFilingDetailMarkup(markup), /forbidden placeholder text/);
});
