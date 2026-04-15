import assert from 'node:assert/strict';
import test from 'node:test';

const REQUIRED_TEXT = [
  'Premium table UX',
  'Annual financials',
  'Period toggle',
  'Annual',
  'Quarterly',
  'Income statement',
  'Balance sheet',
  'Cash flow',
  'Metric',
  'Source concept',
  'Sticky headers',
  'Export-friendly layout',
  'Responsive',
] as const;

const FORBIDDEN_TEXT = ['Placeholder', 'Coming soon', 'TODO', 'ratio engine', 'screener'] as const;

export function assertFinancialsPageMarkup(markup: string): void {
  for (const fragment of REQUIRED_TEXT) {
    if (!markup.includes(fragment)) {
      throw new Error(`Missing required financials page text: ${fragment}`);
    }
  }

  for (const fragment of FORBIDDEN_TEXT) {
    if (markup.toLowerCase().includes(fragment.toLowerCase())) {
      throw new Error(`Found forbidden financials page text: ${fragment}`);
    }
  }
}

test('assertFinancialsPageMarkup accepts polished financials page markup', () => {
  const markup = `
    <main>
      <p>Premium table UX</p>
      <h1>Annual financials</h1>
      <section>
        <h2>Period toggle</h2>
        <div role="group" aria-label="Period toggle">
          <button aria-pressed="true">Annual</button>
          <button aria-pressed="false">Quarterly</button>
        </div>
      </section>
      <section data-export="financials-table">
        <h3>Income statement</h3>
        <table data-export="financials-data">
          <thead style="position:sticky;top:0">
            <tr><th>Metric</th><th>FY 2024</th><th>Source concept</th></tr>
          </thead>
        </table>
      </section>
      <section data-export="financials-table">
        <h3>Balance sheet</h3>
      </section>
      <section data-export="financials-table">
        <h3>Cash flow</h3>
      </section>
      <section>
        <h2>Sticky headers</h2>
      </section>
      <section>
        <h2>Export-friendly layout</h2>
      </section>
      <section>
        <h2>Responsive</h2>
      </section>
    </main>
  `;

  assert.doesNotThrow(() => assertFinancialsPageMarkup(markup));
});

test('assertFinancialsPageMarkup rejects placeholder leakage', () => {
  const markup = `
    <main>
      <p>Premium table UX</p>
      <h1>Annual financials</h1>
      <h2>Period toggle</h2>
      <button>Annual</button>
      <button>Quarterly</button>
      <h3>Income statement</h3>
      <h3>Balance sheet</h3>
      <h3>Cash flow</h3>
      <th>Metric</th>
      <th>Source concept</th>
      <h2>Sticky headers</h2>
      <h2>Export-friendly layout</h2>
      <h2>Responsive</h2>
      <p>Placeholder data</p>
    </main>
  `;

  assert.throws(() => assertFinancialsPageMarkup(markup), /forbidden financials page text/i);
});

test('assertFinancialsPageMarkup rejects forbidden ratio engine text', () => {
  const markup = `
    <main>
      <p>Premium table UX</p>
      <h1>Annual financials</h1>
      <h2>Period toggle</h2>
      <button>Annual</button>
      <button>Quarterly</button>
      <h3>Income statement</h3>
      <h3>Balance sheet</h3>
      <h3>Cash flow</h3>
      <th>Metric</th>
      <th>Source concept</th>
      <h2>Sticky headers</h2>
      <h2>Export-friendly layout</h2>
      <h2>Responsive</h2>
      <p>Built with ratio engine</p>
    </main>
  `;

  assert.throws(() => assertFinancialsPageMarkup(markup), /forbidden financials page text/i);
});

test('assertFinancialsPageMarkup rejects missing period toggle', () => {
  const markup = `
    <main>
      <p>Premium table UX</p>
      <h1>Annual financials</h1>
      <h3>Income statement</h3>
      <h3>Balance sheet</h3>
      <h3>Cash flow</h3>
      <th>Metric</th>
      <th>Source concept</th>
      <h2>Sticky headers</h2>
      <h2>Export-friendly layout</h2>
      <h2>Responsive</h2>
    </main>
  `;

  assert.throws(() => assertFinancialsPageMarkup(markup), /Missing required financials page text: Period toggle/);
});
