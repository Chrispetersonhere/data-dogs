export type ProvenanceLedgerRow = {
  sourceUrl: string;
  accession: string;
  fetchTimestamp: string;
  checksum: string;
  parserVersion: string;
  jobId: string;
  status: string;
};

const SAMPLE_ROWS: ProvenanceLedgerRow[] = [
  {
    sourceUrl: 'https://data.sec.gov/submissions/CIK0000320193.json',
    accession: '0000320193-24-000001',
    fetchTimestamp: '2026-04-12T00:00:00Z',
    checksum: 'sample-checksum-sha256',
    parserVersion: 'submissions_parser/v1',
    jobId: 'sample-job-001',
    status: 'finished',
  },
];

export async function getProvenanceLedgerRows(): Promise<ProvenanceLedgerRow[]> {
  // Local fallback until runtime DB wiring is connected.
  return SAMPLE_ROWS;
}
