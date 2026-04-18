import assert from 'node:assert/strict';
import test from 'node:test';

const REQUIRED_TEXT = [
  'Admin Compensation QA',
  'Raw vs parsed comparison (side-by-side)',
  'Raw proxy table',
  'Parsed structured output',
  'Discrepancy highlights',
  'Load compensation QA',
  'Issuer CIK',
  'traceSourceRowId',
] as const;

export function assertCompQaMarkup(markup: string): void {
  for (const fragment of REQUIRED_TEXT) {
    if (!markup.includes(fragment)) {
      throw new Error(`Missing required compensation QA text: ${fragment}`);
    }
  }

  if (!markup.includes('total_mismatch') && !markup.includes('component_mismatch') && !markup.includes('missing_trace')) {
    throw new Error('Missing discrepancy signal in compensation QA markup');
  }
}

test('assertCompQaMarkup accepts compensation QA markup with discrepancy highlights', () => {
  const markup = `
    <h1>Admin Compensation QA</h1>
    <label>Issuer CIK</label>
    <button>Load compensation QA</button>
    <h2>Raw vs parsed comparison (side-by-side)</h2>
    <h3>Raw proxy table</h3>
    <h3>Parsed structured output</h3>
    <span>traceSourceRowId</span>
    <h2>Discrepancy highlights</h2>
    <table><tr><td>total_mismatch</td></tr></table>
  `;

  assert.doesNotThrow(() => assertCompQaMarkup(markup));
});

test('assertCompQaMarkup rejects markup that hides discrepancy highlights', () => {
  const markup = `
    <h1>Admin Compensation QA</h1>
    <label>Issuer CIK</label>
    <button>Load compensation QA</button>
    <h2>Raw vs parsed comparison (side-by-side)</h2>
    <h3>Raw proxy table</h3>
    <h3>Parsed structured output</h3>
    <span>traceSourceRowId</span>
    <h2>Discrepancy highlights</h2>
  `;

  assert.throws(() => assertCompQaMarkup(markup), /Missing discrepancy signal/);
});
