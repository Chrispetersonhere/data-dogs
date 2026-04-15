import assert from 'node:assert/strict';
import test from 'node:test';

const REQUIRED_TEXT = [
  'Quarterly financials',
  'TTM formula',
  'TTM revenue = FY2025Q1 + FY2024Q4 + FY2024Q3 + FY2024Q2',
  'No mixed-period contamination',
] as const;

const FORBIDDEN_TEXT = ['Implicit TTM', 'ratio engine', 'new metric'] as const;

export function assertFinancialsQuarterlyMarkup(markup: string): void {
  for (const fragment of REQUIRED_TEXT) {
    if (!markup.includes(fragment)) {
      throw new Error(`Missing required quarterly financials text: ${fragment}`);
    }
  }

  for (const fragment of FORBIDDEN_TEXT) {
    if (markup.toLowerCase().includes(fragment.toLowerCase())) {
      throw new Error(`Found forbidden quarterly financials text: ${fragment}`);
    }
  }
}

test('assertFinancialsQuarterlyMarkup accepts explicit quarterly + TTM formula markup', () => {
  const markup = `
    <main>
      <h1>Quarterly financials</h1>
      <p>No mixed-period contamination</p>
      <h2>TTM formula</h2>
      <p>TTM revenue = FY2025Q1 + FY2024Q4 + FY2024Q3 + FY2024Q2</p>
    </main>
  `;

  assert.doesNotThrow(() => assertFinancialsQuarterlyMarkup(markup));
});

test('assertFinancialsQuarterlyMarkup rejects implicit TTM wording', () => {
  const markup = `
    <main>
      <h1>Quarterly financials</h1>
      <h2>TTM formula</h2>
      <p>No mixed-period contamination</p>
      <p>Implicit TTM</p>
      <p>TTM revenue = FY2025Q1 + FY2024Q4 + FY2024Q3 + FY2024Q2</p>
    </main>
  `;

  assert.throws(() => assertFinancialsQuarterlyMarkup(markup), /forbidden quarterly financials text/);
});
