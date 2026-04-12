import assert from 'node:assert/strict';
import test from 'node:test';

const REQUIRED_TEXT = [
  'Admin QA Dashboard',
  'Filters',
  'Parser failure summary',
  'Failed artifacts',
  'Job id',
  'Parser',
  'Accession',
  'Artifact path',
  'Apply',
  'Reset',
] as const;

export function assertAdminQaPageMarkup(markup: string): void {
  for (const fragment of REQUIRED_TEXT) {
    if (!markup.includes(fragment)) {
      throw new Error(`Missing required admin QA text: ${fragment}`);
    }
  }

  if (!markup.includes('/admin/artifacts?jobId=')) {
    throw new Error('Missing artifact inspection link in QA dashboard markup');
  }
}

test('assertAdminQaPageMarkup accepts complete QA dashboard markup', () => {
  const markup = `
    <h1>Admin QA Dashboard</h1>
    <h2>Filters</h2>
    <h2>Parser failure summary</h2>
    <h2>Failed artifacts</h2>
    <table>
      <tr>
        <th>Job id</th>
        <th>Parser</th>
        <th>Accession</th>
        <th>Artifact path</th>
      </tr>
    </table>
    <button>Apply</button>
    <a href="/admin/qa">Reset</a>
    <a href="/admin/artifacts?jobId=job-1&artifactPath=raw%2Fa.json">artifact</a>
  `;

  assert.doesNotThrow(() => assertAdminQaPageMarkup(markup));
});

test('assertAdminQaPageMarkup rejects markup missing artifact inspection link', () => {
  const markup = `
    <h1>Admin QA Dashboard</h1>
    <h2>Filters</h2>
    <h2>Parser failure summary</h2>
    <h2>Failed artifacts</h2>
    <table><tr><th>Job id</th><th>Parser</th><th>Accession</th><th>Artifact path</th></tr></table>
    <button>Apply</button>
    <a href="/admin/qa">Reset</a>
  `;

  assert.throws(() => assertAdminQaPageMarkup(markup), /Missing artifact inspection link/);
});
