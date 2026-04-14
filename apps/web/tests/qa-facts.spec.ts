import assert from 'node:assert/strict';
import test from 'node:test';

const REQUIRED_TEXT = [
  'Admin Fact Reconciliation QA',
  'Raw fact rows',
  'Normalized candidates',
  'Discrepancies (surfaced, not hidden)',
  'Load facts',
  'Issuer CIK',
] as const;

export function assertQaFactsMarkup(markup: string): void {
  for (const fragment of REQUIRED_TEXT) {
    if (!markup.includes(fragment)) {
      throw new Error(`Missing required QA fact text: ${fragment}`);
    }
  }

  if (!markup.includes('ambiguous') && !markup.includes('unit_conflict')) {
    throw new Error('Missing ambiguity/discrepancy signal in QA facts markup');
  }
}

test('assertQaFactsMarkup accepts reconciliation QA markup with discrepancy signal', () => {
  const markup = `
    <h1>Admin Fact Reconciliation QA</h1>
    <label>Issuer CIK</label>
    <button>Load facts</button>
    <h2>Raw fact rows</h2>
    <h2>Normalized candidates</h2>
    <ul><li>us-gaap:Assets -> assets (ambiguous)</li></ul>
    <h2>Discrepancies (surfaced, not hidden)</h2>
    <table><tr><td>unit_conflict</td></tr></table>
  `;

  assert.doesNotThrow(() => assertQaFactsMarkup(markup));
});

test('assertQaFactsMarkup rejects markup that hides ambiguity', () => {
  const markup = `
    <h1>Admin Fact Reconciliation QA</h1>
    <label>Issuer CIK</label>
    <button>Load facts</button>
    <h2>Raw fact rows</h2>
    <h2>Normalized candidates</h2>
    <h2>Discrepancies (surfaced, not hidden)</h2>
  `;

  assert.throws(() => assertQaFactsMarkup(markup), /ambiguity\/discrepancy signal/);
});
