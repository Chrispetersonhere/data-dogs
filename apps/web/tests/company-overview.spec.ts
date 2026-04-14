import assert from 'node:assert/strict';
import test from 'node:test';

const REQUIRED_TEXT = [
  'Premium layout',
  'Issuer metadata',
  'Identity history summary',
  'Filing count summary',
  'Latest filings summary',
  'Filing date',
  'Form',
  'Accession',
  'Primary document',
] as const;

export function assertCompanyOverviewMarkup(markup: string): void {
  for (const fragment of REQUIRED_TEXT) {
    if (!markup.includes(fragment)) {
      throw new Error(`Missing required company overview text: ${fragment}`);
    }
  }
}

test('assertCompanyOverviewMarkup accepts complete company overview markup', () => {
  const markup = `
    <main>
      <p>Premium layout</p>
      <h2>Issuer metadata</h2>
      <h2>Identity history summary</h2>
      <h2>Filing count summary</h2>
      <h2>Latest filings summary</h2>
      <table>
        <tr>
          <th>Filing date</th>
          <th>Form</th>
          <th>Accession</th>
          <th>Primary document</th>
        </tr>
      </table>
    </main>
  `;

  assert.doesNotThrow(() => assertCompanyOverviewMarkup(markup));
});

test('assertCompanyOverviewMarkup rejects markup missing latest filings section', () => {
  const markup = `
    <main>
      <p>Premium layout</p>
      <h2>Issuer metadata</h2>
      <h2>Identity history summary</h2>
      <h2>Filing count summary</h2>
    </main>
  `;

  assert.throws(() => assertCompanyOverviewMarkup(markup), /Latest filings summary/);
});
