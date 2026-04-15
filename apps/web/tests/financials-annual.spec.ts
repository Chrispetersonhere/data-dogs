import assert from 'node:assert/strict';
import test from 'node:test';

const REQUIRED_TEXT = [
  'Premium table UX',
  'Annual financials',
  'Income statement',
  'Balance sheet',
  'Cash flow',
  'Metric',
  'Source concept',
] as const;

const FORBIDDEN_TEXT = ['Quarterly', 'TTM'] as const;

export function assertFinancialsAnnualMarkup(markup: string): void {
  for (const fragment of REQUIRED_TEXT) {
    if (!markup.includes(fragment)) {
      throw new Error(`Missing required annual financials text: ${fragment}`);
    }
  }

  for (const fragment of FORBIDDEN_TEXT) {
    if (markup.includes(fragment)) {
      throw new Error(`Found forbidden annual financials text: ${fragment}`);
    }
  }
}

test('assertFinancialsAnnualMarkup accepts premium annual financial statement markup', () => {
  const markup = `
    <main>
      <p>Premium table UX</p>
      <h1>Annual financials</h1>
      <section>
        <h2>Income statement</h2>
        <table>
          <tr><th>Metric</th><th>FY 2024</th><th>Source concept</th></tr>
        </table>
      </section>
      <section>
        <h2>Balance sheet</h2>
      </section>
      <section>
        <h2>Cash flow</h2>
      </section>
    </main>
  `;

  assert.doesNotThrow(() => assertFinancialsAnnualMarkup(markup));
});

test('assertFinancialsAnnualMarkup rejects quarterly and TTM leakage', () => {
  const markup = `
    <main>
      <p>Premium table UX</p>
      <h1>Annual financials</h1>
      <h2>Income statement</h2>
      <h2>Balance sheet</h2>
      <h2>Cash flow</h2>
      <p>Quarterly trend</p>
      <p>TTM coverage</p>
      <th>Metric</th>
      <th>Source concept</th>
    </main>
  `;

  assert.throws(() => assertFinancialsAnnualMarkup(markup), /forbidden annual financials text/);
});
