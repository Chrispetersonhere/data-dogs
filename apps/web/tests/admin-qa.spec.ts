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
