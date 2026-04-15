import assert from 'node:assert/strict';
import test from 'node:test';

const REQUIRED_TEXT = [
  'Filing explorer',
  'Search filters',
  'Quiet premium table',
  'Drilldown links',
  'Responsive layout',
  'Filing date',
  'Form',
  'Accession',
  'Primary document',
  'Filing index',
  'Primary doc',
] as const;

const FORBIDDEN_TEXT = ['Placeholder', 'Coming soon'] as const;

export function assertFilingsExplorerMarkup(markup: string): void {
  for (const fragment of REQUIRED_TEXT) {
    if (!markup.includes(fragment)) {
      throw new Error(`Missing required filings explorer text: ${fragment}`);
    }
  }

  for (const fragment of FORBIDDEN_TEXT) {
    if (markup.includes(fragment)) {
      throw new Error(`Found forbidden placeholder text: ${fragment}`);
    }
  }
}

test('assertFilingsExplorerMarkup accepts explorer markup with filters and drilldowns', () => {
  const markup = `
    <main>
      <h1>Filing explorer</h1>
      <h2>Search filters</h2>
      <h2>Quiet premium table</h2>
      <table>
        <tr>
          <th>Filing date</th>
          <th>Form</th>
          <th>Accession</th>
          <th>Primary document</th>
        </tr>
      </table>
      <a>Filing index</a>
      <a>Primary doc</a>
      <h2>Drilldown links</h2>
      <h2>Responsive layout</h2>
    </main>
  `;

  assert.doesNotThrow(() => assertFilingsExplorerMarkup(markup));
});

test('assertFilingsExplorerMarkup rejects placeholder leakage', () => {
  const markup = `
    <main>
      <h1>Filing explorer</h1>
      <h2>Search filters</h2>
      <h2>Quiet premium table</h2>
      <h2>Drilldown links</h2>
      <h2>Responsive layout</h2>
      <p>Placeholder data</p>
      <th>Filing date</th>
      <th>Form</th>
      <th>Accession</th>
      <th>Primary document</th>
      <a>Filing index</a>
      <a>Primary doc</a>
    </main>
  `;

  assert.throws(() => assertFilingsExplorerMarkup(markup), /forbidden placeholder text/);
});
