import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeAccession,
  buildDocumentsFromIndex,
} from '../lib/api/filing-detail';

// ---------------------------------------------------------------------------
// Unit tests – normalizeAccession
// ---------------------------------------------------------------------------

test('normalizeAccession trims and returns a valid accession string', () => {
  assert.equal(normalizeAccession('  0000320193-24-000123  '), '0000320193-24-000123');
});

test('normalizeAccession throws on empty input', () => {
  assert.throws(() => normalizeAccession(''), /accession number is required/);
  assert.throws(() => normalizeAccession('   '), /accession number is required/);
});

// ---------------------------------------------------------------------------
// Unit tests – buildDocumentsFromIndex
// ---------------------------------------------------------------------------

test('buildDocumentsFromIndex maps filing index items to FilingDocument[]', () => {
  const items = [
    { name: 'a10k.htm', description: 'Annual report', type: '10-K', size: 42000 },
    { name: 'R1.htm', description: '', type: 'EX-21', size: 1200 },
  ];

  const docs = buildDocumentsFromIndex(items, '0000320193', '0000320193-24-000123');

  assert.equal(docs.length, 2);
  assert.equal(docs[0].filename, 'a10k.htm');
  assert.equal(docs[0].description, 'Annual report');
  assert.ok(docs[0].url.includes('Archives/edgar/data'));
  assert.ok(docs[0].url.endsWith('a10k.htm'));
  assert.equal(docs[1].filename, 'R1.htm');
});

test('buildDocumentsFromIndex filters out items with no filename', () => {
  const items = [
    { name: '', description: 'ghost', type: '', size: 0 },
    { name: 'real.htm', description: 'Actual document', type: 'htm', size: 500 },
  ];

  const docs = buildDocumentsFromIndex(items, '0000320193', '0000320193-24-000123');

  assert.equal(docs.length, 1);
  assert.equal(docs[0].filename, 'real.htm');
});

// ---------------------------------------------------------------------------
// Markup acceptance tests – filing detail page
// ---------------------------------------------------------------------------

const REQUIRED_TEXT = [
  'Filing detail',
  'Filing metadata',
  'Linked documents',
  'Provenance summary',
  'Raw-source drilldown',
  'Source URL',
  'Fetched via',
  'Filing index',
  'Raw source',
  'SEC filing index page',
  'SEC submissions JSON',
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

test('assertFilingDetailMarkup accepts complete filing detail markup', () => {
  const markup = `
    <main>
      <h1>Filing detail</h1>
      <h2>Filing metadata</h2>
      <dl>
        <dt>Accession</dt><dd>0000320193-24-000123</dd>
        <dt>Form type</dt><dd>10-K</dd>
      </dl>
      <h2>Linked documents</h2>
      <table>
        <tr><th>Filename</th><th>Description</th></tr>
        <tr><td>a10k.htm</td><td>Annual report</td></tr>
      </table>
      <h2>Provenance summary</h2>
      <dt>Source URL</dt><dd>https://data.sec.gov/submissions/CIK0000320193.json</dd>
      <dt>Fetched via</dt><dd>SEC EDGAR submissions API</dd>
      <dt>Filing index</dt><dd><a>Raw source</a></dd>
      <h2>Raw-source drilldown</h2>
      <a>SEC filing index page</a>
      <a>SEC submissions JSON</a>
    </main>
  `;

  assert.doesNotThrow(() => assertFilingDetailMarkup(markup));
});

test('assertFilingDetailMarkup rejects markup missing provenance', () => {
  const markup = `
    <main>
      <h1>Filing detail</h1>
      <h2>Filing metadata</h2>
      <h2>Linked documents</h2>
    </main>
  `;

  assert.throws(() => assertFilingDetailMarkup(markup), /Provenance summary/);
});

test('assertFilingDetailMarkup rejects markup missing raw-source drilldown', () => {
  const markup = `
    <main>
      <h1>Filing detail</h1>
      <h2>Filing metadata</h2>
      <h2>Linked documents</h2>
      <h2>Provenance summary</h2>
      <dt>Source URL</dt>
      <dt>Fetched via</dt>
      <dt>Filing index</dt><dd><a>Raw source</a></dd>
    </main>
  `;

  assert.throws(() => assertFilingDetailMarkup(markup), /Raw-source drilldown/);
});

test('assertFilingDetailMarkup rejects placeholder leakage', () => {
  const markup = `
    <main>
      <h1>Filing detail</h1>
      <h2>Filing metadata</h2>
      <h2>Linked documents</h2>
      <h2>Provenance summary</h2>
      <dt>Source URL</dt><dt>Fetched via</dt><dt>Filing index</dt><dd><a>Raw source</a></dd>
      <h2>Raw-source drilldown</h2>
      <a>SEC filing index page</a>
      <a>SEC submissions JSON</a>
      <p>Placeholder data</p>
    </main>
  `;

  assert.throws(() => assertFilingDetailMarkup(markup), /forbidden placeholder text/);
});
