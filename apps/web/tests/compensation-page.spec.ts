import assert from 'node:assert/strict';
import test from 'node:test';
import { extractCompensationRowsForTest } from '../lib/api/compensation';

const REQUIRED_TEXT = [
  'Premium layout',
  'Executive table',
  'Total comp history',
  'Source links',
  'Total compensation (USD)',
  'Fiscal year',
  'source link',
] as const;

export function assertCompensationPageMarkup(markup: string): void {
  for (const fragment of REQUIRED_TEXT) {
    if (!markup.includes(fragment)) {
      throw new Error(`Missing required compensation page text: ${fragment}`);
    }
  }
}

test('assertCompensationPageMarkup accepts complete compensation page markup', () => {
  const markup = `
    <main>
      <p>Premium layout</p>
      <h2>Executive table</h2>
      <h2>Total comp history</h2>
      <h2>Source links</h2>
      <table>
        <tr>
          <th>Fiscal year</th>
          <th>Total compensation (USD)</th>
          <a>source link</a>
        </tr>
      </table>
    </main>
  `;

  assert.doesNotThrow(() => assertCompensationPageMarkup(markup));
});

test('assertCompensationPageMarkup rejects markup missing executive table section', () => {
  const markup = `
    <main>
      <p>Premium layout</p>
      <h2>Total comp history</h2>
      <h2>Source links</h2>
    </main>
  `;

  assert.throws(() => assertCompensationPageMarkup(markup), /Executive table/);
});

test('extractCompensationRowsForTest prefers real executive names from summary compensation table rows', () => {
  const sampleHtml = `
    <table>
      <tr>
        <th>Name and Principal Position</th>
        <th>Year</th>
        <th>Salary ($)</th>
        <th>Total ($)</th>
      </tr>
      <tr>
        <td>Tim Cook</td>
        <td>2025</td>
        <td>$3,000,000</td>
        <td>$74,609,802</td>
      </tr>
      <tr>
        <td>Luca Maestri</td>
        <td>2025</td>
        <td>$1,000,000</td>
        <td>$27,180,897</td>
      </tr>
      <tr>
        <td>Summary Compensation Table</td>
        <td>2025</td>
        <td>$0</td>
        <td>$999,999,999</td>
      </tr>
    </table>
  `;

  const rows = extractCompensationRowsForTest({
    rawHtml: sampleHtml,
    filingDate: '2026-01-08',
  });

  assert.equal(rows.length, 2);
  assert.deepEqual(
    rows.map((row) => row.executiveName),
    ['Tim Cook', 'Luca Maestri'],
  );
});

test('extractCompensationRowsForTest excludes compensation-component labels and filing-year rows', () => {
  const sampleHtml = `
    <table>
      <tr>
        <th>Name and Principal Position</th>
        <th>Year</th>
        <th>Salary ($)</th>
        <th>Total ($)</th>
      </tr>
      <tr>
        <td>Base Salary</td>
        <td>2024</td>
        <td>$1,000,000</td>
        <td>$1,000,000</td>
      </tr>
      <tr>
        <td>Jen-Hsun Huang</td>
        <td>2026</td>
        <td>$3,000,000</td>
        <td>$49,866,251</td>
      </tr>
      <tr>
        <td>Jen-Hsun Huang</td>
        <td>2025</td>
        <td>$3,000,000</td>
        <td>$49,866,251</td>
      </tr>
    </table>
  `;

  const rows = extractCompensationRowsForTest({
    rawHtml: sampleHtml,
    filingDate: '2026-05-13',
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].executiveName, 'Jen-Hsun Huang');
  assert.equal(rows[0].fiscalYear, 2025);
});

test('extractCompensationRowsForTest excludes non-person labels like Human Rights and EVP titles', () => {
  const sampleHtml = `
    <table>
      <tr>
        <th>Name and Principal Position</th>
        <th>Year</th>
        <th>Salary ($)</th>
        <th>Total ($)</th>
      </tr>
      <tr>
        <td>Human Rights</td>
        <td>2023</td>
        <td>$1,000,000</td>
        <td>$82,178,212</td>
      </tr>
      <tr>
        <td>EVP, Worldwide Field Operations</td>
        <td>2024</td>
        <td>$1,500,000</td>
        <td>$13,615,450</td>
      </tr>
      <tr>
        <td>Tim Cook</td>
        <td>2024</td>
        <td>$3,000,000</td>
        <td>$63,209,845</td>
      </tr>
    </table>
  `;

  const rows = extractCompensationRowsForTest({
    rawHtml: sampleHtml,
    filingDate: '2025-01-10',
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].executiveName, 'Tim Cook');
});
