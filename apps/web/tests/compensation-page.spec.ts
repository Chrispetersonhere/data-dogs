import assert from 'node:assert/strict';
import test from 'node:test';

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
