const REQUIRED_HEADERS = [
  'Source URL',
  'Accession',
  'Fetch timestamp',
  'Checksum',
  'Parser version',
  'Job id',
  'Status',
] as const;

export function assertAdminArtifactsPageMarkup(markup: string): void {
  for (const header of REQUIRED_HEADERS) {
    if (!markup.includes(header)) {
      throw new Error(`Missing required admin artifacts header: ${header}`);
    }
  }

  if (!markup.includes('Admin Artifacts')) {
    throw new Error('Missing Admin Artifacts page heading');
  }
}
